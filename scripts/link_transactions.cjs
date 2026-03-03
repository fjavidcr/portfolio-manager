const admin = require('firebase-admin');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Check if user ID is provided via env or arg
const userId = process.env.USER_ID || process.argv[2];
if (!userId) {
    console.error('Error: USER_ID not found in .env and not provided as argument.');
    console.error('Usage: node scripts/link_transactions.js [USER_ID]');
    process.exit(1);
}

const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function linkTransactions() {
    console.log(`Linking transactions for user: ${userId}...`);

    const transactionsRef = db.collection('users').doc(userId).collection('transactions');
    const snapshot = await transactionsRef.get();

    if (snapshot.empty) {
        console.log('No transactions found.');
        return;
    }

    console.log(`Found ${snapshot.size} transactions. Processing...`);

    const batch = db.batch();
    let count = 0;
    // Firestore batch limit is 500. For simplicity in this script, we assume < 500 or 
    // we should implement chunking. If > 500, this simple batch will fail.
    // Let's implement simple chunking just in case.

    const chunks = [];
    let currentChunk = db.batch();
    let currentChunkCount = 0;

    snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Determine Asset Name from various possible fields
        let assetName = '';
        if (data.asset) assetName = data.asset;
        else if (data.ticker) assetName = data.ticker;
        else if (data.description) assetName = data.description; // Last resort if standard fields fail

        if (!assetName) {
            console.warn(`Transaction ${doc.id} has no identifiable asset name. Skipping.`);
            return;
        }

        // Generate Asset ID (Same logic as migrate_assets.js)
        const assetId = assetName.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

        if (assetId) {
            currentChunk.update(doc.ref, { assetId: assetId });
            count++;
            currentChunkCount++;

            if (currentChunkCount >= 490) { // Safety margin below 500
                chunks.push(currentChunk);
                currentChunk = db.batch();
                currentChunkCount = 0;
            }
        }
    });

    if (currentChunkCount > 0) {
        chunks.push(currentChunk);
    }

    console.log(`Prepared updates for ${count} transactions.`);
    console.log(`Committing ${chunks.length} batches...`);

    for (const chunk of chunks) {
        await chunk.commit();
    }

    console.log('Successfully linked transactions to assets.');
}

linkTransactions().catch(console.error);
