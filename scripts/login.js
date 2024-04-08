import { db, auth } from "../config/firebase-config.js";
import {
  //getAuth,
  //createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  collection,
  where,
  query,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import { loadTopNavBar } from "./common.js";

const btnLogin = document.querySelector(".btnLogin");

// Load the top nav bar
loadTopNavBar();

// async function login1() {
//   console.log("Logging in user -" + document.getElementById("username").value);
//   const userCred = await signInWithEmailAndPassword(auth, document.getElementById("username").value, document.getElementById("password").value);
//   if (userCred) {
//     var user = auth.currentUser;
//     const registeredEmail = user.email;

//     // find the type of the user
//     const userTypeDocRef = doc(db, "registeredUsers", registeredEmail);
//     var userTypeDoc = await getDoc(userTypeDocRef);
//     var userTypeDocData = userTypeDoc.data();
//     if (userTypeDocData) {
//       if (userTypeDocData.userType == "employer") {
//         // Find the company that this user is associated with.
//         console.log("Finding associated company for the user - " + registeredEmail);

//         const companiesRef = collection(db, "companies");
//         const companiesQuery = query(companiesRef, where("registeredEmail", "==", registeredEmail));
//         const docsSnap = await getDocs(companiesQuery);

//         var companyId = "";
//         docsSnap.forEach((doc) => {
//           companyId = doc.id;
//           console.log(doc.data());
//         });
//         if (companyId === "") {
//           alert("No company registered for this user. Logging out...");
//           await signOut(auth);
//           console.log("Logged out.");
//           window.location.href = `../index.html`;
//         } else {
//           window.location.href = `../pages/company-home.html?id=${companyId}`;
//         }
//       }
//       else {
//         console.log("Logged in user is an applicant");
//         window.location.href = `../index.html`;
//       }
//     } else {
//       console.error("Cannot find type of the user.");
//     }
//     //window.location.href = `../pages/company-home.html?id=${companyId}`;
//   } else {
//     console.log("Not logged in.");
//     window.location.href = `../index.html`;
//   }
// }

async function login() {
  console.log("Logging in user -" + document.getElementById("username").value);
  const userCred = await signInWithEmailAndPassword(auth, document.getElementById("username").value, document.getElementById("password").value);
  if (userCred) {
    var user = auth.currentUser;
    const registeredEmail = user.email;

    // find the type of the user
    const userTypeDocRef = doc(db, "registeredUsers", registeredEmail);
    var userTypeDoc = await getDoc(userTypeDocRef);
    var userTypeDocData = userTypeDoc.data();
    if (userTypeDocData) {
      window.location.href = `../index.html`;
    } else {
      alert("User type not found. Logging off...");
      await signOut(auth);
      console.log("Logged out.");
      window.location.href = `../index.html`;
    }

  }
}

btnLogin.addEventListener("click", login);