const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serviceAccount = require(path.join(__dirname, '../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const userId = process.env.USER_ID;

db.collection('users').doc(userId).collection('portfolio').get().then(snap => {
    console.log(`Portfolio docs found: ${snap.size}`);
    if (snap.size > 0) {
        console.log('Sample doc:', snap.docs[0].data());
    } else {
        console.log('Portfolio collection is EMPTY.');
    }
}).catch(console.error);
