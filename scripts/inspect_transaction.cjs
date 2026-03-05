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
const userId = process.env.USER_ID

if (!userId) {
  console.error('No USER_ID found.')
  process.exit(1)
}

db.collection('users')
  .doc(userId)
  .collection('transactions')
  .limit(1)
  .get()
  .then((snap) => {
    if (!snap.empty) {
      console.log(JSON.stringify(snap.docs[0].data(), null, 2))
    } else {
      console.log('No transactions found')
    }
  })
  .catch((err) => console.error(err))
