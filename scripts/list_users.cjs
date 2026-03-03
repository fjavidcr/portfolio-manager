const admin = require('firebase-admin');
const path = require('path');

// Configuración e Inicio
const serviceAccount = require('../account/portfolio-manager-fj-firebase-adminsdk-fbsvc-eb546ca89f.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const listAllUsers = async (nextPageToken) => {
    // List batch of users, 1000 at a time.
    try {
        const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

        if (listUsersResult.users.length === 0) {
            console.log("No users found in this project yet.");
            return;
        }

        console.log("Users available in Firebase Auth:");
        console.log("------------------------------------------------");
        listUsersResult.users.forEach((userRecord) => {
            console.log(`Email: ${userRecord.email} \t| UID: ${userRecord.uid}`);
        });
        console.log("------------------------------------------------");

        if (listUsersResult.pageToken) {
            // List next batch of users.
            listAllUsers(listUsersResult.pageToken);
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
};

// Start listing users from the beginning, 1000 at a time.
listAllUsers();
