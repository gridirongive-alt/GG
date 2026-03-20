(function () {
  function ensureActionModal() {
    let backdrop = document.getElementById("action-message-backdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "action-message-backdrop";
    backdrop.className = "modal-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="modal action-message-modal" role="dialog" aria-modal="true" aria-labelledby="action-message-title">
        <div class="modal-header">
          <h2 id="action-message-title">Message</h2>
        </div>
        <p id="action-message-text" class="subtle-copy"></p>
        <div class="modal-actions section-top-gap-sm">
          <button class="btn btn-primary" type="button" id="action-message-ok">OK</button>
        </div>
      </section>
    `;
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function showActionMessage(message, options = {}) {
    const backdrop = ensureActionModal();
    const titleEl = document.getElementById("action-message-title");
    const textEl = document.getElementById("action-message-text");
    const okButton = document.getElementById("action-message-ok");
    const title = String(options.title || (options.isError ? "Action Failed" : "Update"));
    const text = String(message || "");

    titleEl.textContent = title;
    textEl.textContent = text;
    textEl.classList.toggle("is-error", Boolean(options.isError));
    backdrop.hidden = false;

    return new Promise((resolve) => {
      const close = () => {
        backdrop.hidden = true;
        okButton.removeEventListener("click", close);
        backdrop.removeEventListener("click", onBackdropClick);
        document.removeEventListener("keydown", onEscape);
        resolve();
      };
      const onBackdropClick = (event) => {
        if (event.target === backdrop) close();
      };
      const onEscape = (event) => {
        if (event.key === "Escape") close();
      };
      okButton.addEventListener("click", close);
      backdrop.addEventListener("click", onBackdropClick);
      document.addEventListener("keydown", onEscape);
      okButton.focus();
    });
  }

  window.showActionMessage = showActionMessage;
})();
