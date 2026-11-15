import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3rHEGsWneMRHmxSXuWtr8m9wI9zqWS_o",
  authDomain: "nexwith.firebaseapp.com",
  projectId: "nexwith",
  storageBucket: "nexwith.firebasestorage.app",
  messagingSenderId: "1005475953246",
  appId: "1:1005475953246:web:72297b71a5f4c1e83e92cf",
  measurementId: "G-DZHN68V657"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Google Picker credentials for the Nexwith Google Cloud project.
const GOOGLE_PICKER_API_KEY = "AIzaSyCScsnKkEXOZgI-TYNVWiNBWIe4S8kmagw";
const GOOGLE_OAUTH_CLIENT_ID = "1005475953246-nlskq9tvupregifdg313g9unpu5m9597.apps.googleusercontent.com";
const GOOGLE_CLOUD_PROJECT_NUMBER = "1005475953246";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const resumeInput = document.querySelector("#app-resume");
const resumeButton = document.querySelector("#choose-resume-btn");
const resumeStatus = document.querySelector("#resume-selection-status");
let googleTokenClient = null;
let googlePickerReady = false;
let googleAccessToken = null;

function setResumeStatus(message, isError = false) {
  if (!resumeStatus) return;
  resumeStatus.textContent = message;
  resumeStatus.classList.toggle("is-error", isError);
}

function loadGoogleScript(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === src);
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Google sign-in libraries could not be loaded."));
    if (!existing) document.head.appendChild(script);
  });
}

async function initializeGooglePicker() {
  try {
    await Promise.all([
      loadGoogleScript("https://apis.google.com/js/api.js"),
      loadGoogleScript("https://accounts.google.com/gsi/client")
    ]);

    await new Promise((resolve, reject) => {
      window.gapi.load("picker", { callback: resolve, onerror: reject, timeout: 10000, ontimeout: reject });
    });

    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: () => {}
    });

    googlePickerReady = true;
    if (resumeButton) {
      resumeButton.disabled = false;
      resumeButton.innerHTML = 'Add resume via Google Drive <span>↗</span>';
    }
  } catch (error) {
    console.error("Google Picker initialization failed:", error);
    if (resumeButton) {
      resumeButton.disabled = true;
      resumeButton.textContent = "Google Drive unavailable";
    }
    setResumeStatus("Google Drive selection could not be loaded. You can paste a Google Drive share link instead.", true);
    if (resumeInput) {
      resumeInput.readOnly = false;
      resumeInput.placeholder = "Paste your Google Drive share link";
    }
  }
}

function openGoogleDrivePicker() {
  if (!googlePickerReady || !googleTokenClient) {
    setResumeStatus("Google Drive is still loading. Please try again in a moment.", true);
    return;
  }

  googleTokenClient.callback = response => {
    if (response.error) {
      console.error("Google OAuth error:", response);
      setResumeStatus("Google authorization was not completed. Please try again.", true);
      return;
    }

    googleAccessToken = response.access_token;
    const resumeView = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    resumeView.setMimeTypes(
      "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    const picker = new window.google.picker.PickerBuilder()
      .setDeveloperKey(GOOGLE_PICKER_API_KEY)
      .setAppId(GOOGLE_CLOUD_PROJECT_NUMBER)
      .setOAuthToken(googleAccessToken)
      .setOrigin(window.location.origin)
      .addView(resumeView)
      .setTitle("Select your resume")
      .setCallback(data => {
        if (data.action === window.google.picker.Action.PICKED) {
          const selectedFile = data.docs?.[0];
          if (!selectedFile) return;

          const fileId = selectedFile.id || selectedFile[window.google.picker.Document.ID];
          const fileName = selectedFile.name || selectedFile[window.google.picker.Document.NAME] || "Selected resume";
          const selectedUrl = selectedFile.url || (fileId
            ? `https://drive.google.com/open?id=${encodeURIComponent(fileId)}`
            : "");

          if (!selectedUrl) {
            setResumeStatus("The selected file link could not be read. Please try selecting it again.", true);
            return;
          }

          resumeInput.value = selectedUrl;
          resumeInput.readOnly = true;
          setResumeStatus(`Selected: ${fileName}. Make sure link access is set to “Anyone with the link — Viewer”.`);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          setResumeStatus("No resume selected. You can try again whenever you're ready.");
        }
      })
      .build();

    picker.setVisible(true);
  };

  googleTokenClient.requestAccessToken({ prompt: googleAccessToken ? "" : "consent" });
}

resumeButton?.addEventListener("click", openGoogleDrivePicker);
initializeGooglePicker();

const form = document.querySelector("#apply-form");
const role = document.querySelector("#app-role");
const note = document.querySelector("#application-note");
const submitButton = form?.querySelector('button[type="submit"]');

function showSuccessPopup(applicantName) {
  let dialog = document.querySelector("#application-success-dialog");

  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "application-success-dialog";
    dialog.className = "application-success-dialog";
    dialog.setAttribute("aria-labelledby", "application-success-title");
    dialog.innerHTML = `
      <div class="success-popup-content">
        <div class="success-popup-icon" aria-hidden="true">✓</div>
        <p class="success-popup-eyebrow">NEXWITH / APPLICATION RECEIVED</p>
        <h2 id="application-success-title">You're on your way.</h2>
        <p class="success-popup-message"></p>
        <p class="success-popup-detail">Our founding team will review your application. If there's a fit, we'll contact you using the details you provided.</p>
        <button class="btn btn-dark success-popup-close" type="button">Done <span>↗</span></button>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector(".success-popup-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }

  dialog.querySelector(".success-popup-message").textContent =
    applicantName ? `Thanks, ${applicantName}. Your application has been submitted successfully.`
      : "Your application has been submitted successfully.";

  if (!dialog.open) dialog.showModal();
}


function showIssuePopup({ title, eyebrow, message, detail, icon = "!" }) {
  let dialog = document.querySelector("#application-issue-dialog");

  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "application-issue-dialog";
    dialog.className = "application-success-dialog application-issue-dialog";
    dialog.setAttribute("aria-labelledby", "application-issue-title");
    dialog.innerHTML = `
      <div class="success-popup-content">
        <div class="success-popup-icon issue-popup-icon" aria-hidden="true"></div>
        <p class="success-popup-eyebrow issue-popup-eyebrow"></p>
        <h2 id="application-issue-title"></h2>
        <p class="success-popup-message issue-popup-message"></p>
        <p class="success-popup-detail issue-popup-detail"></p>
        <button class="btn btn-dark success-popup-close" type="button">Got it <span>↗</span></button>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector(".success-popup-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }

  dialog.querySelector(".issue-popup-icon").textContent = icon;
  dialog.querySelector(".issue-popup-eyebrow").textContent = eyebrow;
  dialog.querySelector("#application-issue-title").textContent = title;
  dialog.querySelector(".issue-popup-message").textContent = message;
  dialog.querySelector(".issue-popup-detail").textContent = detail;

  if (!dialog.open) dialog.showModal();
}

document.querySelectorAll("[data-role]").forEach(link => {
  link.addEventListener("click", () => {
    if (role) role.value = link.dataset.role;
  });
});

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const values = Object.fromEntries(new FormData(form).entries());
  const application = {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    city: values.city.trim(),
    education: values.education.trim(),
    role: values.role,
    availability: values.availability,
    about: values.about.trim(),
    resumeLink: values.resumeLink.trim(),
    links: values.links.trim(),
    createdAt: serverTimestamp()
  };

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting…";
  }
  if (note) note.textContent = "Submitting your application securely…";

  try {
    // One application per email address: the normalized email is the document ID.
    // Firestore rules must allow create only when the ID matches the submitted email.
    await setDoc(doc(db, "applications", application.email), application);
    const applicantName = application.name;
    form.reset();
    if (note) note.textContent = "Application submitted successfully. The Nexwith team will review your details.";
    showSuccessPopup(applicantName);
  } catch (error) {
    console.error("Nexwith application submission failed:", error);
    if (note) note.textContent = "";

    if (error?.code === "permission-denied") {
      showIssuePopup({
        eyebrow: "NEXWITH / APPLICATION CHECK",
        title: "Already made your move?",
        message: "This email may already be on our list.",
        detail: "We keep applications to one per email address. If this is your first attempt, check your details and try again shortly, or reach out to our team.",
        icon: "↗"
      });
    } else {
      showIssuePopup({
        eyebrow: "NEXWITH / QUICK PAUSE",
        title: "That didn't go through.",
        message: "Your application hasn't been submitted yet.",
        detail: "Please try again in a moment. If the issue continues, contact us at nexwith@yahoo.com.",
        icon: "!"
      });
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Submit application <span>↗</span>';
    }
  }
});
