/* Nexwith icon system — Lucide outline icons, consistent stroke and sizing. */
(() => {
  const replaceIcon = (element, name, extraClass = "") => {
    if (!element || element.dataset.iconReady === "true") return;
    element.textContent = "";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", name);
    icon.setAttribute("aria-hidden", "true");
    if (extraClass) icon.className = extraClass;
    element.appendChild(icon);
    element.dataset.iconReady = "true";
  };

  const applyIcons = () => {
    document.querySelectorAll(".note-icon").forEach((el, i) =>
      replaceIcon(el, el.classList.contains("note-gold") ? "check" : "trending-up"));
    document.querySelectorAll(".service-icon,.plan-symbol,.opp-icon").forEach(el =>
      replaceIcon(el, "arrow-up-right"));
    document.querySelectorAll(".art-card-icon").forEach((el, i) =>
      replaceIcon(el, i === 1 ? "sparkles" : "arrow-up-right"));
    document.querySelectorAll(".price-link span,.opp-link span,.resume-drive-btn span,.nav-contact span").forEach(el =>
      replaceIcon(el, "arrow-up-right"));
    document.querySelectorAll(".btn span,.mobile-contact span").forEach(el => {
      const value = el.textContent.trim();
      if (value === "↓") replaceIcon(el, "arrow-down");
      else if (value === "↗") replaceIcon(el, "arrow-up-right");
    });
    document.querySelectorAll(".contact-links a b").forEach(el =>
      replaceIcon(el, "arrow-up-right"));
    document.querySelectorAll(".back-top").forEach(el => {
      el.textContent = "BACK TO TOP";
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", "arrow-up");
      icon.setAttribute("aria-hidden", "true");
      el.appendChild(icon);
    });
    document.querySelectorAll(".resume-drive-btn").forEach(el => {
      if (!el.querySelector("[data-lucide]")) {
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", "external-link");
        icon.setAttribute("aria-hidden", "true");
        el.appendChild(icon);
      }
    });
    document.querySelectorAll(".close-btn").forEach(el => replaceIcon(el, "x"));
    document.querySelectorAll(".side-link").forEach(el => {
      const label = el.textContent.toLowerCase();
      const name = label.includes("overview") ? "layout-dashboard" : "users";
      let icon = el.querySelector("[data-lucide]");
      if (!icon) {
        icon = document.createElement("i");
        icon.setAttribute("aria-hidden", "true");
        el.prepend(icon);
      }
      icon.setAttribute("data-lucide", name);
    });
    document.querySelectorAll("#export-csv").forEach(el => addLeading(el, "file-spreadsheet"));
    document.querySelectorAll("#export-xlsx").forEach(el => addLeading(el, "file-down"));
    document.querySelectorAll("#signout-top").forEach(el => addLeading(el, "log-out"));
    document.querySelectorAll("#email-applicant").forEach(el => addLeading(el, "mail"));
    document.querySelectorAll("#save-review").forEach(el => addLeading(el, "save"));
    document.querySelectorAll("#google-login").forEach(el => {
      const span = el.querySelector("span");
      if (span) replaceIcon(span, "arrow-up-right");
    });
    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
    }
  };

  function addLeading(button, name) {
    if (!button || button.dataset.leadingIcon === "true") return;
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", name);
    icon.setAttribute("aria-hidden", "true");
    button.prepend(icon);
    button.dataset.leadingIcon = "true";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyIcons, { once: true });
  else applyIcons();
})();