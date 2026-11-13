(() => {
  const role = document.querySelector('#app-role');
  const note = document.querySelector('#application-note');
  document.querySelectorAll('[data-role]').forEach(link => {
    link.addEventListener('click', () => {
      if (role) role.value = link.dataset.role;
    });
  });
  document.querySelector('#apply-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = encodeURIComponent(`Work with Nexwith application — ${data.role}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone / WhatsApp: ${data.phone}\nCity: ${data.city}\nOpportunity: ${data.role}\nAvailability: ${data.availability}\nPortfolio / LinkedIn: ${data.links || 'Not provided'}\n\nAbout: ${data.about}`
    );
    if (note) note.textContent = 'Opening your email application with the application details…';
    window.location.href = `mailto:abhijeet.gautam1509@gmail.com?subject=${subject}&body=${body}`;
  });
})();