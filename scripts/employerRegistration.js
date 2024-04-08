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
var logoLink = "";
const heading = document.querySelector(".heading");
const btnEmployerRegistration = document.querySelector(".btnEmployerRegistration");
const btnInputFile = document.querySelector('.inputFile');

loadTopNavBar();

handleUrlParams();

function handleUrlParams() {
    console.log("Handing params");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("update")) {
        updateProfile = true;
        console.log("Udate is true");

        heading.textContent = "Update Company Profile";
        btnEmployerRegistration.textContent = "Update";
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("userProfile - Auth state changed. User logged in - " + user.email);
        console.log("Loading user navbar");
        loadUserNavBar(UserType.Employer, true);
        loadCompanyProfile();

    }
});

async function loadCompanyProfile() {
    console.log("Loading company profile...");

    if (auth.currentUser != null) {
        // find the type of the user
        const companyEmail = auth.currentUser.email;

        const companyProfileDocRef = doc(db, "companies", companyEmail);
        var companyProfileDoc = await getDoc(companyProfileDocRef);
        var companyProfile = companyProfileDoc.data();

        if (companyProfile) {
            document.getElementById('company-name').value = companyProfile.name;
            document.getElementById('company-email').value = companyProfile.email;
            document.getElementById('company-phone').value = companyProfile.phone;
            document.getElementById('registered-email').value = companyProfile.registeredEmail;
            document.getElementById('registered-email').disabled = true;

            document.getElementById('company-address-street').value = companyProfile.address.street;
            document.getElementById('company-address-city').value = companyProfile.address.city;
            document.getElementById('company-address-state').value = companyProfile.address.state;
            document.getElementById('company-address-postal').value = companyProfile.address.postal;
            document.getElementById('company-about-mission').value = companyProfile.about.mission;
            document.getElementById('company-about-values').value = companyProfile.about.values;
            document.getElementById('company-about-journey').value = companyProfile.about.journey;
            document.getElementById('company-about-leadership').value = companyProfile.about.leadership;

            document.getElementById('company-benefits-compensation').value = companyProfile.benefits.compensation;
            document.getElementById('company-benefits-careerdev').value = companyProfile.benefits.careerDev;
            document.getElementById('company-benefits-worklife').value = companyProfile.benefits.workLife;
            document.getElementById('company-benefits-perks').value = companyProfile.benefits.additionalPerks;
            document.getElementById('company-benefits-healthcare').value = companyProfile.benefits.healthCare;

            logoLink = companyProfile.logoLink;
        }
    }
}


async function employerRegistration() {
    console.log("Reginstring the employer...");

    // 1. Fetch all the registration info from the HTML form
    // 2. Create a new doc in companies collection with all the info
    // 3. create a user account using provided registered user and password

    // 1. Fetch all the registration info from the HTML form
    const name = "Pet Pros";
    const email = "info@petpros.com";
    const phone = "425-123-0001";
    const address = {
        street: "#123 145th AVE SE",
        city: "Renton",
        state: "WA",
        postal: "90001"
    };
    const about = {
        mission: "our mission",
        values: "our values",
        journey: "journey and achievements so far",
        leadership: "details on our leadership team"
    };
    const benefits = {
        compensation: "key components and competitive compenstation info",
        careerDev: "opportunities to grow with us",
        workLife: "vacations and addition info to greater work-life balance",
        additionalPerks: "extra discounts, gym memberships, etc."
    };
    const registeredEmail = "jobs@petpros.com";

    // 2. Create a new doc in companies collection with all the info
    console.log("Adding company...");
    await addDoc(collection(db, "companies"), {
        name: name,
        email: email,
        phone: phone,
        address: address,
        about: about,
        benefits: benefits,
        registeredEmail: registeredEmail,
        //logoLink
    });
    console.log("Comapny added.");

    // 3. create a user account using provided registered user and password
    const registeredEmailPassword = "jobs@petpros.com";
    createUserWithEmailAndPassword(auth, registeredEmail, registeredEmailPassword)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created - " + user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMsg = error.message;
            console.log(`Failed with ${errorCode} - ${errorMsg}`);
        });
}

async function getJobsForMyCompany() {
    var user = auth.currentUser;

    if (!user) {
        console.log("no user logged in");
    } else {
        const registeredEmail = user.email;
        console.log("Registered user is - " + registeredEmail);

        const companiesRef = collection(db, "companies");
        const companiesQuery = query(companiesRef, where("registeredEmail", "==", registeredEmail));
        const docsSnap = await getDocs(companiesQuery);

        var companyName = "";
        var companyId = "";
        docsSnap.forEach((doc) => {
            companyName = doc.data().name;
            console.log("Company Name is: " + companyName);
            companyId = doc.id;
            console.log("Company id is: " + companyId);
            console.log(doc.data());
        });

        // Get jobs with matching companyId
        const jobsRef = collection(db, "jobs");
        const jobsQuery = query(jobsRef, where("companyId", "==", companyId));
        const jobsSnapshot = await getDocs(jobsQuery);

        console.log("Getting jobs for company - " + companyName);
        jobsSnapshot.forEach((doc) => {
            console.log("Job ------ ");
            console.log(doc.data());
        });
        console.log("All done.")


    }
}

const getDate = () => {
    const date = new Date();
    return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

async function postJob() {
    console.log("Post a job - " + getDate());

    // 1. Get compnay info
    var user = auth.currentUser;

    if (!user) {
        console.log("no user logged in");
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
                benefits: company.benefits,
                jobType: "Full time",
                jobTitle: "Marketing Manager",
                description: "This is job description",
                responsibilities: "These are job responsibilies",
                qualifications: "Requied qualifications",
                location: "Santa Clara, CA",
                minSalary: "75,000",
                maxSalary: "95,000",
                postedOn: getDate(),
                numberOfApplications: 0
            });

            console.log("Posted a job!");

        } else {
            console.log("No compnay is regisgered with the email - " + registeredEmail);
        }
    }

}

var fileItem;
var fileName;
function getFile(e) {
    console.log("Inside getFile");
    fileItem = e.target.files[0];
    console.log("Get file " + fileItem.name);
    fileName = fileItem.name;
}

async function uploadLogo() {
  const filePath = `companylogos/${fileName}`;
  const newResumeRef = ref(storage, filePath);
  console.log("Starting to update the logo - " + filePath);
  await uploadBytesResumable(newResumeRef, fileItem);
  console.log("Resume uploaded. Getting download URL...");
  const downloadURL = await getDownloadURL(newResumeRef);
  console.log("Got the download URL - " + downloadURL);
  return downloadURL;
}

async function registerEmployer() {
    console.log("Registering the employer info...");

    console.log("Signing up from registration page with - " + document.getElementById("registered-email").value);

    var downloadURL = "";
    if (updateProfile == false) {
        downloadURL = await uploadLogo();
    } else {
        downloadURL = logoLink;
    }

    const name = document.getElementById("company-name").value;
    const email = document.getElementById("company-email").value;
    const phone = document.getElementById("company-phone").value;
    const address = {
        street: document.getElementById("company-address-street").value,
        city: document.getElementById("company-address-city").value,
        state: document.getElementById("company-address-state").value,
        postal: document.getElementById("company-address-postal").value
    };
    const about = {
        mission: document.getElementById("company-about-mission").value,
        values: document.getElementById("company-about-values").value,
        journey: document.getElementById("company-about-journey").value,
        leadership: document.getElementById("company-about-leadership").value
    };
    const benefits = {
        compensation: document.getElementById("company-benefits-compensation").value,
        careerDev: document.getElementById("company-benefits-careerdev").value,
        workLife: document.getElementById("company-benefits-worklife").value,
        additionalPerks: document.getElementById("company-benefits-perks").value,
        healthCare: document.getElementById("company-benefits-healthcare").value,
    };
    const registeredEmail = document.getElementById("registered-email").value;

    // 2. Create a new doc in companies collection with all the info
    console.log("Adding company...");
    // var newCompany = await addDoc(collection(db, "companies"), {
    //     name: name,
    //     email: email,
    //     phone: phone,
    //     address: address,
    //     about: about,
    //     benefits: benefits,
    //     registeredEmail: registeredEmail,
    //     logoLink: downloadURL,
    // });

    await setDoc(doc(collection(db, "companies"), registeredEmail), {
        name: name,
        email: email,
        phone: phone,
        address: address,
        about: about,
        benefits: benefits,
        registeredEmail: registeredEmail,
        logoLink: downloadURL,
    });

    console.log("Comapny added.");

    if (updateProfile == false) {
    // Step 2.2 - create registered user with type='applicant' document
    await setDoc(doc(collection(db, "registeredUsers"), registeredEmail), { userType: 'employer' });

    // 3. create a user account using provided registered user and password
    const registeredEmailPassword = document.getElementById("registered-email").value;
    createUserWithEmailAndPassword(auth, registeredEmail, registeredEmailPassword)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User created - " + user);

            //var companyId = newCompany.id;
            //window.location.href = `../pages/company-home.html?id=${companyId}`;
            //window.location.href = `../pages/company-home.html?id=${registeredEmail}`;
            window.location.href = '../index.html';
        })
        
        .catch((error) => {
            const errorCode = error.code;
            const errorMsg = error.message;
            console.log(`Failed with ${errorCode} - ${errorMsg}`);
        });
    } else {
        //window.location.href = `../pages/company-home.html?id=${registeredEmail}`;
        window.location.href = '../index.html';
    }

}

btnInputFile.addEventListener('change', getFile);
btnEmployerRegistration.addEventListener("click", registerEmployer);
//btnGetJobs.addEventListener("click", getJobsForMyCompany);
//btnPostJob.addEventListener("click", postJob);
