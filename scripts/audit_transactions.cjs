const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const serviceAccount = require(
  path.join(__dirname, '../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const USER_ID = process.env.USER_ID
const CSV_PATH = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones.csv')

async function readCSV() {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (data) => {
        let rawAmount = data['Euros'] || '0'
        // Robust parsing for "1.234,56 €" or "-100,00 €"
        let cleanString = rawAmount
          .replace(' €', '')
          .replace(/\./g, '') // Remove thousands
          .replace(',', '.') // Decimal comma to dot

        const cleanAmount = parseFloat(cleanString)
        const type = (data['Operación'] || '').trim()

        results.push({
          name: data['Producto'] || '',
          amount: cleanAmount,
          type: type,
          rawDate: data['Fecha de operación'],
          originalRow: data
        })
      })
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

async function audit() {
  console.log('--- STARTING AUDIT ---')

  // 1. Read Data
  const csvData = await readCSV()
  console.log(`CSV Rows: ${csvData.length}`)

  const snapshot = await db.collection('users').doc(USER_ID).collection('transactions').get()
  const firestoreData = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }))
  console.log(`Firestore Docs: ${firestoreData.length}`)

  // 2. Calculate Totals

  // A) CSV Raw Sum (User Logic)
  let csvRawSum = 0
  csvData.forEach((row) => {
    // Sum everything directly
    csvRawSum += row.amount
  })

  // B) CSV Net Invested (App Logic: Only Inflows/Outflows)
  let csvNetInvested = 0
  csvData.forEach((row) => {
    const t = row.type.toLowerCase()
    if (['aportación', 'plan', 'deposit'].includes(t)) {
      csvNetInvested += row.amount
    } else if (['retirada', 'withdrawal'].includes(t)) {
      csvNetInvested += row.amount // amount is likely negative
    }
    // Exclude 'venta', 'traspaso', 'transferencia'
  })

  // C) App Net Invested (Using same logic as PortfolioService)
  let appNetInvested = 0
  firestoreData.forEach((tx) => {
    const t = (tx.type || '').toLowerCase()
    if (['deposit', 'aportación', 'plan', 'retirada', 'withdrawal'].includes(t)) {
      appNetInvested += tx.amount
    }
  })

  // D) App Raw Sum (If we summed everything in DB)
  let appRawSum = 0
  firestoreData.forEach((tx) => {
    appRawSum += tx.amount
  })

  console.log(`\n--- RESULTS ---`)
  console.log(`1. CSV Raw Sum (Spreadsheet Total):      €${csvRawSum.toFixed(2)}`)
  console.log(`2. CSV Net Invested (Filtered Logic):    €${csvNetInvested.toFixed(2)}`)
  console.log(`3. App Net Invested (Displayed in Home): €${appNetInvested.toFixed(2)}`)
  console.log(`4. App Raw Sum (All DB Docs):            €${appRawSum.toFixed(2)}`)

  console.log(`\n--- ANALYSIS ---`)
  if (Math.abs(csvRawSum - appNetInvested) > 100) {
    console.log(
      "Difference explained: The App filters 'Net Invested' only (Input - Output), ignoring Sales/Transfers."
    )
    console.log("The Spreadsheet calculates 'Raw Sum', which subtracts Internal Sales/Transfers.")
  }

  if (Math.abs(csvNetInvested - appNetInvested) < 1) {
    console.log("✅ The App's matching logic matches the CSV's filtered logic correctly.")
  } else {
    console.log('❌ Discrepancy in logic match. Detailed debug needed.')
    console.log(`Diff: €${(appNetInvested - csvNetInvested).toFixed(2)}`)
  }

  process.exit()
}

audit().catch(console.error)
