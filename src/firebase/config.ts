import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKXMD9Yw0cM9x629WsU7EeKcT6QBRpy1g",
  authDomain: "canaryvision-botswana.firebaseapp.com",
  projectId: "canaryvision-botswana",
  storageBucket: "canaryvision-botswana.firebasestorage.app",
  messagingSenderId: "692166053596",
  appId: "1:692166053596:web:aac3e0a0675741280fae19",
  measurementId: "G-5FG3ZCPW2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
