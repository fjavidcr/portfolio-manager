const admin = require('firebase-admin')

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// Check if user ID is provided via env or arg
const userId = process.env.USER_ID || process.argv[2]
if (!userId) {
  console.error('Error: USER_ID not found in .env and not provided as argument.')
  console.error('Usage: node scripts/clean_transactions.js [USER_ID]')
  process.exit(1)
}

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function cleanTransactions() {
  console.log(`Cleaning transactions for user: ${userId}...`)

  const transactionsRef = db.collection('users').doc(userId).collection('transactions')
  const snapshot = await transactionsRef.get()

  if (snapshot.empty) {
    console.log('No transactions found.')
    return
  }

  console.log(`Found ${snapshot.size} transactions. Processing...`)

  const batch = db.batch()
  let count = 0

  // Chunking logic (simple limit of 400 per commit to be safe)
  const chunks = []
  let currentChunk = db.batch()
  let currentChunkCount = 0

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const updates = {}
    const deletions = {}

    // 1. Migrate amount_eur -> amount
    if (data.amount_eur !== undefined && data.amount === undefined) {
      updates.amount = data.amount_eur
    }
    if (data.amount_eur !== undefined) deletions.amount_eur = admin.firestore.FieldValue.delete()

    // 2. Migrate ticker/asset -> description (if missing)
    let newDescription = data.description
    if (!newDescription) {
      newDescription = data.ticker || data.asset || ''
      if (newDescription) updates.description = newDescription
    }
    if (data.ticker !== undefined) deletions.ticker = admin.firestore.FieldValue.delete()
    if (data.asset !== undefined) deletions.asset = admin.firestore.FieldValue.delete()

    // 3. Migrate operation -> type
    if (data.operation !== undefined) {
      // console.log(`Migrating operation '${data.operation}' to type for tx ${doc.id}`); // Optional verbose log
      updates.type = data.operation
    }
    if (data.operation !== undefined) deletions.operation = admin.firestore.FieldValue.delete()

    // 4. Remove other unused fields
    const unusedFields = ['category', 'productType', 'year', 'originalData']
    unusedFields.forEach((field) => {
      if (data[field] !== undefined) {
        deletions[field] = admin.firestore.FieldValue.delete()
      }
    })

    // 5. Ensure assetId exists
    if (!data.assetId) {
      console.warn(`[WARN] Transaction ${doc.id} missing assetId.`)
      // Optionally, we could try to link it here too, but link_transactions.js should have done it.
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0 || Object.keys(deletions).length > 0) {
      const finalUpdate = { ...updates, ...deletions }
      currentChunk.update(doc.ref, finalUpdate)

      count++
      currentChunkCount++

      if (currentChunkCount >= 400) {
        chunks.push(currentChunk)
        currentChunk = db.batch()
        currentChunkCount = 0
      }
    }
  })

  if (currentChunkCount > 0) {
    chunks.push(currentChunk)
  }

  console.log(`Prepared updates for ${count} transactions.`)
  console.log(`Committing ${chunks.length} batches...`)

  for (const chunk of chunks) {
    await chunk.commit()
  }

  console.log('Successfully cleaned transactions.')
}

cleanTransactions().catch(console.error)
