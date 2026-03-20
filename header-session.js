const headerDataApi = window.GridironData;

async function headerApiRequest(path) {
  const response = await fetch(path);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "Request failed.");
  return json;
}

function closeHeaderMenu(menu, trigger) {
  if (!menu || !trigger) return;
  menu.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function openHeaderMenu(menu, trigger) {
  if (!menu || !trigger) return;
  menu.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
}

async function resolveSessionDisplayName(session) {
  if (!session || !headerDataApi) return "Account";
  const role = session.role;
  const backendId = session.backendId || session.id;

  if (role === "coach") {
    if (backendId) {
      try {
        const data = await headerApiRequest(`/api/coaches/${encodeURIComponent(backendId)}/dashboard`);
        if (data?.coach?.name) return String(data.coach.name).trim();
      } catch {}
    }
    try {
      const local = headerDataApi.getCoachWithTeam(session.id);
      if (local?.coach?.name) return String(local.coach.name).trim();
    } catch {}
    return "Coach";
  }

  if (role === "player") {
    if (backendId) {
      try {
        const data = await headerApiRequest(`/api/players/${encodeURIComponent(backendId)}/dashboard`);
        const first = String(data?.player?.first_name || "").trim();
        const last = String(data?.player?.last_name || "").trim();
        const full = `${first} ${last}`.trim();
        if (full) return full;
      } catch {}
    }
    try {
      const local = headerDataApi.getPlayerByInternalId(session.id);
      if (local) return `${local.firstName || ""} ${local.lastName || ""}`.trim() || "Player";
    } catch {}
    return "Player";
  }

  return "Account";
}

function buildSessionMenu({ role, name }) {
  const wrap = document.createElement("div");
  wrap.className = "user-menu";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "btn btn-ghost user-menu-trigger";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = `<span>${name}</span><span class="menu-caret">▾</span>`;

  const menu = document.createElement("div");
  menu.className = "user-menu-dropdown";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  const dashboardLink = document.createElement("a");
  dashboardLink.className = "user-menu-item";
  dashboardLink.setAttribute("role", "menuitem");
  dashboardLink.href = role === "coach" ? "/coach-dashboard.html" : "/player-dashboard.html";
  dashboardLink.textContent = role === "coach" ? "Team Manager Dashboard" : "Player Dashboard";

  const signOutButton = document.createElement("button");
  signOutButton.type = "button";
  signOutButton.className = "user-menu-item user-menu-item-danger";
  signOutButton.setAttribute("role", "menuitem");
  signOutButton.textContent = "Sign Out";

  signOutButton.addEventListener("click", () => {
    headerDataApi?.clearSession?.();
    window.location.href = "/index.html";
  });

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.hidden) openHeaderMenu(menu, trigger);
    else closeHeaderMenu(menu, trigger);
  });

  document.addEventListener("click", (event) => {
    if (!wrap.contains(event.target)) closeHeaderMenu(menu, trigger);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeHeaderMenu(menu, trigger);
  });

  menu.append(dashboardLink, signOutButton);
  wrap.append(trigger, menu);
  return wrap;
}

(async () => {
  if (!headerDataApi) return;
  const actions = document.querySelector(".header-actions");
  if (!actions) return;

  const session = headerDataApi.getSession();
  if (!session || !session.role) return;

  actions.querySelectorAll("[data-auth-guest]").forEach((el) => {
    el.hidden = true;
  });
  actions.querySelectorAll("#coach-logout, #player-logout").forEach((el) => {
    el.remove();
  });

  const displayName = await resolveSessionDisplayName(session);
  const menu = buildSessionMenu({ role: session.role, name: displayName || "Account" });
  actions.appendChild(menu);
})();
