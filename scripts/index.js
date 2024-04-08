// Import the functions you need from the SDKs you need
import { db, auth } from "../config/firebase-config.js";
import {
  getFirestore,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

import { UserType, loadTopNavBar, loadUserNavBar } from "./common.js";

const btnPostJob = document.querySelector(".btnPostJob");
var jobsList = document.querySelector("#jobslist");

// Filter variables
var filterListOptions = document.getElementById("filterList");
var filterListJobType = document.getElementById("filterListJobType");
var filterListLocation = document.getElementById("filterListLocation");
var filterListTitle = document.getElementById("filterListTitle");

const saveButton = document.getElementById("saveButton");
const applyButton = document.getElementById("applyButton");

// global scoped variable to capture state
const JobType = {
  Any: "Any",
  Contract: "Contract",
  FullTime: "Full Time",
  Internship: "Intership",
  PartTime: "Part Time",
};

var showSavedJobs = false;
var showAppliedJobs = false;
var postJob = false;
var searchCriteria = {
  companyId: "",
  jobType: JobType.Any,
  location: "",
  keyword: ""
};

// const UserType = {
//   None: "none",
//   Applicant: "applicant",
//   Employer: "employer"
// };

var loggedInUserEmail = "";
var loggedInUserType = UserType.None;

const PageContent = {
  Home: "",
  Testimonials: "testimonials",

}

var pageContent = PageContent.Home;
handleUrlParamsForTopNav();
function handleUrlParamsForTopNav() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has(PageContent.Testimonials)) {
    pageContent = PageContent.Testimonials;
  }
}


function handleUrlParamsForLoggedInUser() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("logout")) {
    console.log("UrlParam : " + urlParams.get("logout"));
    console.log("Logging out");
    signOut(auth).then(() => {
      console.log("Logged out.");
      window.location.href = `../index.html`;
    });
  }

  if (urlParams.has("savedJobs")) {
    showSavedJobs = true;
  }

  if (urlParams.has("appliedJobs")) {
    showAppliedJobs = true;
  }

  if (urlParams.has("post-job")) {
    postJob = true;
    window.location.href = './pages/postjob.html';
  }

  console.log("Show saved jobs - " + showSavedJobs);
  loadJobs();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Index - Auth state changed. User logged in - " + user.email);
    loggedInUserEmail = user.email;

    const userTypeDocRef = doc(db, "registeredUsers", loggedInUserEmail);
    var userTypeDoc = await getDoc(userTypeDocRef);
    var userTypeDocData = userTypeDoc.data();
    if (userTypeDocData) {
      if (userTypeDocData.userType == "employer") {
        loggedInUserType = UserType.Employer
      } else if (userTypeDocData.userType == "applicant") {
        loggedInUserType = UserType.Applicant;
      } else {
        loggedInUserType = UserType.None;
      }
    }

    console.log("User is - " + loggedInUserType);

    loadUserNavBar(loggedInUserType, true);
  } else {
    console.log("Index - Auth state changed, no user logged in.");
    loggedInUserEmail = "";
    loggedInUserType = UserType.None;
    loadUserNavBar(loggedInUserType, false);
  }

  handleUrlParamsForLoggedInUser();

});


// Load the top nav bar
loadTopNavBar();

var firstJobDocId = '0';
var filterOptionValues = [{ id: "", name: "All Companies" }];
var selectedJobId = "";
var selectedJob;

loadFilterOptions();

function prepareJobCard(jobId, job) {
  var jobCard = `<div class="card" id="${jobId}" data-id="${jobId}">
  <div class="card-left">
      <img
          src=${job.companyLogo}>
  </div>
  <div class="card-center">
      <div class="job-title">
          <p>${job.jobTitle}</p>
      </div>
      <div class="job-company-name">
          <p>${job.companyName}</p>
      </div>
      <div class="job-location">
          <p>${job.location}</p>
      </div>
      <div class="job-salary">
          <p>$${job.minSalary}-$${job.maxSalary}/yr</p>
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
  return jobCard;
}

function loadUserSavedJobs() {
  getDocs(collection(db, "userProfiles", auth.currentUser.email, "savedJobs"))
    .then((docsSanpshot) => {
      docsSanpshot.docs.forEach(async (jobDoc) => {
        console.log("Saved job id - " + jobDoc.id);

        const jobDocRef = doc(db, "jobs", jobDoc.id);
        getDoc(jobDocRef)
          .then((doc) => {
            if (doc.exists()) {
              const job = doc.data();

              if (firstJobDocId == '0') {
                firstJobDocId = doc.id;
                selectedJobId = firstJobDocId;
                selectedJob = job;
              }

              jobsList.innerHTML += prepareJobCard(doc.id, job);

              if (firstJobDocId == doc.id) {
                updateDetailsSection(firstJobDocId);
              }
            }
          })
          .catch((error) => {
            console.error("Error fetching document:", error);
          })
      })
    });
}

function loadUserAppliedJobs() {
  var userEmail = auth.currentUser.email;
  console.log("Getting applied jobs for user - " + userEmail);

  // Get all the job applications for this user
  const jobApplsRef = collection(db, "jobApplications");
  const jobApplsQuery = query(jobApplsRef, where("userEmail", "==", userEmail));
  getDocs(jobApplsQuery)
    .then((jobApplsSnapshot) => {
      console.log("Getting jobs for this user - ");
      jobApplsSnapshot.forEach((jobAppldoc) => {
        var jobAppl = jobAppldoc.data();
        console.log("Job Application - " + jobAppldoc.id);

        // Get the job doc from the JobAppl
        var jobId = jobAppl.jobId;
        const jobDocRef = doc(db, "jobs", jobId);

        // Get the document data
        getDoc(jobDocRef)
          .then((jobDoc) => {
            if (jobDoc.exists()) {
              const job = jobDoc.data();

              if (firstJobDocId == '0') {
                firstJobDocId = jobDoc.id;
                selectedJobId = firstJobDocId;
                selectedJob = job;
              }

              jobsList.innerHTML += prepareJobCard(jobDoc.id, job);

              if (firstJobDocId == jobDoc.id) {
                updateDetailsSection(firstJobDocId);
              }
            }
          })
          .catch((err) => {
            console.error("Error while reading document: " + err);
          })

      });
    });

  applyButton.style.display = "none";
  saveButton.style.display = "none";
}

function loadEmployerPostedJobs() {
  // Get all the jobs from this company
  const jobsRef = collection(db, "jobs");
  const jobsQuery = query(jobsRef, where("companyId", "==", auth.currentUser.email));
  getDocs(jobsQuery)
    .then((jobsSnapshot) => {
      console.log("Getting jobs for this company - ");
      jobsSnapshot.forEach((doc) => {
        const job = doc.data();
        console.log(job);

        if (firstJobDocId == '0') {
          firstJobDocId = doc.id;
          selectedJobId = firstJobDocId;
          selectedJob = job;
        }

        jobsList.innerHTML += prepareJobCard(doc.id, job);

        if (firstJobDocId == doc.id) {
          updateDetailsSection(firstJobDocId);
        }
      });
    });
}

function loadAllJobsBasedOnFilter() {
  const constraints = [];

  if (searchCriteria.companyId != "") {
    constraints.push(where("companyId", "==", searchCriteria.companyId));
  }
  if (searchCriteria.jobType != JobType.Any) {
    console.log("Filtering for job type - " + searchCriteria.jobType);
    constraints.push(where("jobType", "==", searchCriteria.jobType));
  }

  const jobsRef = collection(db, "jobs");
  let q = query(jobsRef, ...constraints);
  getDocs(q).then((querySnapshot) => {
    querySnapshot.docs.forEach((doc) => {
      var job = doc.data();

      if (searchCriteria.location != "") {
        if (job.location.toLowerCase().includes(searchCriteria.location.toLowerCase()) == false) {
          console.log("No match for location, skipping..." + job.location);
          return;
        }
      }

      if (searchCriteria.keyword != "") {
        if (job.jobTitle.toLowerCase().includes(searchCriteria.keyword.toLowerCase()) == false) {
          console.log("No match for keyword, skipping..." + job.jobTitle);
          return;
        }
      }

      if (firstJobDocId == '0') {
        firstJobDocId = doc.id;
        selectedJobId = firstJobDocId;
        selectedJob = job;
      }

      jobsList.innerHTML += prepareJobCard(doc.id, job);
    });

    updateDetailsSection(firstJobDocId);
  });
}

const mainContainer = document.getElementById("main-container");
function loadJobs() {
  console.log("Page is-" + pageContent);
  if (pageContent == PageContent.Testimonials) {

    mainContainer.innerHTML = "";
    console.log("Loading the testimonials");
    fetch('../pages/testimonials.html')
      .then(res => res.text())
      .then(data => {
        console.log("got data");
        mainContainer.innerHTML = data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        eval(doc.querySelector('script').textContent);
      })
      .catch((err) => {
        console.error("Error while loading navbar - " + err);
      });
  } else {
    jobsList.innerHTML = "";
    firstJobDocId = 0;

    console.log("Loading jobs with following search criteria -");
    console.log(`Company Id: ${searchCriteria.companyId}, Job Type: ${searchCriteria.jobType}, Location: ${searchCriteria.location}, Keyword: ${searchCriteria.keyword}`);

    console.log(`SavedJobs = ${showSavedJobs}, user = ${auth.currentUser}`);

    if (auth.currentUser != null) {
      if (loggedInUserType == UserType.Employer) {
        loadEmployerPostedJobs();
      } else {
        // Applicant logged in
        if (showSavedJobs == true) {
          loadUserSavedJobs();
        } else if (showAppliedJobs == true) {
          loadUserAppliedJobs();
        }
        else {
          loadAllJobsBasedOnFilter();
        }
      }
    } else {
      loadAllJobsBasedOnFilter();
    }
  }
}

function loadFilterOptions() {
  getDocs(collection(db, "jobs")).then((querySnapshot) => {
    querySnapshot.docs.forEach((doc) => {
      var job = doc.data();

      let index = filterOptionValues.findIndex((item) => item.id === job.companyId);
      if (index === -1) {
        filterOptionValues.push({ id: job.companyId, name: job.companyName });
      }
    });

    filterOptionValues.forEach((option) => {
      filterListOptions.innerHTML += `<option id="${option.id}">${option.name}</option>`;
    });

    filterListOptions.addEventListener("change", function (event) {
      console.log("Company selected is: " + filterListOptions.options[filterListOptions.selectedIndex].text);
      console.log("Selected company id is: " + filterListOptions.options[filterListOptions.selectedIndex].id);

      searchCriteria.companyId = filterListOptions.options[filterListOptions.selectedIndex].id;
      loadJobs();
    });

    filterListJobType.addEventListener("change", function (event) {
      console.log("Selected Job Type- " + filterListJobType.options[filterListJobType.selectedIndex].value);
      searchCriteria.jobType = filterListJobType.options[filterListJobType.selectedIndex].value;
      loadJobs();
    });

    filterListLocation.addEventListener("change", function (event) {
      console.log("Selected location - " + filterListLocation.value);
      searchCriteria.location = filterListLocation.value;
      loadJobs();
    });

    filterListTitle.addEventListener("change", function (event) {
      console.log("Selected title keyword - " + filterListTitle.value);
      searchCriteria.keyword = filterListTitle.value;
      loadJobs();
    });

  });
}

// with this line we see the details on the modal box but not on the right panel
var jobDetailsModal = document.querySelector("#jobDetailsContent");
var jobsList = document.querySelector("#jobslist");
var jobDetailsElem = document.getElementById("jobDetails");
const modal = document.getElementById("jobDetailsModal");
const closeModalButton = document.querySelector(".close");

var prevSelectedCard = null;
document.addEventListener("DOMContentLoaded", function () {
  // Use event delegation for dynamically added job cards
  jobsList.addEventListener("click", function (event) {
    var card = event.target.closest(".card");
    if (card) {
      // Get the document ID from the data-id attribute of the clicked card
      var docId = card.getAttribute("data-id");
      selectedJobId = docId;

      //card.style.border = '5px blue';

      if (prevSelectedCard != null) {
        prevSelectedCard.style.backgroundColor = 'lightgray';
      }

      // Update the details section
      updateDetailsSection(docId);
    }
  });
});


const tabs = document.querySelectorAll(".tabs");
const tab = document.querySelectorAll(".tab");
const panel = document.querySelectorAll(".panel");
function onTabClick(event) {

  // deactivate existing active tabs and panel

  for (let i = 0; i < tab.length; i++) {
    tab[i].classList.remove("active");
  }

  for (let i = 0; i < panel.length; i++) {
    panel[i].classList.remove("active");
  }

  // activate new tabs and panel
  event.target.classList.add('active');
  let classString = event.target.getAttribute('data-target');
  console.log(classString);
  if (window.innerWidth < 876) {
  document.getElementById('panels-small').getElementsByClassName(classString)[0].classList.add("active");
  } else {
    document.getElementById('panels-large').getElementsByClassName(classString)[0].classList.add("active");
  }
}
for (let i = 0; i < tab.length; i++) {
  tab[i].addEventListener('click', onTabClick, false);
}


// const jobDetailsPanel = document.getElementById("jobDetailsContainer");
const jobDetailsHeader_large = document.getElementById("job-detail-header");
const jobDetailsHeader_small = document.getElementById("job-detail-header-small");
const jobDetailsTab_large = document.getElementById("job-details-tab-large");
const jobDetailsTab_small = document.getElementById("job-details-tab-small");
const aboutCompanyTab_large = document.getElementById("about-company-tab-large");
const aboutCompanyTab_small = document.getElementById("about-company-tab-small");
const companyBenefitsTab_large = document.getElementById("company-benefits-tab-large");
const companyBenefitsTab_small = document.getElementById("company-benefits-tab-small");

function prepareJobDetailsHTML(jobData, small_screen) {
  applyButton.style.display = 'block';
  jobDetailsDesc.style.display = 'block';
  jobApplications.style.display = 'none';

  // jobDetailsPanel.style.display = 'block';

  var jobDetailsHeader, jobDetailsTab, aboutCompanyTab, companyBenefitsTab;
  if (small_screen) {
    jobDetailsHeader = jobDetailsHeader_small;
    jobDetailsTab = jobDetailsTab_small;
    aboutCompanyTab = aboutCompanyTab_small;
    companyBenefitsTab = companyBenefitsTab_small;
  } else {
    jobDetailsHeader = jobDetailsHeader_large;
    jobDetailsTab = jobDetailsTab_large;
    aboutCompanyTab = aboutCompanyTab_large;
    companyBenefitsTab = companyBenefitsTab_large;
  }

  jobDetailsHeader.innerHTML =
    `<div class="job-detail-header-left">
  <img src=${jobData.companyLogo} />
</div>
<div class="job-detail-header-right">
  <div class="job-detail-header-right1">
      <div class="details-header-name">
          <p>${jobData.companyName}</p>
      </div>
      <div class="details-header-location">
          <p>${jobData.location}</p>
      </div>
  </div>

  <div class="job-detail-header-right2">
      <div class="details-header-role">
          <p>${jobData.jobTitle}</p>
      </div>
      <div class="details-header-salary">
          <p>$${jobData.minSalary}-$${jobData.maxSalary}/yr</p>
      </div>
  </div>
</div>`;

  jobDetailsTab.innerHTML = `
    <div class="jobDescription">
        <h3>Job Description</h3>
        <p>${jobData.description}</p>
        <br />
    </div>

    <div class="responsibilities">
        <h3>Job Responsibilities</h3>
        <p>${jobData.responsibilities}</p>
        <br />
    </div>

    <div class="qualifications">
        <h3>Job Qualifications</h3>
        <p>${jobData.qualifications}</p>
        <br />
    </div>`;

  aboutCompanyTab.innerHTML = `
        <div class="about">
        <h3>Our Mission</h3>
        <p>${jobData.aboutCompany.mission}</p>
        <br />
        <h3>Our Values</h3>
        <p>${jobData.aboutCompany.values}</p>
        <br />
        <h3>Leadership</h3>
        <p>${jobData.aboutCompany.leadership}</p>
        <br />
        <h3>Our Journey</h3>
        <p>${jobData.aboutCompany.journey}</p>
    </div>`;
  companyBenefitsTab.innerHTML = `
        <div class="benefits">
        <h3>Compensation</h3>
        <p>${jobData.benefits.compensation}</p>
        <br />
        <h3>Healthcare</h3>
        <p>${jobData.benefits.healthCare}</p>
        <br />
        <h3>Career Development</h3>
        <p>${jobData.benefits.careerDev}</p>
        <br />
        <h3>Work-Life Balance</h3>
        <p>${jobData.benefits.workLife}</p>
        <br />
        <h3>Additional Perks</h3>
        <p>${jobData.benefits.additionalPerks}</p>
    </div>`;

    console.log(aboutCompanyTab.textContent);

}

//var prevSelectedJobId;
var selectedJobCard = null;
function updateDetailsSection(jobDocID) {
  selectedJobCard = document.getElementById(jobDocID);
  selectedJobCard.style.backgroundColor = 'lightblue';
  prevSelectedCard = selectedJobCard;

  // Log the document ID to the console
  console.log("Document ID:", jobDocID);

  // Fetch the specific document from Firestore using the docId
  const jobDocRef = doc(db, "jobs", jobDocID);

  // Get the document data
  getDoc(jobDocRef)
    .then((docSnapshot) => {
      if (docSnapshot.exists()) {
        const jobData = docSnapshot.data();

        // Conditionally show details in the modal or right panel based on screen size
        if (window.innerWidth < 876) {
          console.log("inside small screen");
          // Display details in the modal
          modal.style.display = "block";
          // Update the innerHTML of the container with the fetched details
          //jobDetailsModal.innerHTML = 
          prepareJobDetailsHTML(jobData, true);

          // Add an event listener to close the modal
          closeModalButton.addEventListener("click", () => {
            modal.style.display = "none";
          });
        } else {
          // If screen width is not less than 836px, update the right panel
          //jobDetailsElem.innerHTML = 
          prepareJobDetailsHTML(jobData, false);
        }

        selectedJob = jobData;

        // Update the "Apply" & "Save" button texts and actions depending upon who is logged in and what job is selected.
        applyButton.disabled = false;
        applyButton.textContent = "Apply Now";
        saveButton.disabled = false;
        saveButton.textContent = "Save Job";

        if (loggedInUserType == UserType.Employer) {
          if (jobData.companyId == auth.currentUser.email) {
            applyButton.textContent = "View Applications";
            saveButton.textContent = "Delete Job";
          } else {
            applyButton.disabled = true;
            saveButton.disabled = true;
          }
        } else { //logged in user is an applicant
          if (showSavedJobs == true) {
            saveButton.textContent = "Unsave Job";
          }

        }
      } else {
        console.log("Document not found");
      }
    })
    .catch((error) => {
      console.error("Error fetching document:", error);
    });
}

async function onSaveOrUnSaveOrDeleteJob() {
  if (auth.currentUser != null) {
    if (loggedInUserType == UserType.Applicant) {
      if (showSavedJobs == true) { // unsave the job
        await deleteDoc(doc(collection(db, "userProfiles", auth.currentUser.email, "savedJobs"), selectedJobId));
      } else { // save the job
        await setDoc(doc(collection(db, "userProfiles", auth.currentUser.email, "savedJobs"), selectedJobId), {});
      }
    } else if (loggedInUserType == UserType.Employer) {
      await deleteDoc(doc(db, "jobs", selectedJobId));
    }
    loadJobs();
  } else {
    console.log("No user logged in, can not save job.");
  }
}

const jobDetailsDesc = document.getElementById("detail-desc");
const jobApplications = document.getElementById("job-applications");
async function onApplyOrViewApplications() {
  console.log("clicked apply");
  if (loggedInUserType != UserType.Employer) {
    // Redirect the user to the application page with the company name as a query parameter
    window.location.href = `../pages/apply.html?jobId=${selectedJobId}`;
  } else {
    // It is an employer
    console.log("You are an employer, we will show list of applications here.");
    // Get all the applications for this job
    const applsRef = collection(db, "jobApplications");
    const applsQuery = query(applsRef, where("jobId", "==", selectedJobId));
    applyButton.style.display = 'none';
    jobDetailsDesc.style.display = 'none';
    jobApplications.style.display = 'block';
    jobApplications.innerHTML = "";
    getDocs(applsQuery)
      .then((applsSnapshot) => {
        console.log("Reading job appls....")
        applsSnapshot.forEach((doc) => {
          var jobAppl = doc.data();
          console.log("Job Appl is - ");
          console.log(jobAppl);

          jobApplications.innerHTML += `<div class="appl-card" appl-id=${doc.id}>
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
        }
        );

        console.log("done with appl");
        console.log(jobDetailsDesc.textContent);
        console.log("done with appl 2");
      })
      .catch((error) => {
        alert("Error while fetching applications for the selected job.");
        console.log("Error fetching job applications - " + error);
      });
  }
}

applyButton.addEventListener("click", onApplyOrViewApplications);
saveButton.addEventListener("click", onSaveOrUnSaveOrDeleteJob);