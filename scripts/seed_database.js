const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// 1. Configuración e Inicio
// Actualizado para apuntar al archivo correcto en ../account/ desde scripts/
const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ID de usuario "Hardcodeado" para pruebas (luego esto vendría del Auth)
const USER_ID = 'gLB5zjmDNfOrd9hpma0Qm9YbPiX2';

// Función genérica para leer CSV y devolver Promesa con los datos
function leerCSV(archivoPath) {
    return new Promise((resolve, reject) => {
        const resultados = [];
        if (!fs.existsSync(archivoPath)) {
            console.warn(`⚠️ Archivo no encontrado: ${archivoPath}. Saltando importación.`);
            resolve([]);
            return;
        }
        fs.createReadStream(archivoPath)
            .pipe(csv())
            .on('data', (data) => resultados.push(data))
            .on('end', () => resolve(resultados))
            .on('error', (error) => reject(error));
    });
}

async function sembrarBaseDeDatos() {
    console.log(`🌱 Iniciando siembra para el usuario: ${USER_ID}...`);

    try {
        // --- A. Cargar Transacciones ---
        // Usando el archivo real
        const archivoTransacciones = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones.csv');
        const transacciones = await leerCSV(archivoTransacciones);

        if (transacciones.length > 0) {
            const batch = db.batch();
            const collectionRef = db.collection('users').doc(USER_ID).collection('transactions');

            // Limit batch size to 500 (Firestore limit) - simple implementation only handles one batch for now
            // If real CSV is > 500 lines, logic needs to be chunked. 
            // For now assuming < 500 for initial seed or we might hit errors.
            // Let's implement a simple chunking just in case.

            let operationCount = 0;
            let currentBatch = db.batch();

            for (const tx of transacciones) {
                const docRef = collectionRef.doc(); // ID auto-generado

                // Limpieza básica de datos (convertir strings de moneda a números)
                // Formato esperado: "1.200,50 €" -> 1200.50
                let amount = 0;
                if (tx.Euros) {
                    amount = parseFloat(tx.Euros.replace(/[.,€\s]/g, '').replace(/(\d{2})$/, '.$1'));
                }

                currentBatch.set(docRef, {
                    asset: tx.Producto || 'Desconocido',
                    type: tx['Tipo de inversión'] || 'General',
                    operation: tx.Operación || 'Buy',
                    amount: amount,
                    date: new Date(), // En un caso real, parsear tx['Fecha de operación']
                    originalData: tx
                });

                operationCount++;
                if (operationCount >= 499) {
                    await currentBatch.commit();
                    currentBatch = db.batch();
                    operationCount = 0;
                }
            }

            if (operationCount > 0) {
                await currentBatch.commit();
            }

            console.log(`✅ Colección 'transactions' creada con ${transacciones.length} documentos.`);
        }

        // --- B. Cargar Configuración (Tickers) ---
        // Archivos no encontrados aun, pero dejamos la logica lista
        const config = await leerCSV('mock_configuracion.csv');
        if (config.length > 0) {
            const batch = db.batch();
            const collectionRef = db.collection('users').doc(USER_ID).collection('config');

            config.forEach((item) => {
                const docId = item.Texto.replace(/\s+/g, '_');
                const docRef = collectionRef.doc(docId);

                batch.set(docRef, {
                    name: item.Texto,
                    icon: item.Icono,
                    platform: item.Plataforma,
                    type: item['Tipos de inversión']
                });
            });

            await batch.commit();
            console.log(`✅ Colección 'config' creada con ${config.length} documentos.`);
        }

        // --- C. Cargar Portfolio (Estado Actual) ---
        // Archivos no encontrados aun, pero dejamos la logica lista
        const portfolio = await leerCSV('mock_portfolio.csv');
        if (portfolio.length > 0) {
            const batch = db.batch();
            const collectionRef = db.collection('users').doc(USER_ID).collection('portfolio');

            portfolio.forEach((item) => {
                const docId = item.Nombre ? item.Nombre.replace(/\s+/g, '_') : 'unknown';
                const docRef = collectionRef.doc(docId);

                const valorActual = parseFloat(item.Euros ? item.Euros.replace(/[.,€\s]/g, '').replace(/(\d{2})$/, '.$1') : 0);

                batch.set(docRef, {
                    assetName: item.Nombre,
                    currentValue: valorActual,
                    targetPercent: item['Porcentaje deseado'],
                    lastUpdated: new Date()
                });
            });

            await batch.commit();
            console.log(`✅ Colección 'portfolio' creada con ${portfolio.length} documentos.`);
        }

        console.log("🚀 Base de datos inicializada correctamente.");

    } catch (error) {
        console.error("❌ Error sembrando la base de datos:", error);
    }
}

sembrarBaseDeDatos();
