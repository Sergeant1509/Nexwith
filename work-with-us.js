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
        detail: "Please try again in a moment. If the issue continues, contact us at abhijeet.gautam1509@gmail.com.",
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
