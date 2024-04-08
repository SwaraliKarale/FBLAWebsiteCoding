import { db, auth } from "../config/firebase-config.js";
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
    getDoc,
    getDocs,
    collection,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Get the query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get("id");
console.log("Company id is: " + companyId);

var companyHeader = document.querySelector(".company-header");
var aboutTab = document.querySelector("#about");
var benefitsTab = document.querySelector("#benefits");
var jobsList = document.querySelector("#jobslist");
var jobApplList = document.querySelector("#jobApplicationDetailsContainer");
var btnUpdateCompanyProfile = document.querySelector(".btnUpdateCompanyProfile");

// Load the company logo and name
const companyRef = doc(db, "companies", companyId);
getDoc(companyRef)
    .then((docSnapshot) => {
        if (docSnapshot.exists()) {
            console.log("company found.")
            const companyData = docSnapshot.data();
            console.log("Name is - " + companyData.name);
            console.log(companyData);

            // Update the header
            companyHeader.innerHTML += `<h2 class="company-logo">
        <img src=${companyData.logoLink}" alt="Company Logo" />
      </h2>
      <h2 class="company-name" id="company-name">${companyData.name}</h2>`;

            // update the About tab
            aboutTab.innerHTML += `<ul>
      <li> <span> Our Mission </span><br>${companyData.about.mission}</li>
      <li> <span> Our Journey </span><br>${companyData.about.journey}</li>
      <li> <span> Company Values </span><br>${companyData.about.values}</li>
      <li> <span> Company Leadership </span><br>${companyData.about.leadership}</li>
      <li> <span> Location </span><br>NOT_AVAILABLE</li>
      </ul>`;

            // Get all the jobs from this company
            const jobsRef = collection(db, "jobs");
            const jobsQuery = query(jobsRef, where("companyId", "==", companyId));
            getDocs(jobsQuery)
                .then((jobsSnapshot) => {
                    console.log("Getting jobs for this company - ");
                    jobsSnapshot.forEach((doc) => {
                        var job = doc.data();
                        jobsList.innerHTML += `<div class="card" job-id=${doc.id}>
            <div class="card-left">
                <div class="job-title">
                    <p>${job.jobTitle}</p>
                </div>
                <div class="job-location">
                    <p>${job.location}</p>
                </div>
            </div>
            <div class="card-right">
                <div class="date-posted">
                    <p>Posted: ${job.postedOn}</p>
                </div>
                <div class="job-type">
                    <p>Type: ${job.jobType}</p>
                </div>
                <div class="num-appl">
                    <p>Applicants: ${job.numberOfApplications}</p>
                </div>
            </div>
        </div>`;
                    });
        });

        // Update the Company Benefits
        benefitsTab.innerHTML += `<ul>
        <li> <span> Compensation </span><br>${companyData.benefits.compensation}</li>
        <li> <span> Healthcare </span><br>${companyData.benefits.healthCare}</li>
        <li> <span> Career Development </span><br>${companyData.benefits.careerDev}</li>
        <li> <span> Work-Life Balance </span><br>${companyData.benefits.workLife}</li>
        <li> <span> Additional Perks </span><br>${companyData.benefits.additionalPerks}</li>
        </ul>`;

            
        } else {
            alert("Company is not registered.");
            //TODO: Logout and redirect to home 
        }
    })
    .catch((error) => {
        console.error("Error fetching document:", error);
        //alert("Error while loading company information.");
        //TODO: Logout and redirect to home 
    })


const btnLogout = document.querySelector(".btnLogout");
async function logout() {
    await signOut(auth);
    console.log("Logged out.");
    window.location.href = `../index.html`;
}

const btnPostJob = document.querySelector(".btnPostJob");
function postJob() {
    window.location.href = `./postjob.html?companyid=${companyId}`;
}
btnPostJob.addEventListener("click", postJob);

jobsList.addEventListener("click", function (event) {
    console.log("JobList clicked...");
    jobApplList.innerHTML = ``;
    var card = event.target.closest(".card");
    if (card) {
        // Get the document ID from the data-id attribute of the clicked card
        console.log("Getting job id...");
        var jobId = card.getAttribute("job-id");
        console.log("Job id is: " + jobId);

        // Get all the applications for this job
        const applsRef = collection(db, "jobApplications");
        const applsQuery = query(applsRef, where("jobId", "==", jobId));
        getDocs(applsQuery)
            .then((applsSnapshot) => {
                console.log("Reading job appls....")
                applsSnapshot.forEach((doc) => {
                    var jobAppl = doc.data();
                    console.log("Job Appl is - ");
                    console.log(jobAppl);

                    jobApplList.innerHTML += `<div class="appl-card" appl-id=${doc.id}>
                    <div class="appl-card-left">
                      <div class="appl-name">
                        <p>${jobAppl.firstName} ${jobAppl.lastName}</p>
                      </div>
                      <div class="appl-location">
                        <p>${jobAppl.city}, ${jobAppl.state}</p>
                      </div>
                    </div>
                    <div class="appl-resume">
                      <button onclick="window.open('${jobAppl.resume.fileLocation}', '_blank')"> Resume </button>
                    </div>
                  </div>`;
                });
            })
            .catch((error) => {
                alert("Error while fetching applications for the selected job.");
                console.log("Error fetching job applications - " + error);
            })
    }
});


function updateCompanyProfile() {
    console.log("Updateing compnay profile...");
    window.location.href = "./registration-employer.html?update";
}


btnLogout.addEventListener("click", logout);
btnUpdateCompanyProfile.addEventListener("click", updateCompanyProfile);