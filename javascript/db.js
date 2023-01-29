const admin = require("firebase-admin");

// use serviceAccountKey.json file
const serviceAccount = require("./serviceAccountKey.json");

module.exports = admin.initializeApp({
  credential: admin.credential.cert( serviceAccount),
});

const db = admin.firestore();

module.exports = db;