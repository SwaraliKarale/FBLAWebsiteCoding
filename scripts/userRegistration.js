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
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";
import { UserType, loadTopNavBar, loadUserNavBar } from "./common.js";

var updateProfile = false;
const heading = document.querySelector(".heading");
const btnRegisterUser = document.querySelector(".btnRegisterUser");

// Load the top nav bar
loadTopNavBar();

handleUrlParams();
function handleUrlParams() {
    console.log("Handing params");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("update")) {
        updateProfile = true;
        console.log("Update is true");

        heading.textContent = "Update Profile";
        btnRegisterUser.textContent = "Update";
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserNavBar(UserType.Applicant, true);
        console.log("userProfile - Auth state changed. User logged in - " + user.email);
        loadUserProfile();
    } else {
        loadUserNavBar(UserType.Applicant, false);
    }
});

async function loadUserProfile() {
    console.log("Loading user profile...");

    if (auth.currentUser != null) {
        // find the type of the user
        const userEmail = auth.currentUser.email;
        const userProfileDocRef = doc(db, "userProfiles", userEmail);
        var userProfileDoc = await getDoc(userProfileDocRef);
        var userProfile = userProfileDoc.data();

        if (userProfile) {
            document.getElementById('user-email').value = userProfile.email;
            document.getElementById('user-email').disabled = true;

            document.getElementById('user-password').value = "********";
            document.getElementById('user-password').disabled = true;


            document.getElementById('user-first-name').value = userProfile.firstName;
            document.getElementById('user-last-name').value = userProfile.lastName;
            document.getElementById('user-phone').value = userProfile.phone;
            document.getElementById('user-address-city').value = userProfile.address.city;
            document.getElementById('user-address-state').value = userProfile.address.state;
            document.getElementById('user-address-postal').value = userProfile.address.postal;
            document.getElementById('user-profile-summary').value = userProfile.profileSummary;

            // TODO: Resume
        }
    }
}

async function regisgerUser() {
    console.log("Registering/Updating the user...");

    //Step 1: TODO: Upload resume

    //Step 2: Create User profile
    const firstName = document.getElementById("user-first-name").value;// "First004";
    const lastName = document.getElementById("user-last-name").value; //"Last 004";
    const email = document.getElementById("user-email").value; //"user004@gmail.com";
    const phone = document.getElementById("user-phone").value; //"425-999-2309";
    const address = {
        city: document.getElementById("user-address-city").value, //"Seattle",
        state: document.getElementById("user-address-state").value, //"WA",
        postal: document.getElementById("user-address-postal").value, //98004
    };
    const profileSummary = document.getElementById("user-profile-summary").value;//"This is executive summary of my resume.";

    console.log("Adding user profile...");
    const userProfile = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        address: address,
        profileSummary: profileSummary,
    };

    const docId = email;
    // Step 2.1 - create user profile document
    await setDoc(doc(collection(db, "userProfiles"), docId), userProfile);

    if (updateProfile == false) {
        // Step 2.2 - create registered user with type='applicant' document
        await setDoc(doc(collection(db, "registeredUsers"), docId), { userType: 'applicant' });

        //Step 3: Register user
        const password = document.getElementById("user-password").value;
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("User registered - " + user);

                // await signInWithEmailAndPassword(auth, email, password);
                window.location.href = `../index.html`;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMsg = error.message;
                console.log(`Failed with ${errorCode} - ${errorMsg}`);
            });
    } else {
        window.location.href = `../index.html`;
    }
}

btnRegisterUser.addEventListener("click", regisgerUser);