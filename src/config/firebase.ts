// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgkJ2C30vBWgeqBlxetYlp3hTXveHFdk0",
  authDomain: "isaacasimovlab-52afe.firebaseapp.com",
  projectId: "isaacasimovlab-52afe",
  storageBucket: "isaacasimovlab-52afe.firebasestorage.app",
  messagingSenderId: "424239472098",
  appId: "1:424239472098:web:91c2cc288840c8ffb66dbb",
  measurementId: "G-H5MGSWRT6R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;