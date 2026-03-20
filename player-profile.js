const api = window.GridironData;
api.bootstrapDemoData();

const params = new URLSearchParams(window.location.search);
const publicPlayerId = params.get("playerId");

const donorNameHeading = document.getElementById("donor-name-heading");
const donorTeamCopy = document.getElementById("donor-team-copy");
const donorStats = document.getElementById("donor-stats");
const playerImage = document.getElementById("donor-player-image");
const playerTeam = document.getElementById("donor-player-team");
const equipmentGrid = document.getElementById("donor-equipment-grid");
const donationForm = document.getElementById("donation-form");
const donationHelp = document.getElementById("donation-help");
const donationFeedback = document.getElementById("donation-feedback");
const selectedEquipmentCopy = document.getElementById("selected-equipment-copy");
const fillRemainingButton = document.getElementById("fill-remaining");
const jumpToDonateButton = document.getElementById("jump-to-donate");
const donatePanel = document.getElementById("donate-panel");
const donorModalBackdrop = document.getElementById("donor-modal-backdrop");
const donationModal = document.getElementById("donation-modal");
const donorModalCloseButtons = [...document.querySelectorAll("[data-donor-modal-close]")];

let mode = "local";
let state = {
  player: null,
  team: null,
};
let selectedIndex = null;

function showAction(message, isError = false) {
  if (typeof window.showActionMessage === "function") {
    window.showActionMessage(message, { isError });
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

function openDonationModal() {
  if (!donorModalBackdrop || !donationModal) return;
  donorModalBackdrop.hidden = false;
  donationModal.hidden = false;
}

function closeDonationModal() {
  if (!donorModalBackdrop || !donationModal) return;
  donorModalBackdrop.hidden = true;
  donationModal.hidden = true;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function percent(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((Number(raised || 0) / Number(goal || 0)) * 100));
}

function normalizeBackendPlayer(row) {
  return {
    id: row.id,
    teamId: row.team_id,
    teamName: row.team_name || "",
    firstName: row.first_name,
    lastName: row.last_name,
    imageDataUrl: row.image_data_url || "",
    goalTotal: Number(row.goalTotal || 0),
    raisedTotal: Number(row.raisedTotal || 0),
    equipment: (row.equipment || []).map((item) => ({
      id: item.id,
      name: String(item.name || "Equipment"),
      category: String(item.category || "General"),
      goal: Number(item.goal || 0),
      raised: Number(item.raised || 0),
      enabled: Number(item.enabled) === 1 || item.enabled === true,
    })),
  };
}

async function loadPlayer() {
  if (!publicPlayerId) throw new Error("Missing player id.");
  try {
    const data = await apiRequest(`/api/public/players/${encodeURIComponent(publicPlayerId)}`);
    mode = "backend";
    state.player = normalizeBackendPlayer(data.player);
    state.team = { id: data.player.team_id, name: data.player.team_name || "" };
    return;
  } catch {}

  const localPlayer = api.getPlayerByPublicPlayerId(publicPlayerId);
  if (!localPlayer) throw new Error("Player not found.");
  mode = "local";
  state.player = localPlayer;
  state.team = api.getTeamById(localPlayer.teamId);
}

function currentPlayer() {
  if (mode === "local") {
    return api.getPlayerByInternalId(state.player?.id);
  }
  return state.player;
}

function renderTop() {
  const current = currentPlayer();
  if (!current || !donorStats) return;
  const pct = percent(current.raisedTotal, current.goalTotal);
  if (donorNameHeading) donorNameHeading.textContent = `${current.firstName} ${current.lastName}`;
  if (donorTeamCopy) donorTeamCopy.textContent = state.team?.name || "Team";
  donorStats.innerHTML = `
    <div class="stat-pill"><span>${money(current.raisedTotal)}</span><small>Raised</small></div>
    <div class="stat-pill"><span>${money(current.goalTotal)}</span><small>Goal</small></div>
    <div class="stat-pill"><span>${pct}%</span><small>Progress</small></div>
  `;
}

function renderProfileInfo() {
  const current = currentPlayer();
  if (!current) return;
  playerTeam.textContent = state.team?.name || "";
  if (current.imageDataUrl) {
    playerImage.src = current.imageDataUrl;
    playerImage.hidden = false;
  } else {
    playerImage.hidden = true;
  }
}

function visibleEquipment(current) {
  return (current.equipment || [])
    .map((item, index) => ({ ...item, index }))
    .filter((item) => item.enabled !== false);
}

function renderEquipment() {
  const current = currentPlayer();
  if (!current || !equipmentGrid) return;
  const list = visibleEquipment(current);
  equipmentGrid.innerHTML = "";
  if (!list.length) {
    equipmentGrid.innerHTML = "<p>No public equipment items are available yet.</p>";
    return;
  }

  list.forEach((item) => {
    const progress = percent(item.raised, item.goal);
    const remaining = Math.max(0, Number(item.goal || 0) - Number(item.raised || 0));
    const row = document.createElement("div");
    row.className = "equipment-row";
    row.innerHTML = `
      <div class="equipment-row-top">
        <strong>${item.name}</strong>
        <span class="meta-pill meta-pill-muted">${item.category || "General"}</span>
      </div>
      <p class="subtle-copy">${money(item.raised)} raised of ${money(item.goal)}</p>
      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="equipment-actions section-top-gap-sm">
        <span class="subtle-copy">Remaining: ${money(remaining)}</span>
        <button class="btn btn-money" type="button" data-eq-index="${item.index}">
          Donate to ${item.name}
        </button>
      </div>
    `;
    equipmentGrid.appendChild(row);
  });
}

function openDonationForm(equipmentIndex) {
  const current = currentPlayer();
  if (!current || !donationForm || !donationHelp) return;
  const item = current.equipment[equipmentIndex];
  if (!item) return;
  selectedIndex = equipmentIndex;
  const remaining = Math.max(0, Number(item.goal || 0) - Number(item.raised || 0));
  selectedEquipmentCopy.textContent = `Selected: ${item.name} • Remaining ${money(remaining)}`;
  donationHelp.textContent = `Selected ${item.name}. Complete your donation in the popup modal.`;
  donationForm.amount.value = remaining > 0 ? Math.min(remaining, 25) : 0;
  donationFeedback.textContent = "";
  openDonationModal();
}

async function submitDonation(formData) {
  const current = currentPlayer();
  if (!current || selectedIndex === null) throw new Error("Choose an equipment item.");
  const item = current.equipment[selectedIndex];
  if (!item) throw new Error("Equipment item unavailable.");

  if (mode === "backend") {
    return apiRequest("/api/donations", {
      method: "POST",
      body: JSON.stringify({
        playerId: current.id,
        equipmentItemId: item.id,
        donorName: formData.get("donorName"),
        donorEmail: formData.get("donorEmail"),
        donorMessage: formData.get("donorMessage"),
        anonymous: Boolean(formData.get("anonymous")),
        amount: Number(formData.get("amount")),
      }),
    });
  }

  return api.recordDonation({
    playerInternalId: current.id,
    equipmentIndex: selectedIndex,
    donorName: formData.get("donorName"),
    donorEmail: formData.get("donorEmail"),
    donorMessage: formData.get("donorMessage"),
    anonymous: Boolean(formData.get("anonymous")),
    amount: formData.get("amount"),
  });
}

async function refreshAfterDonation() {
  if (mode === "backend") {
    const data = await apiRequest(`/api/public/players/${encodeURIComponent(publicPlayerId)}`);
    state.player = normalizeBackendPlayer(data.player);
    state.team = { id: data.player.team_id, name: data.player.team_name || "" };
    return;
  }
  state.player = api.getPlayerByInternalId(state.player?.id);
}

equipmentGrid?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const eqIndex = target.dataset.eqIndex;
  if (eqIndex === undefined) return;
  openDonationForm(Number(eqIndex));
});

fillRemainingButton?.addEventListener("click", () => {
  const current = currentPlayer();
  if (!current || selectedIndex === null || !donationForm) return;
  const item = current.equipment[selectedIndex];
  if (!item) return;
  const remaining = Math.max(0, Number(item.goal || 0) - Number(item.raised || 0));
  donationForm.amount.value = remaining;
});

donationForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(donationForm);
    const donation = await submitDonation(formData);
    donationFeedback.textContent = `Donation confirmed (${money(
      donation.amount
    )}). Receipt and player-notification emails will send once Stripe/email integration is enabled.`;
    donationFeedback.classList.remove("is-error");
    showAction(`Donation confirmed (${money(donation.amount)}). Thank you for supporting this athlete.`);
    donationForm.reset();
    selectedIndex = null;
    closeDonationModal();
    donationHelp.textContent = "Donation complete. You can donate to another item anytime.";
    await refreshAfterDonation();
    renderTop();
    renderEquipment();
    renderProfileInfo();
  } catch (error) {
    donationFeedback.textContent = error.message || "Could not process donation.";
    donationFeedback.classList.add("is-error");
    showAction(error.message || "Could not process donation.", true);
  }
});

jumpToDonateButton?.addEventListener("click", () => {
  donatePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
});

donorModalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeDonationModal);
});

donorModalBackdrop?.addEventListener("click", (event) => {
  if (event.target === donorModalBackdrop) closeDonationModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeDonationModal();
});

(async () => {
  try {
    await loadPlayer();
    renderTop();
    renderProfileInfo();
    renderEquipment();
  } catch {
    window.location.href = "/index.html";
  }
})();
