var admin = require("firebase-admin");

var serviceAccount = require("./employee-configs.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
const auth = admin.auth();
export { db, auth };

