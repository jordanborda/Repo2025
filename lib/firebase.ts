// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBHMi30TeveocwMWJaWkO4KPbfUyZZooe4",
  authDomain: "testdev-64ca2.firebaseapp.com",
  databaseURL: "https://testdev-64ca2-default-rtdb.firebaseio.com",
  projectId: "testdev-64ca2",
  storageBucket: "testdev-64ca2.appspot.com",
  messagingSenderId: "324425967844",
  appId: "1:324425967844:web:badf555768d587e0f424f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;