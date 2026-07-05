const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// 1. Configuración de Firebase Admin
const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()
const USER_ID = process.env.USER_ID

if (!USER_ID) {
  console.error('❌ Error: USER_ID no encontrado en el archivo .env')
  process.exit(1)
}

async function seedHistory() {
  console.log('🌱 Iniciando siembra de historial para el usuario configurado...')

  try {
    // 2. Obtener los activos actuales
    const assetsRef = db.collection('users').doc(USER_ID).collection('assets')
    const assetsSnapshot = await assetsRef.get()

    if (assetsSnapshot.empty) {
      console.warn('⚠️ No se encontraron activos para este usuario. Agrega activos primero.')
      return
    }

    const currentAssets = []
    assetsSnapshot.forEach((doc) => {
      currentAssets.push({
        id: doc.id,
        currentValue: doc.data().currentValue || 0,
        isArchived: doc.data().isArchived || false
      })
    })

    const activeAssets = currentAssets.filter((a) => !a.isArchived)
    if (activeAssets.length === 0) {
      console.warn('⚠️ No hay activos activos para generar el historial.')
      return
    }

    console.log(`🔍 Se encontraron ${activeAssets.length} activos activos.`)

    // 3. Generar historial para los últimos 14 días
    const batch = db.batch()
    const historyCollectionRef = db.collection('users').doc(USER_ID).collection('balance_history')

    // Comenzamos con el estado actual y vamos hacia atrás aplicando pequeñas fluctuaciones aleatorias
    let baseAssetsValues = {}
    activeAssets.forEach((asset) => {
      baseAssetsValues[asset.id] = asset.currentValue
    })

    // Generaremos de hace 14 días a hoy (del día -14 al día 0)
    for (let i = 14; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      // Variación diaria: aplicamos una fluctuación simulando el mercado del día (-1.5% a +2%)
      const dayAssets = {}
      let totalValue = 0

      activeAssets.forEach((asset) => {
        // En el día 0 (hoy), usamos el valor actual exacto
        if (i === 0) {
          dayAssets[asset.id] = baseAssetsValues[asset.id]
        } else {
          // Para días anteriores, calculamos un valor simulado
          // Hacemos que fluctúe ligeramente a la baja acumulada hacia el pasado
          const changePercent = (Math.random() * 3.5 - 1.5) / 100 // -1.5% a +2%
          const simulatedVal = baseAssetsValues[asset.id] * (1 - changePercent * (15 - i) * 0.1)
          dayAssets[asset.id] = Math.max(0, Math.round(simulatedVal * 100) / 100)
        }
        totalValue += dayAssets[asset.id]
      })

      // Redondear total
      totalValue = Math.round(totalValue * 100) / 100

      const docRef = historyCollectionRef.doc(dateStr)
      batch.set(
        docRef,
        {
          date: dateStr,
          totalValue,
          assets: dayAssets,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      )

      console.log(`📝 Preparado balance para ${dateStr}: ${totalValue} €`)
    }

    await batch.commit()
    console.log('✅ Historial de balance diario sembrado con éxito en Firestore.')
  } catch (error) {
    console.error('❌ Error al sembrar historial de balance:', error)
  }
}

seedHistory()
