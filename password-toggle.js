function buildPasswordToggleWrapper(input) {
  if (!(input instanceof HTMLInputElement)) return;
  if (input.type !== "password") return;
  if (input.dataset.passwordToggleReady === "true") return;

  const wrapper = document.createElement("span");
  wrapper.className = "password-field";

  input.parentNode?.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "password-toggle";
  button.setAttribute("aria-label", "Show password");
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" class="password-toggle-icon">
      <path
        d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
      <circle cx="12" cy="12" r="3.25" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
      <path
        class="password-toggle-slash"
        d="M4 20 20 4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        hidden
      ></path>
    </svg>
  `;

  const slash = button.querySelector(".password-toggle-slash");
  button.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    button.setAttribute("aria-pressed", showing ? "false" : "true");
    if (slash) slash.hidden = showing;
  });

  wrapper.appendChild(button);
  input.dataset.passwordToggleReady = "true";
}

function initPasswordToggles(root = document) {
  root.querySelectorAll('input[type="password"]').forEach(buildPasswordToggleWrapper);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initPasswordToggles(), { once: true });
} else {
  initPasswordToggles();
}
