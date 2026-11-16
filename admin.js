import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getFirestore,collection,onSnapshot,doc,updateDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
const firebaseConfig={apiKey:"AIzaSyD3rHEGsWneMRHmxSXuWtr8m9wI9zqWS_o",authDomain:"nexwith.firebaseapp.com",projectId:"nexwith",storageBucket:"nexwith.firebasestorage.app",messagingSenderId:"1005475953246",appId:"1:1005475953246:web:72297b71a5f4c1e83e92cf",measurementId:"G-DZHN68V657"};
const ADMIN_EMAILS=["nexwith@gmail.com","abhijeet.gautam1509@gmail.com","paarijaat366@gmail.com"];
const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app),provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:"select_account"});
const $=s=>document.querySelector(s),loginView=$("#login-view"),workspace=$("#admin-shell"),dashboard=$("#dashboard-view");
let applications=[],selected=null,unsubscribe=null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateValue=v=>v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?new Date(v):null;
const timeValue=v=>{const d=dateValue(v);return d instanceof Date&&!Number.isNaN(d.getTime())?d.getTime():0};
const fmt=v=>{const d=dateValue(v);return d instanceof Date&&!Number.isNaN(d.getTime())?d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"};
const safeUrl=v=>{try{const s=String(v||"").trim();if(!s)return "";const u=new URL(/^https?:\/\//i.test(s)?s:"https://"+s);return u.protocol==="https:"||u.protocol==="http:"?u.href:""}catch{return ""}};
function showLogin(message=""){loginView.hidden=false;workspace.hidden=true;$("#login-error").textContent=message;}
function showWorkspace(){loginView.hidden=true;workspace.hidden=false;dashboard.hidden=false;$("#signout-top").hidden=false;}
function emailLink(a,status){
 const subject=status==="accepted"?"Nexwith application — Accepted":status==="rejected"?"Update on your Nexwith application":"Your Nexwith application";
 let body="Hello "+(a.name||"there")+",\n\nThank you for your application to Nexwith.\n\nRegards,\nNexwith Team";
 if(status==="accepted")body="Hello "+(a.name||"there")+",\n\nThank you for applying to Nexwith. We are pleased to inform you that your application has been accepted. We will contact you with the next steps shortly.\n\nRegards,\nNexwith Team";
 if(status==="rejected")body="Hello "+(a.name||"there")+",\n\nThank you for your interest in Nexwith. After reviewing your application, we will not be moving forward at this stage. We appreciate your effort and wish you the best.\n\nRegards,\nNexwith Team";
 window.location.href="mailto:"+encodeURIComponent(a.email||"")+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
}
function render(){
 const counts={pending:0,accepted:0,rejected:0,shortlisted:0};
 applications.forEach(a=>{const s=a.status||"pending";counts[s]=(counts[s]||0)+1;});
 $("#total-count").textContent=applications.length;$("#pending-count").textContent=counts.pending;$("#accepted-count").textContent=counts.accepted;$("#rejected-count").textContent=counts.rejected;
 const roleSelect=$("#role-filter"),oldRole=roleSelect.value,roles=[...new Set(applications.map(a=>a.role).filter(Boolean))].sort();
 roleSelect.innerHTML='<option value="all">All opportunities</option>'+roles.map(r=>'<option value="'+esc(r)+'">'+esc(r)+'</option>').join("");
 if(roles.includes(oldRole))roleSelect.value=oldRole;
 const search=$("#search-input").value.toLowerCase(),status=$("#status-filter").value,role=roleSelect.value,sort=$("#sort-filter").value;
 let list=applications.filter(a=>(status==="all"||(a.status||"pending")===status)&&(role==="all"||a.role===role)&&[a.name,a.email,a.city,a.role,a.phone].some(v=>String(v||"").toLowerCase().includes(search)));
 list.sort((a,b)=>sort==="name"?String(a.name||"").localeCompare(String(b.name||"")):sort==="oldest"?timeValue(a.createdAt)-timeValue(b.createdAt):timeValue(b.createdAt)-timeValue(a.createdAt));
 $("#results-count").textContent=list.length+" applications";
 $("#applications-body").innerHTML=list.length?list.map(a=>'<tr><td><strong>'+esc(a.name)+'</strong><small>'+esc(a.email)+'</small></td><td>'+esc(a.city||"—")+'</td><td>'+esc(a.role||"—")+'</td><td>'+fmt(a.createdAt)+'</td><td><span class="status '+esc(a.status||"pending")+'">'+esc(a.status||"pending")+'</span></td><td><div class="row-actions"><button class="tiny-btn" data-view="'+esc(a.id)+'">Review</button><button class="tiny-btn" data-email="'+esc(a.id)+'">Email ↗</button></div></td></tr>').join(""):'<tr><td colspan="6" class="empty-cell">No applications match these filters.</td></tr>';
 $("#applications-body").querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openReview(b.dataset.view)));
 $("#applications-body").querySelectorAll("[data-email]").forEach(b=>b.addEventListener("click",()=>{const a=applications.find(x=>x.id===b.dataset.email);if(a)emailLink(a,a.status||"pending");}));
}
function openReview(id){
 selected=applications.find(a=>a.id===id);if(!selected)return;
 $("#detail-name").textContent=selected.name||"Applicant";$("#detail-meta").textContent=[selected.city,selected.role,fmt(selected.createdAt)].filter(Boolean).join(" · ");
 const resume=safeUrl(selected.resumeLink),portfolio=safeUrl(selected.links);
 const rows=[["Email",selected.email],["Phone",selected.phone],["City",selected.city],["Education",selected.education],["Opportunity",selected.role],["Availability",selected.availability],["Resume",resume?'<a href="'+esc(resume)+'" target="_blank" rel="noopener noreferrer">Open resume ↗</a>':"Not provided or invalid link"],["Portfolio / LinkedIn",portfolio?'<a href="'+esc(portfolio)+'" target="_blank" rel="noopener noreferrer">Open link ↗</a>':"Not provided or invalid link"],["About applicant",selected.about||"—"]];
 $("#detail-content").innerHTML=rows.map(([k,v])=>'<div class="detail-item '+(k==="About applicant"?"full":"")+'"><label>'+esc(k)+'</label><div>'+(["Resume","Portfolio / LinkedIn"].includes(k)?v:esc(v))+'</div></div>').join("");
 $("#review-status").value=selected.status||"pending";$("#review-notes").value=selected.reviewNotes||"";$("#review-feedback").textContent="";$("#review-dialog").showModal();
}
$("#save-review").addEventListener("click",async()=>{
 if(!selected)return;const button=$("#save-review"),status=$("#review-status").value,reviewNotes=$("#review-notes").value.trim();button.disabled=true;
 try{await updateDoc(doc(db,"applications",selected.id),{status,reviewNotes,updatedAt:serverTimestamp()});$("#review-feedback").textContent="Review saved.";}
 catch(e){console.error(e);$("#review-feedback").textContent="Could not save. Check Firestore security rules.";}
 finally{button.disabled=false;}
});
$("#email-applicant").addEventListener("click",()=>{if(selected)emailLink(selected,$("#review-status").value);});
function exportRows(){return applications.map(a=>({"Name":a.name||"","Email":a.email||"","Phone":a.phone||"","City":a.city||"","Education":a.education||"","Opportunity":a.role||"","Availability":a.availability||"","About":a.about||"","Resume link":a.resumeLink||"","Portfolio / LinkedIn":a.links||"","Status":a.status||"pending","Review notes":a.reviewNotes||"","Submitted":fmt(a.createdAt)}));}
$("#export-csv").addEventListener("click",()=>{
 if(!applications.length)return alert("No applications to export.");const rows=exportRows(),keys=Object.keys(rows[0]);
 const csv=[keys,...rows.map(r=>keys.map(k=>r[k]))].map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nexwith-applications-"+new Date().toISOString().slice(0,10)+".csv";a.click();URL.revokeObjectURL(url);
});
$("#export-xlsx").addEventListener("click",()=>{
 if(!applications.length)return alert("No applications to export.");if(!window.XLSX)return alert("Excel export library did not load. Use CSV export instead.");
 const sheet=XLSX.utils.json_to_sheet(exportRows()),book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,"Applications");XLSX.writeFile(book,"nexwith-applications-"+new Date().toISOString().slice(0,10)+".xlsx");
});
["#search-input","#status-filter","#role-filter","#sort-filter"].forEach(s=>$(s).addEventListener("input",render));
$("#google-login").addEventListener("click",async()=>{
 const button=$("#google-login");button.disabled=true;button.textContent="Opening Google sign-in…";$("#login-error").textContent="";
 try{await signInWithPopup(auth,provider);}
 catch(e){
  console.error("Nexwith admin Google sign-in:",e);
  const messages={"auth/unauthorized-domain":"Add nexwith.vercel.app to Firebase Authentication → Settings → Authorized domains.","auth/popup-blocked":"Your browser blocked the Google sign-in popup. Allow pop-ups for nexwith.vercel.app and retry.","auth/popup-closed-by-user":"The Google sign-in window was closed before authentication completed.","auth/operation-not-allowed":"Google sign-in is disabled. Enable the Google provider in Firebase Authentication.","auth/network-request-failed":"Network request failed. Check your connection and retry."};
  $("#login-error").textContent=messages[e.code]||("Google sign-in failed ("+(e.code||"unknown")+"). "+(e.message||"Please retry."));
 }finally{button.disabled=false;button.innerHTML='Continue with Google <span>↗</span>';}
});
function startRealtime(){
 if(unsubscribe)unsubscribe();
 unsubscribe=onSnapshot(collection(db,"applications"),snap=>{applications=snap.docs.map(d=>({id:d.id,...d.data()}));$("#sync-state").textContent="● Live · synced";render();},e=>{console.error("Firestore listener:",e);$("#sync-state").textContent="Connection error";$("#applications-body").innerHTML='<tr><td colspan="6" class="empty-cell">Could not read applications. Check Firestore rules and administrator access.</td></tr>';});
}
$("#signout-top").addEventListener("click",()=>signOut(auth));
onAuthStateChanged(auth,user=>{
 if(user&&ADMIN_EMAILS.includes((user.email||"").toLowerCase())){showWorkspace();startRealtime();}
 else{
  if(unsubscribe){unsubscribe();unsubscribe=null;}
  if(user)signOut(auth).catch(console.error);
  $("#signout-top").hidden=true;$("#sync-state").textContent="Signed out";
  showLogin(user?"This Google account is not authorized for Nexwith administration.":"");
 }
});


/* Keep the workspace navigation state in sync with the selected section. */
const workspaceLinks=[...document.querySelectorAll(".sidebar .side-link")];
function setActiveWorkspaceLink(hash){
 workspaceLinks.forEach(link=>{
  const active=link.getAttribute("href")===hash;
  link.classList.toggle("active",active);
  if(active)link.setAttribute("aria-current","location");
  else link.removeAttribute("aria-current");
 });
}
workspaceLinks.forEach(link=>link.addEventListener("click",()=>{
 setActiveWorkspaceLink(link.getAttribute("href"));
}));
const workspaceSections=["#overview","#applications"].map(id=>document.querySelector(id)).filter(Boolean);
if("IntersectionObserver" in window){
 const sectionObserver=new IntersectionObserver(entries=>{
  const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if(visible)setActiveWorkspaceLink("#"+visible.target.id);
 },{rootMargin:"-18% 0px -62% 0px",threshold:[0,.1,.25,.5]});
 workspaceSections.forEach(section=>sectionObserver.observe(section));
}
