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


loadTopNavBar();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("PostJob - Auth state changed. User logged in - " + user.email);

        const userTypeDocRef = doc(db, "registeredUsers", user.email);
        var userTypeDoc = await getDoc(userTypeDocRef);
        var userTypeDocData = userTypeDoc.data();
        if (userTypeDocData) {
            if (userTypeDocData.userType == "employer") {
                loadUserNavBar(UserType.Employer, true);
            } else {
                alert("Logged in user is not registered as an employer.");
                window.location.href = '../index.html';
            }
        }
    } else {
        console.log("Index - Auth state changed, no user logged in.");
        alert("You need to login to post a job.");
        window.location.href = '../index.html';
    }
});

var btnPostJob = document.querySelector(".btnPostJob");
var btnCancel = document.querySelector(".btnCancel");


const getDate = () => {
    const date = new Date();
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

async function postJob() {
    console.log("Posting the job for you ...");

    console.log("Post a job on date - " + getDate());

    // 1. Get company info
    var user = auth.currentUser;

    if (!user) {
        console.log("no user logged in");
        alert("No user is logged in.");
        return;
    } else {
        const registeredEmail = user.email;
        console.log("Registered user is - " + registeredEmail);

        const companiesRef = collection(db, "companies");
        const companiesQuery = query(companiesRef, where("registeredEmail", "==", registeredEmail));
        const docsSnap = await getDocs(companiesQuery);

        if (!docsSnap.empty) {
            const companyId = docsSnap.docs[0].id;
            const company = docsSnap.docs[0].data();
            console.log("Company is: ");
            console.log(company);

            // post the job
            await addDoc(collection(db, "jobs"), {
                companyId: companyId,
                companyName: company.name,
                aboutCompany: company.about,
                companyLogo: company.logoLink,
                benefits: company.benefits,
                jobType: document.getElementById("job-type").value,
                jobTitle: document.getElementById("job-title").value,
                description: document.getElementById("job-desciption").value,
                responsibilities: document.getElementById("job-responsibilites").value,
                qualifications: document.getElementById("job-qualifications").value,
                location: document.getElementById("job-location").value,
                minSalary: document.getElementById("job-min-salary").value,
                maxSalary: document.getElementById("job-max-salary").value,
                postedOn: getDate(),
                numberOfApplications: 0
            });

            console.log("Posted a job!");

        } else {
            console.log("No compnay is regisgered with the email - " + registeredEmail);
        }

        window.location.href = `../index.html`;
    }

}

const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get("companyid");
function onCancel() {
    window.location.href = `../index.html`;
}

btnPostJob.addEventListener("click", postJob);
btnCancel.addEventListener("click", onCancel);