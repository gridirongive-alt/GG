const api = window.GridironData;
api.bootstrapDemoData();

const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");

const teamTop = document.getElementById("team-top");
const rosterBody = document.getElementById("team-roster-body");

let mode = "local";
let state = {
  team: null,
  players: [],
};

async function apiRequest(path) {
  const response = await fetch(path);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function progress(raised, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((Number(raised || 0) / Number(goal || 0)) * 100));
}

function normalizeBackend(data) {
  const team = {
    id: data.team.id,
    name: data.team.name,
    location: data.team.location || "",
    sport: data.team.sport || "",
  };
  const players = (data.players || []).map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    playerId: p.player_public_id,
    raisedTotal: Number(p.raisedTotal || 0),
    goalTotal: Number(p.goalTotal || 0),
  }));
  return { team, players };
}

async function loadTeam() {
  if (!teamId) throw new Error("Missing team id.");
  try {
    const data = await apiRequest(`/api/public/teams/${encodeURIComponent(teamId)}`);
    mode = "backend";
    const normalized = normalizeBackend(data);
    state.team = normalized.team;
    state.players = normalized.players;
    return;
  } catch {}

  const local = api.getTeamRoster(teamId);
  if (!local) throw new Error("Team not found.");
  mode = "local";
  state.team = local.team;
  state.players = local.players;
}

function renderTop() {
  if (!teamTop || !state.team) return;
  const totalRaised = state.players.reduce((sum, item) => sum + Number(item.raisedTotal || 0), 0);
  const totalGoal = state.players.reduce((sum, item) => sum + Number(item.goalTotal || 0), 0);
  const teamProgress = progress(totalRaised, totalGoal);
  teamTop.innerHTML = `
    <div>
      <p class="eyebrow">Team View</p>
      <h1 class="dashboard-title">${state.team.name}</h1>
      <p class="dashboard-copy">${state.team.location || "Location not set"}${
    state.team.sport ? ` • ${state.team.sport}` : ""
  }</p>
    </div>
    <div class="stats-row">
      <div class="stat-pill"><span>${money(totalRaised)}</span><small>Raised</small></div>
      <div class="stat-pill"><span>${money(totalGoal)}</span><small>Goal</small></div>
      <div class="stat-pill"><span>${teamProgress}%</span><small>Progress</small></div>
    </div>
  `;
}

function renderRoster() {
  if (!rosterBody) return;
  rosterBody.innerHTML = "";
  if (!state.players.length) {
    rosterBody.innerHTML = '<tr><td colspan="6" class="subtle-copy">No players found.</td></tr>';
    return;
  }
  state.players.forEach((player) => {
    const tr = document.createElement("tr");
    const pct = progress(player.raisedTotal, player.goalTotal);
    const playerHref = `/player-profile.html?playerId=${encodeURIComponent(player.playerId)}`;
    tr.innerHTML = `
      <td><a class="table-name-link" href="${playerHref}">${player.firstName} ${player.lastName}</a></td>
      <td>-</td>
      <td>${money(player.raisedTotal)}</td>
      <td>${money(player.goalTotal)}</td>
      <td>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </td>
      <td>
        <a class="btn btn-soft btn-small" href="${playerHref}">View Player</a>
      </td>
    `;
    rosterBody.appendChild(tr);
  });
}

(async () => {
  try {
    await loadTeam();
    renderTop();
    renderRoster();
  } catch {
    window.location.href = "/index.html";
  }
})();
