const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const userId = process.env.USER_ID
if (!userId) {
  console.error('Error: USER_ID not found in .env')
  process.exit(1)
}

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

function parseAmount(eurosStr) {
  if (!eurosStr) return 0.0
  return parseFloat(eurosStr.replace(' €', '').replace(/\./g, '').replace(',', '.'))
}

function parseDate(dateStr) {
  if (!dateStr) return null
  const [day, month, year] = dateStr.split('/')
  // Return standard Date object set to start of day in local time or consistent with how seed did it
  // Seed used: new Date(year, month - 1, day) -> Local time midnight
  return new Date(year, month - 1, day)
}

// Check if two dates are "same day" (Unused now but kept utility)
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

async function fixTransactionTypes() {
  console.log(`Fixing transaction types for user: ${userId}...`)

  // 1. Read CSV
  const csvData = []
  const csvFilePath = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones.csv')

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        if (data.Producto) {
          csvData.push({
            name: data.Producto.trim(),
            amount: parseAmount(data.Euros),
            date: parseDate(data['Fecha de operación']),
            operation: data.Operación,
            raw: data,
            consumed: false // Tracker
          })
        }
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`Loaded ${csvData.length} records from CSV.`)

  // 2. Fetch Firestore Transactions
  const snapshot = await db.collection('users').doc(userId).collection('transactions').get()
  if (snapshot.empty) {
    console.log('No transactions found in Firestore.')
    return
  }
  console.log(`Loaded ${snapshot.size} transactions from Firestore.`)

  // 3. Match and Update
  const chunks = []
  let currentChunk = db.batch()
  let currentChunkCount = 0

  let matchedCount = 0
  let notMatchedCount = 0
  let updatesCount = 0

  snapshot.docs.forEach((doc) => {
    const tx = doc.data()
    const txAmount = tx.amount
    const txName = tx.description || ''

    // SEARCH in CSV (Greedy search: find first match that hasn't been used)
    // Matching criteria: Same Amount AND (Name contains CSV Name OR CSV Name contains Name)
    // We IGNORE date for matching because Firestore dates are likely wrong (seeded as 'now').

    const matchIndex = csvData.findIndex((row) => {
      if (row.consumed) return false // Skip already matched CSV rows

      const sameAmount = Math.abs(row.amount - txAmount) < 0.01

      // Name matching: loose match
      const nameMatch =
        row.name === txName || txName.includes(row.name) || row.name.includes(txName)

      return sameAmount && nameMatch
    })

    if (matchIndex !== -1) {
      matchedCount++
      const match = csvData[matchIndex]
      csvData[matchIndex].consumed = true // Mark as consumed

      const updates = {}

      // Update TYPE
      if (match.operation) {
        updates.type = match.operation
      }
      // Update DATE
      if (match.date) {
        updates.date = match.date
      }

      if (Object.keys(updates).length > 0) {
        currentChunk.update(doc.ref, updates)
        updatesCount++
        currentChunkCount++

        if (currentChunkCount >= 400) {
          chunks.push(currentChunk)
          currentChunk = db.batch()
          currentChunkCount = 0
        }
      }
    } else {
      // console.warn(`No CSV match for TX: ${txName} | ${txAmount}`);
      notMatchedCount++
    }
  })

  if (currentChunkCount > 0) {
    chunks.push(currentChunk)
  }

  console.log(`Analysis Complete:`)
  console.log(`- Matched: ${matchedCount}`)
  console.log(`- Unmatched: ${notMatchedCount}`)
  console.log(`- Updates Queued: ${updatesCount}`)

  console.log(`Committing ${chunks.length} batches...`)
  for (const chunk of chunks) {
    await chunk.commit()
  }

  console.log('Done.')
}

fixTransactionTypes().catch(console.error)
