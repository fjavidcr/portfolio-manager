const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const results = [];

const csvFilePath = path.join(__dirname, '../csv/Inversiones y gastos - Transacciones.csv');

fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => {
        // Skip rows that don't have a product (like header rows or empty rows)
        if (!data.Producto) return;

        // Aquí limpias y parseas tus datos del CSV
        // Ejemplo: Convertir "212,00 €" a 212.00 (float)
        const cleanAmount = parseFloat(
            data.Euros
                .replace(' €', '')
                .replace(/\./g, '')
                .replace(',', '.')
        );

        // Asegúrate de parsear bien el formato DD/MM/YYYY
        const [day, month, year] = data['Fecha de operación'].split('/');
        const date = new Date(year, month - 1, day);

        results.push({
            ticker: data.Producto, // O el campo que mapees
            type: data.Operación,   // "Aportación", "Plan", etc.
            amount_eur: cleanAmount,
            date: date,
            category: data['Tipo de inversión'], // "Criptomonedas", "Renta variable"...
            productType: data['Tipo producto'],
            year: parseInt(data.Año)
        });
    })
    .on('end', async () => {
        if (results.length === 0) {
            console.log('No se encontraron transacciones en el CSV.');
            return;
        }

        console.log(`Procesando ${results.length} transacciones...`);

        const batch = db.batch();
        // REMINDER: Update 'tu_user_id' with your actual Firebase User ID
        const collectionRef = db.collection('users').doc('tu_user_id').collection('transactions');

        results.forEach((doc) => {
            const docRef = collectionRef.doc(); // ID automático
            batch.set(docRef, doc);
        });

        // await batch.commit(); // Uncomment this line to actually upload to Firestore
        console.log('¡Prueba de migración completada! Se procesaron los datos correctamente.');
        console.log('Ejemplo de la primera transacción:', results[0]);
        console.log('NOTA: El commit a Firestore está comentado actualmente por seguridad.');
    });