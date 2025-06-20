var admin = require("firebase-admin");

var serviceAccount = require("./employee-app-b6a34-firebase-adminsdk-fbsvc-20ac186eaa");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
export { db };

