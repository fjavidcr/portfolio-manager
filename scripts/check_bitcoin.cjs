const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const serviceAccount = require(
  path.join(__dirname, '../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const USER_ID = process.env.USER_ID

async function checkBitcoin() {
  console.log('--- CHECKING BITCOIN ASSET AND TRANSACTIONS ---\n')

  // 1. Get all assets
  const assetsSnap = await db.collection('users').doc(USER_ID).collection('assets').get()
  console.log(`Total assets: ${assetsSnap.size}`)

  const bitcoinAssets = []
  assetsSnap.forEach((doc) => {
    const data = doc.data()
    const id = doc.id
    const name = data.name || ''

    if (
      id.toLowerCase().includes('bitcoin') ||
      id.toLowerCase().includes('btc') ||
      name.toLowerCase().includes('bitcoin') ||
      name.toLowerCase().includes('btc')
    ) {
      bitcoinAssets.push({ id, ...data })
    }
  })

  console.log(`\nBitcoin-related assets found: ${bitcoinAssets.length}`)
  bitcoinAssets.forEach((asset) => {
    console.log(`  - ID: "${asset.id}", Name: "${asset.name}"`)
  })

  // 2. Get all transactions
  const txSnap = await db.collection('users').doc(USER_ID).collection('transactions').get()
  console.log(`\nTotal transactions: ${txSnap.size}`)

  // 3. Find Bitcoin transactions
  const bitcoinTxs = []
  const uniqueAssetIds = new Set()

  txSnap.forEach((doc) => {
    const data = doc.data()
    uniqueAssetIds.add(data.assetId)

    const assetId = data.assetId || ''
    if (assetId.toLowerCase().includes('bitcoin') || assetId.toLowerCase().includes('btc')) {
      bitcoinTxs.push({ id: doc.id, ...data })
    }
  })

  console.log(`\nBitcoin transactions found: ${bitcoinTxs.length}`)
  if (bitcoinTxs.length > 0) {
    console.log('Sample Bitcoin transactions:')
    bitcoinTxs.slice(0, 5).forEach((tx) => {
      console.log(`  - AssetID: "${tx.assetId}", Type: ${tx.type}, Amount: ${tx.amount}€`)
    })

    const totalInvested = bitcoinTxs
      .filter((tx) =>
        ['Plan', 'Aportación', 'Retirada', 'Dividendo', 'Traspaso', 'Venta'].includes(tx.type)
      )
      .reduce((sum, tx) => sum + tx.amount, 0)
    console.log(`\nTotal invested in Bitcoin: ${totalInvested.toFixed(2)}€`)
  } else {
    console.log('\n⚠️  No transactions found with assetId containing "bitcoin" or "btc"')
    console.log('\nAll unique assetIds in transactions:')
    Array.from(uniqueAssetIds)
      .sort()
      .forEach((id) => {
        console.log(`  - "${id}"`)
      })
  }

  process.exit()
}

checkBitcoin().catch(console.error)
