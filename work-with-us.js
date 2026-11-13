import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
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
    await addDoc(collection(db, "applications"), application);
    form.reset();
    if (note) note.textContent = "Application submitted successfully. The Nexwith team will review your details.";
  } catch (error) {
    console.error("Nexwith application submission failed:", error);
    if (note) {
      note.textContent = error?.code === "permission-denied"
        ? "Submission was blocked by Firestore security rules. Please contact Nexwith directly."
        : "We couldn't submit your application. Please try again or email abhijeet.gautam1509@gmail.com.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Submit application <span>↗</span>';
    }
  }
});
