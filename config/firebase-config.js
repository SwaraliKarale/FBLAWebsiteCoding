// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import {
  getFirestore,
  FieldValue,
  doc,
  getDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";


import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_1bBSi18y2eP7Sy-YbpP78ZGakj5oXik",
  authDomain: "fbla-jobportal.firebaseapp.com",
  databaseURL: "https://fbla-jobportal-default-rtdb.firebaseio.com",
  projectId: "fbla-jobportal",
  storageBucket: "fbla-jobportal.appspot.com",
  messagingSenderId: "89395000282",
  appId: "1:89395000282:web:bf8aa9dbf4a1254d33c6e3",
  measurementId: "G-7ZJCZ52SY4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage();


var currentLoggedInUser = null;
var isUserLoggedIn = false;
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth state changed. User logged in - " + user.email);
    currentLoggedInUser = user;
    isUserLoggedIn = true;
  } else {
    console.log("Auth state changed. No user is logged in.");
    currentLoggedInUser = null;
    isUserLoggedIn = false;
  }
});

const getCurrentUser = () => {
  console.log("Getting current user...");
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    console.log("User is - " + user.email);
  } else {
    console.log("user is null");
  }
  return user;
  }


export {app, db, auth, storage, FieldValue}