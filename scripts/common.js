import { db, auth, storage } from "../config/firebase-config.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
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

const UserType = {
    None: "none",
    Applicant: "applicant",
    Employer: "employer"
};

function loadTopNavBar() {
    console.log("Loading the top navbar.");
    const topNavbar = document.querySelector(".top-navbar");

    fetch('../pages/top-navbar.html')
        .then(res => res.text())
        .then(data => {
            topNavbar.innerHTML = data;
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            eval(doc.querySelector('script').textContent);
        })
        .catch((err) => {
            console.error("Error while loading navbar - " + err);
        });
}

var userNavBar = '../pages/user-navbar.html';
var employerNavBar = '../pages/employer-navbar.html';

function loadUserNavBar(userType, show) {
    console.log("Loading the side navbar for user type - " + userType);
    const userSideNavbar = document.querySelector(".side-navbar");

    var navBar = "";
    if (userType == UserType.Applicant) {
        navBar = userNavBar;
    } else if (userType == UserType.Employer) {
        navBar = employerNavBar;
    } else {
        navBar = "";
        show = false;
    }

    if (show) {
        fetch(navBar) //'../pages/user-navbar.html')
            .then(res => res.text())
            .then(data => {
                userSideNavbar.innerHTML = data;
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                eval(doc.querySelector('script').textContent);
            })
            .catch((err) => {
                console.error("Error while loading navbar - " + err);
            });
    } else {
        userSideNavbar.innerHTML = "";
    }
}

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         //loadUserNavBar(true);
//         console.log("common - Auth state changed. User logged in - " + user.email);
//         //loadUserProfile();
//     } else {
//         //loadUserNavBar(false);
//     }
// });

export { UserType, loadTopNavBar, loadUserNavBar }