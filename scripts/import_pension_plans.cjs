const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const userId = process.env.USER_ID || process.argv[2]
if (!userId) {
  console.error('Error: USER_ID not found in .env and not provided as argument.')
  process.exit(1)
}

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

function parseAmount(eurosStr) {
  if (!eurosStr) return 0.0
  let cleanString = eurosStr
    .replace(' €', '')
    .replace(/\./g, '') // Remove thousands dot
    .replace(',', '.') // Convert decimal comma to dot
  return parseFloat(cleanString)
}

function parseDate(dateStr) {
  if (!dateStr) return new Date()
  const parts = dateStr.trim().split('/')
  if (parts.length !== 3) return new Date()
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  return new Date(year, month - 1, day, 12, 0, 0)
}

function generatePlatformId(entityName) {
  const normalized = entityName.trim().toLowerCase()
  if (normalized.includes('my investor') || normalized.includes('myinvestor')) return 'my_investor'
  if (normalized.includes('openbank')) return 'openbank'
  if (normalized.includes('bbva')) return 'bbva'
  if (normalized.includes('bankinter')) return 'bankinter'
  return normalized.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function generateAssetId(productName) {
  let name = productName.trim()
  if (!name.toUpperCase().endsWith('PP')) {
    name += ' PP'
  }
  return name
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
}

async function importPensionPlans() {
  console.log(`🚀 Iniciando importación de Planes de Pensiones para el usuario: ${userId}...`)

  const csvFilePath = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones PP.csv')
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Archivo CSV no encontrado: ${csvFilePath}`)
    process.exit(1)
  }

  const rawRows = []
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(
        csv({
          headers: [
            'dummy',
            'Producto',
            'TipoInversion',
            'Entidad',
            'Euros',
            'FechaOperacion',
            'Ano',
            'Operacion'
          ],
          skipLines: 2
        })
      )
      .on('data', (data) => {
        if (data.Producto && data.Producto.trim()) {
          rawRows.push(data)
        }
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`📄 Filas encontradas en el CSV: ${rawRows.length}`)

  // 1. Procesar Plataformas
  const platformsMap = new Map()
  rawRows.forEach((row) => {
    const entity = (row.Entidad || '').trim()
    if (entity) {
      const pId = generatePlatformId(entity)
      if (!platformsMap.has(pId)) {
        platformsMap.set(pId, entity)
      }
    }
  })

  console.log(`🏦 Guardando ${platformsMap.size} plataformas...`)
  const userRef = db.collection('users').doc(userId)

  for (const [pId, pName] of platformsMap.entries()) {
    const platformDocRef = userRef.collection('platforms').doc(pId)
    await platformDocRef.set(
      {
        id: pId,
        name: pName,
        iconUrl: ''
      },
      { merge: true }
    )
    console.log(`   - Plataforma: ${pName} (${pId})`)
  }

  // 2. Procesar Activos y Transacciones
  const assetsMap = new Map()
  const transactionsToCreate = []

  rawRows.forEach((row) => {
    const productName = row.Producto.trim()
    const assetId = generateAssetId(productName)
    const platformId = generatePlatformId(row.Entidad || '')
    const amount = parseAmount(row.Euros)
    const date = parseDate(row.FechaOperacion)
    let operation = (row.Operacion || '').trim()

    if (!operation) {
      operation = 'Aportación'
    }

    // Acumular saldo para el activo
    if (!assetsMap.has(assetId)) {
      assetsMap.set(assetId, {
        id: assetId,
        name: productName,
        type: 'Plan de Pensiones',
        platformId: platformId,
        description: (row.TipoInversion || '').trim(),
        currentValue: 0.0
      })
    }

    const assetObj = assetsMap.get(assetId)
    assetObj.currentValue += amount

    // Preparar objeto transacción
    transactionsToCreate.push({
      userId: userId,
      assetId: assetId,
      amount: amount,
      type: operation,
      description: productName,
      date: date
    })
  })

  // 3. Guardar Activos en Firestore
  console.log(`📦 Guardando ${assetsMap.size} activos de Plan de Pensiones en Firestore...`)
  const batchAssets = db.batch()

  assetsMap.forEach((asset, aId) => {
    const roundedValue = Math.max(0, Math.round(asset.currentValue * 100) / 100)
    const assetDocRef = userRef.collection('assets').doc(aId)

    const assetPayload = {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      platformId: asset.platformId,
      description: asset.description,
      currentValue: roundedValue,
      isArchived: roundedValue <= 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }

    batchAssets.set(assetDocRef, assetPayload, { merge: true })
    console.log(
      `   - Activo: ${asset.name} (${asset.id}) | Valor: €${roundedValue.toFixed(2)} | Archivado: ${assetPayload.isArchived}`
    )
  })

  await batchAssets.commit()
  console.log('✅ Activos guardados correctamente.')

  // 4. Guardar Transacciones en Firestore
  console.log(`💳 Guardando ${transactionsToCreate.length} transacciones en Firestore...`)
  const batchTx = db.batch()

  transactionsToCreate.forEach((tx) => {
    const txRef = userRef.collection('transactions').doc()
    batchTx.set(txRef, tx)
  })

  await batchTx.commit()
  console.log('✅ Transacciones guardadas correctamente.')
  console.log('🎉 ¡Importación completada con éxito!')
}

importPensionPlans().catch((err) => {
  console.error('❌ Error durante la importación:', err)
  process.exit(1)
})
