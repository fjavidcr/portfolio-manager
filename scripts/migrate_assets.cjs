const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

// Check if user ID is provided via env or arg
const userId = process.env.USER_ID || process.argv[2]
if (!userId) {
  console.error('Error: USER_ID not found in .env and not provided as argument.')
  console.error('Usage: node scripts/migrate_assets.js [USER_ID]')
  process.exit(1)
}

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const assets = new Map() // using Map to store unique assets by name

const csvFilePath = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones.csv')

console.log(`Reading CSV from: ${csvFilePath}`)

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Skip rows that don't have a product
    if (!data.Producto) return

    // Use 'Producto' as the unique key (Name)
    const name = data.Producto.trim()

    // Simple sanitization for ID: uppercase, replace spaces with underscores, remove special chars
    const id = name
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')

    if (!assets.has(id)) {
      assets.set(id, {
        id: id,
        name: name,
        type: data['Tipo producto'] || 'General',
        description: data['Tipo de inversión'] || '' // Store extra info here
      })
    }
  })
  .on('end', async () => {
    if (assets.size === 0) {
      console.log('No assets found in the CSV.')
      return
    }

    console.log(`Found ${assets.size} unique assets.`)
    console.log('Starting migration to Firestore...')

    const batch = db.batch()
    const collectionRef = db.collection('users').doc(userId).collection('assets')

    let count = 0
    assets.forEach((asset) => {
      const docRef = collectionRef.doc(asset.id)
      batch.set(docRef, asset)
      count++
    })

    try {
      await batch.commit()
      console.log(`Successfully migrated ${count} assets to users/${userId}/assets.`)
    } catch (error) {
      console.error('Error writing to Firestore:', error)
    }
  })
