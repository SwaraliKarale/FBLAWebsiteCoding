import { db, auth } from "../config/firebase-config.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

import { getFirestore, setDoc, addDoc, doc, getDoc, updateDoc, collection } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-storage.js";
import { loadTopNavBar, loadUserNavBar } from "./common.js";

loadTopNavBar();

const storage = getStorage();

// Get the query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);

// Get the values of the parameters
// const companyName = urlParams.get("companyName");
// const roleName = urlParams.get("roleName");
// const location = urlParams.get("location");
const jobId = urlParams.get("jobId");

//console.log(`Company: ${companyName}, Role: ${roleName}, Location: ${location}, JobId: ${jobId}`);

const jobDetailsHeader = document.getElementById("job-detail-header");
const jobDocRef = doc(db, "jobs", jobId);
var jobDoc = await getDoc(jobDocRef);
var job = jobDoc.data();
jobDetailsHeader.innerHTML =
    `
    <div class="job-detail-header-left">
  <img src=${job.companyLogo} />
</div>
<div class="job-detail-header-right">
  <div class="job-detail-header-right1">
      <div class="details-header-name">
          <p>${job.companyName}</p>
      </div>
      <div class="details-header-location">
          <p>${job.location}</p>
      </div>
  </div>

  <div class="job-detail-header-right2">
      <div class="details-header-role">
          <p>${job.jobTitle}</p>
      </div>
      <div class="details-header-salary">
          <p>$${job.minSalary}-$${job.maxSalary}/yr</p>
      </div>
  </div>
</div>`;

const btnInputFile = document.querySelector('.inputFile');
const btnSubmit = document.querySelector('.btnSubmit');
const btnCancel = document.querySelector('.btnCancel');

var fileItem;
var fileName;

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserNavBar(true);
    console.log("Apply - Auth state changed. User logged in - " + user.email);
    initializeWithUserProfile();
  }
});

async function initializeWithUserProfile() {
  console.log("Initializing apply page..." + auth.currentUser.email);
  if (auth.currentUser != null) {
    // find the type of the user
    const userEmail = auth.currentUser.email;
    console.log("User is logged in - " + userEmail);
    const userTypeDocRef = doc(db, "registeredUsers", userEmail);
    var userTypeDoc = await getDoc(userTypeDocRef);
    var userTypeDocData = userTypeDoc.data();

    console.log(userTypeDocData);

    if (userTypeDocData.userType == "applicant") {
      console.log("user type is applicant");
      // Get User profile
      const userProfileDocRef = doc(db, "userProfiles", userEmail);
      var userProfileDoc = await getDoc(userProfileDocRef);
      var userProfile = userProfileDoc.data();

      if (userProfile) {
        document.getElementById('first-name').value = userProfile.firstName;
        document.getElementById('last-name').value = userProfile.lastName;
        document.getElementById('email').value = userEmail;
        document.getElementById('phone').value = userProfile.phone;
        document.getElementById('city').value = userProfile.address.city;
        document.getElementById('state').value = userProfile.address.state;
        document.getElementById('zip').value = userProfile.address.postal;
        document.getElementById('summary').value = userProfile.profileSummary;
        //document.getElementById('phone').value = userProfile.phone;
      }
    }
  }
}

function getFile(e) {
  console.log("Inside getFile");
  fileItem = e.target.files[0];
  console.log("Geto file " + fileItem.name);
  fileName = fileItem.name;
}

async function upload() {
  const filePath = `resumes/${jobId}/${fileName}`;
  const newResumeRef = ref(storage, filePath);
  console.log("Starting to update the resume - " + filePath);
  await uploadBytesResumable(newResumeRef, fileItem);
  console.log("Resume uploaded. Getting download URL...");
  const downloadURL = await getDownloadURL(newResumeRef);
  console.log("Got the download URL - " + downloadURL);
  return downloadURL;
}

async function submitApplication() {
  console.log("Submitting application for the job id - " + jobId);

  if (!fileItem) {
    alert("Please select a resume file to upload");
    return;
  }

  // 1. Get the companyId that this job belogs to.
  var companyId;
  var numberOfApplications = 0;
  const jobRef = doc(db, "jobs", jobId);
  const jobSnapshot = await getDoc(jobRef);

  if (jobSnapshot.exists()) {
    const jobData = jobSnapshot.data();
    console.log("Job info is - ");
    console.log(jobData);
    companyId = jobData.companyId;
    numberOfApplications = jobData.numberOfApplications;

    // 2. Upload the resume
    const downloadURL = await upload();

    // 3. Add JobApplication doc
    console.log("Creating JobApplication...");
    console.log("Using fileLocation as - " + downloadURL);

    await addDoc(collection(db, "jobApplications"), {
      companyId: companyId,
      jobId: jobId,
      userEmail: document.getElementById('email').value,
      firstName: document.getElementById('first-name').value,
      lastName: document.getElementById('last-name').value,
      phone: document.getElementById('phone').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      postal: document.getElementById('zip').value,
      coverPage: document.getElementById('summary').value,
      resume: {
        fileName: fileName,
        fileLocation: downloadURL,
      },
    });

    console.log("Created JobApplication");

    // 4. Update the Job doc by incrementing the numberOfApplications
    console.log("Updating numberOfApplications...");
    await updateDoc(jobRef, { numberOfApplications: (numberOfApplications + 1) });
    console.log("Updated numberOfApplications - " + (numberOfApplications + 1));
  } else {
    console.log("Job details can not be found for job id - " + jobId);
  }

  window.location.href = `../index.html`;
}

function onCancel() {
  window.location.href = '../index.html';
}

btnInputFile.addEventListener('change', getFile);
btnSubmit.addEventListener('click', submitApplication);
btnCancel.addEventListener('click', onCancel);