const verifyForm = document.getElementById("verify-form");
const resetForm = document.getElementById("reset-form");
const feedback = document.getElementById("reset-feedback");

const params = new URLSearchParams(window.location.search);
const emailFromLink = params.get("email");
const roleFromLink = params.get("role");

if (emailFromLink && verifyForm?.email) verifyForm.email.value = emailFromLink;
if (roleFromLink && verifyForm?.role) verifyForm.role.value = roleFromLink;

let verifiedPayload = null;

function setFeedback(message, isError = false) {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle("is-error", Boolean(isError));
}

function showAction(message, isError = false) {
  if (typeof window.showActionMessage === "function") {
    window.showActionMessage(message, { isError });
  }
}

verifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    role: verifyForm.role.value,
    email: verifyForm.email.value.trim(),
    recoveryKey: verifyForm.recoveryKey.value.trim()
  };
  try {
    const response = await fetch("/api/auth/verify-recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Recovery verification failed.");
    verifiedPayload = payload;
    setFeedback("Recovery key verified. Set your new password.");
    showAction("Recovery key verified. Set your new password.");
    resetForm.hidden = false;
  } catch (error) {
    setFeedback(error.message, true);
    showAction(error.message || "Recovery verification failed.", true);
  }
});

resetForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!verifiedPayload) {
    setFeedback("Verify your recovery key first.", true);
    showAction("Verify your recovery key first.", true);
    return;
  }
  const newPassword = resetForm.newPassword.value;
  const confirmPassword = resetForm.confirmPassword.value;
  if (newPassword !== confirmPassword) {
    setFeedback("Passwords do not match.", true);
    showAction("Passwords do not match.", true);
    return;
  }
  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...verifiedPayload,
        newPassword
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Password reset failed.");
    setFeedback("Password reset successful. You can now sign in.");
    showAction("Password reset successful. You can now sign in.");
    resetForm.reset();
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 900);
  } catch (error) {
    setFeedback(error.message, true);
    showAction(error.message || "Password reset failed.", true);
  }
});
