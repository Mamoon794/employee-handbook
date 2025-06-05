// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_sXvcrMRmDhqWp2CnaXJAJlhvSUMf12Y",
  authDomain: "employee-app-b6a34.firebaseapp.com",
  projectId: "employee-app-b6a34",
  storageBucket: "employee-app-b6a34.firebasestorage.app",
  messagingSenderId: "662117095928",
  appId: "1:662117095928:web:4926bb43bd1991f091de0d",
  measurementId: "G-KEZQYNDJV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getDatabase(app);
export { app, analytics, db };