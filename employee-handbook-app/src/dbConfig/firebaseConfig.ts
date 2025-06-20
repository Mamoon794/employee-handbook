import { getAuth } from "firebase/auth";
var admin = require("firebase-admin");

var serviceAccount = require("./employee-app-b6a34-firebase-adminsdk-fbsvc-20ac186eaa");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();
const auth = getAuth(app);
export { db, auth };

