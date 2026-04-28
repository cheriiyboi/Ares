/* ===========================================================
   GLOBAL DATA
=========================================================== */

let animeList = [];
let adminAnimeData = []; // used only inside admin page

/* ===========================================================
   LOAD ANIME DATA
=========================================================== */

async function loadAnimeData() {
  try {
    const res = await fetch("animeData.json?nocache=" + Date.now());
    animeList = await res.json();
    adminAnimeData = JSON.parse(JSON.stringify(animeList));
    initPage();
  } catch (err) {
    console.error("Failed to load animeData.json", err);
  }
}

loadAnimeData();

/* ===========================================================
   PAGE ROUTER
=========================================================== */

function initPage() {
  const page = document.body.dataset.page;

  switch (page) {
    case "home":     initHomePage();    break;
    case "browse":   initBrowsePage();  break;
    case "episodes": initEpisodesPage();break;
    case "watch":    initWatchPage();   break;
    case "download": initDownloadPage();break;
    case "admin":    initAdminPage();   break;
  }
}

/* ===========================================================
   HOME — HERO & ROWS
=========================================================== */

let heroIndex = 0;
let heroList  = [];

function initHomePage() {
  if (!animeList.length) return;

  renderHomeSections();
  renderHeroBanner();
}

function renderHeroBanner() {
  heroList = [...animeList].sort((a, b) => b.popularity - a.popularity);

  setHeroAnime(heroList[0]);

  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroList.length;
    fadeHero(() => setHeroAnime(heroList[heroIndex]));
  }, 5000);
}

function fadeHero(cb) {
  const hero = document.querySelector(".hero-inner");
  if (!hero) return cb();

  hero.classList.add("fade-out");
  setTimeout(() => {
    cb();
    hero.classList.remove("fade-out");
    hero.classList.add("fade-in");
    setTimeout(() => hero.classList.remove("fade-in"), 700);
  }, 650);
}

function setHeroAnime(a) {
  if (!a) return;
  const t = document.getElementById("hero-title");
  const m = document.getElementById("hero-meta");
  const p = document.getElementById("hero-poster");
  const w = document.getElementById("hero-watch-btn");
  const pill = document.getElementById("hero-pill");

  if (t)   t.textContent   = a.title;
  if (m)   m.textContent   = `${a.seasons.length} Seasons`;
  if (p)   p.src           = a.poster;
  if (pill)pill.textContent= "Hindi Dub • Updated";

  if (w) w.onclick = () => location.href = `episodes.html?id=${a.id}`;
}

/* SWIPE SUPPORT */
let startX = 0, endX = 0;
const heroEl = document.querySelector(".hero-inner");

if (heroEl) {
  heroEl.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  heroEl.addEventListener("touchend", e => {
    endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) {
      heroIndex = (heroIndex + 1) % heroList.length;
      fadeHero(() => setHeroAnime(heroList[heroIndex]));
    }
    if (endX - startX > 50) {
      heroIndex = (heroIndex - 1 + heroList.length) % heroList.length;
      fadeHero(() => setHeroAnime(heroList[heroIndex]));
    }
  });
}

/* HOME ROWS */
function renderHomeSections() {
  renderHomeRow("latest-row",   [...animeList].sort((a,b)=>b.updated - a.updated));
  renderHomeRow("popular-row",  [...animeList].sort((a,b)=>b.popularity - a.popularity));
  renderHomeRow("trending-row", [...animeList].sort((a,b)=>b.trending - a.trending));
}

function renderHomeRow(id, list) {
  const row = document.getElementById(id);
  if (!row) return;

  row.innerHTML = "";
  list.forEach(a => {
    row.innerHTML += `
      <div class="anime-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <div class="card-title">${a.title}</div>
      </div>`;
  });
}

/* ===========================================================
   BROWSE PAGE
=========================================================== */

function initBrowsePage() {
  renderBrowseList(animeList);
  const box = document.getElementById("browse-search-input");

  if (box) {
    box.addEventListener("input", () => {
      const q = box.value.toLowerCase();
      renderBrowseList(animeList.filter(a => a.title.toLowerCase().includes(q)));
    });
  }
}

function renderBrowseList(list) {
  const grid = document.getElementById("browse-list");
  if (!grid) return;

  grid.innerHTML = "";
  list.forEach(a => {
    grid.innerHTML += `
      <div class="browse-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <h3>${a.title}</h3>
      </div>`;
  });
}

/* ===========================================================
   EPISODES PAGE
=========================================================== */

function initEpisodesPage() {
  const p  = new URLSearchParams(location.search);
  const id = p.get("id");
  const anime = animeList.find(a => a.id === id);
  if (!anime) return;

  document.getElementById("anime-title").textContent = anime.title;
  document.getElementById("anime-description").textContent = anime.description;
  document.getElementById("anime-poster").src = anime.poster;

  const s = document.getElementById("season-select");
  s.innerHTML = "";

  anime.seasons.forEach((sn, i) => s.innerHTML += `<option value="${i}">${sn.name}</option>`);
  s.onchange = () => renderEpisodes(anime, parseInt(s.value));

  renderEpisodes(anime, 0);
}

function renderEpisodes(anime, sIndex) {
  const list = document.getElementById("episodes-list");
  list.innerHTML = "";

  anime.seasons[sIndex].episodes.forEach(ep => {
    list.innerHTML += `
      <div class="episode-card">
        <div>
          <h3>${ep.title}</h3>
          <p>Episode ${ep.number}</p>
        </div>
        <button class="btn-primary"
          onclick="location.href='watch.html?id=${anime.id}&s=${sIndex}&e=${ep.number}'">
          Watch
        </button>
      </div>`;
  });
}

/* ===========================================================
   WATCH PAGE
=========================================================== */

function initWatchPage() {
  const q = new URLSearchParams(location.search);
  const anime = animeList.find(a => a.id === q.get("id"));
  const s  = parseInt(q.get("s"));
  const e  = parseInt(q.get("e"));

  const season = anime.seasons[s];
  const ep = season.episodes.find(x => x.number === e);

  document.getElementById("watch-title").textContent = `${anime.title} – Episode ${e}`;
  document.getElementById("watch-subtitle").textContent = season.name;

  const serverList = document.getElementById("server-list");
  serverList.innerHTML = "";

  ep.stream_servers.forEach(srv => {
    serverList.innerHTML += `
      <button class="btn-primary small-btn" onclick="loadServer('${srv.url}')">
        ${srv.name}
      </button>`;
  });

  if (ep.stream_servers.length) {
    loadServer(ep.stream_servers[0].url);
  }

  document.getElementById("prev-ep").onclick = () => {
    if (e > 1) location.href = `watch.html?id=${anime.id}&s=${s}&e=${e-1}`;
  };
  document.getElementById("next-ep").onclick = () => {
    if (e < season.episodes.length) location.href = `watch.html?id=${anime.id}&s=${s}&e=${e+1}`;
  };
  document.getElementById("download-btn").onclick = () => {
    location.href = `download.html?id=${anime.id}&s=${s}&e=${e}`;
  };
}

function loadServer(url) {
  const frame = document.getElementById("video-player");
  frame.src = url;
}

/* ===========================================================
   DOWNLOAD PAGE
=========================================================== */

function initDownloadPage() {
  const q = new URLSearchParams(location.search);
  const anime = animeList.find(a => a.id === q.get("id"));
  const s = parseInt(q.get("s"));
  const e = parseInt(q.get("e"));

  const ep = anime.seasons[s].episodes.find(x => x.number === e);

  document.getElementById("download-title").textContent = `${anime.title} – Episode ${e}`;
  document.getElementById("download-subtitle").textContent = anime.seasons[s].name;

  const box = document.getElementById("download-buttons");
  box.innerHTML = "";
  ep.download_servers.forEach(s => {
    box.innerHTML += `<a class="btn-primary" href="${s.url}" target="_blank">${s.name}</a>`;
  });

  startCountdown();
}

function startCountdown() {
  let sec = 10;
  const timer = document.getElementById("download-timer");
  const box = document.getElementById("download-buttons");

  const int = setInterval(() => {
    sec--;
    timer.textContent = `Please wait ${sec} seconds…`;
    if (sec <= 0) {
      clearInterval(int);
      timer.style.display = "none";
      box.style.display = "block";
    }
  }, 1000);
}
/* ===========================================================
   ADMIN PANEL
=========================================================== */

function initAdminPage() {
  fillAnimeDropdowns();
  updateJsonPreview();
}

/* -------------------- FILL ANIME LISTS -------------------- */

function fillAnimeDropdowns() {
  const s1 = document.getElementById("season-anime-select");
  const s2 = document.getElementById("episode-anime-select");

  s1.innerHTML = "";
  s2.innerHTML = "";

  adminAnimeData.forEach(a => {
    s1.innerHTML += `<option value="${a.id}">${a.title}</option>`;
    s2.innerHTML += `<option value="${a.id}">${a.title}</option>`;
  });

  updateSeasonDropdownForManage();
  updateEpisodeSeasonDropdown();
}

/* -------------------- ADD / EDIT ANIME -------------------- */

function addAnime() {
  const id    = document.getElementById("anime-id").value.trim();
  const title = document.getElementById("anime-title").value.trim();
  const poster= document.getElementById("anime-poster").value.trim();
  const desc  = document.getElementById("anime-description").value.trim();

  if (!id || !title) return alert("ID & Title required.");

  let a = adminAnimeData.find(x => x.id === id);

  if (a) {
    a.title       = title;
    a.poster      = poster;
    a.description = desc;
    a.updated     = Date.now();
    alert("Anime updated.");
  } else {
    adminAnimeData.push({
      id, title, poster,
      description: desc,
      popularity: 0,
      trending: 0,
      updated: Date.now(),
      seasons:[]
    });
    alert("Anime added.");
  }

  fillAnimeDropdowns();
  updateJsonPreview();
}

/* -------------------- DELETE ANIME -------------------- */
function deleteAnime() {
  const id = document.getElementById("anime-id").value.trim();
  if (!id) return alert("Enter Anime ID to delete.");

  if (!confirm("Delete entire anime?")) return;

  adminAnimeData = adminAnimeData.filter(a => a.id !== id);

  fillAnimeDropdowns();
  updateJsonPreview();
  alert("Anime deleted.");
}

/* -------------------- SEASON MANAGEMENT -------------------- */

function updateSeasonDropdownForManage() {
  const id = document.getElementById("season-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);
  const s = document.getElementById("season-select-manage");

  s.innerHTML = "";
  if (!anime) return;

  anime.seasons.forEach((sn,i) => s.innerHTML += `<option value="${i}">${sn.name}</option>`);
}

function addSeason() {
  const id = document.getElementById("season-anime-select").value;
  const name = document.getElementById("season-name").value.trim();

  if (!id || !name) return alert("Select anime & enter season name.");

  let a = adminAnimeData.find(x => x.id === id);
  let s = a.seasons.find(x => x.name === name);

  if (s) {
    alert("Season already exists!");
  } else {
    a.seasons.push({ name, episodes:[] });
    alert("Season added.");
  }

  fillAnimeDropdowns();
  updateJsonPreview();
}

function updateSeasonName() {
  const id = document.getElementById("season-anime-select").value;
  const newName = document.getElementById("season-name").value.trim();
  const index = parseInt(document.getElementById("season-select-manage").value);

  if (!newName) return alert("Enter new name.");

  let a = adminAnimeData.find(x => x.id === id);
  a.seasons[index].name = newName;

  alert("Season updated.");
  fillAnimeDropdowns();
  updateJsonPreview();
}

function deleteSeason() {
  const id = document.getElementById("season-anime-select").value;
  const index = parseInt(document.getElementById("season-select-manage").value);

  if (!confirm("Delete this season? All episodes will be removed.")) return;

  let a = adminAnimeData.find(x => x.id === id);
  a.seasons.splice(index, 1);

  fillAnimeDropdowns();
  updateJsonPreview();
}

/* -------------------- EPISODE MANAGEMENT -------------------- */

function updateEpisodeSeasonDropdown() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const s = document.getElementById("episode-season-select");
  s.innerHTML = "";

  anime.seasons.forEach((sn,i)=> s.innerHTML += `<option value="${i}">${sn.name}</option>`);

  loadEpisodeListForAdmin();
}

/* Populate episode-select dropdown */
function loadEpisodeListForAdmin() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sindex = parseInt(document.getElementById("episode-season-select").value);
  const season = anime.seasons[sindex];

  const epDD = document.getElementById("episode-select");
  epDD.innerHTML = "";

  season.episodes.forEach(ep => {
    epDD.innerHTML += `<option value="${ep.number}">Episode ${ep.number} – ${ep.title}</option>`;
  });
}

/* Auto-fill episode form */
function loadEpisodeIntoForm() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sindex = parseInt(document.getElementById("episode-season-select").value);
  const season = anime.seasons[sindex];

  const number = parseInt(document.getElementById("episode-select").value);
  const ep = season.episodes.find(x => x.number === number);

  if (!ep) return;

  document.getElementById("ep-number").value = ep.number;
  document.getElementById("ep-title").value = ep.title;

  const fm  = ep.stream_servers.find(x => x.name==="Filemoon");
  const st  = ep.stream_servers.find(x => x.name==="StreamTape");
  const sh  = ep.stream_servers.find(x => x.name==="StreamGH");

  const dl_fm = ep.download_servers.find(x => x.name==="Filemoon DL");
  const dl_sh = ep.download_servers.find(x => x.name==="StreamGH DL");

  document.getElementById("stream-filemoon").value   = fm ? fm.url : "";
  document.getElementById("stream-streamtape").value = st ? st.url : "";
  document.getElementById("stream-streamgh").value   = sh ? sh.url : "";

  document.getElementById("dl-filemoon").value = dl_fm ? dl_fm.url : "";
  document.getElementById("dl-streamgh").value = dl_sh ? dl_sh.url : "";
}

/* Add new episode */
function addEpisode() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sindex = parseInt(document.getElementById("episode-season-select").value);
  const season = anime.seasons[sindex];

  const num = parseInt(document.getElementById("ep-number").value);
  const title = document.getElementById("ep-title").value.trim();

  const fm  = document.getElementById("stream-filemoon").value.trim();
  const st  = document.getElementById("stream-streamtape").value.trim();
  const sh  = document.getElementById("stream-streamgh").value.trim();

  const dl_fm = document.getElementById("dl-filemoon").value.trim();
  const dl_sh = document.getElementById("dl-streamgh").value.trim();

  const ep = {
    number: num,
    title,
    stream_servers: [
      ...(fm? [{name:"Filemoon",url:fm}] : []),
      ...(st? [{name:"StreamTape",url:st}] : []),
      ...(sh? [{name:"StreamGH",url:sh}] : [])
    ],
    download_servers: [
      ...(dl_fm? [{name:"Filemoon DL",url:dl_fm}] : []),
      ...(dl_sh? [{name:"StreamGH DL",url:dl_sh}] : [])
    ]
  };

  if (season.episodes.some(x=>x.number===num))
    return alert("Episode exists. Use Update instead.");

  season.episodes.push(ep);

  alert("Episode added.");
  loadEpisodeListForAdmin();
  updateJsonPreview();
}

/* Update existing episode */
function updateEpisode() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sindex = parseInt(document.getElementById("episode-season-select").value);
  const season = anime.seasons[sindex];

  const num = parseInt(document.getElementById("ep-number").value);

  const index = season.episodes.findIndex(x => x.number === num);
  if (index === -1) return alert("Episode not found.");

  season.episodes[index] = {
    number: num,
    title: document.getElementById("ep-title").value.trim(),
    stream_servers: [
      ...(document.getElementById("stream-filemoon").value.trim()? [{name:"Filemoon",url:document.getElementById("stream-filemoon").value.trim()}] : []),
      ...(document.getElementById("stream-streamtape").value.trim()? [{name:"StreamTape",url:document.getElementById("stream-streamtape").value.trim()}] : []),
      ...(document.getElementById("stream-streamgh").value.trim()? [{name:"StreamGH",url:document.getElementById("stream-streamgh").value.trim()}] : [])
    ],
    download_servers: [
      ...(document.getElementById("dl-filemoon").value.trim()? [{name:"Filemoon DL",url:document.getElementById("dl-filemoon").value.trim()}] : []),
      ...(document.getElementById("dl-streamgh").value.trim()? [{name:"StreamGH DL",url:document.getElementById("dl-streamgh").value.trim()}] : [])
    ]
  };

  alert("Episode updated.");
  updateJsonPreview();
  loadEpisodeListForAdmin();
}

/* Delete episode */
function deleteEpisode() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sindex = parseInt(document.getElementById("episode-season-select").value);
  const season = anime.seasons[sindex];

  const num = parseInt(document.getElementById("episode-select").value);

  if (!confirm("Delete this episode?")) return;

  season.episodes = season.episodes.filter(x => x.number !== num);

  alert("Episode deleted.");
  loadEpisodeListForAdmin();
  updateJsonPreview();
}

/* ===========================================================
   LIVE JSON PREVIEW
=========================================================== */
function updateJsonPreview() {
  const box = document.getElementById("json-preview");
  box.textContent = JSON.stringify(adminAnimeData, null, 2);
}

/* ===========================================================
   SAVE TO GITHUB (PUT)
=========================================================== */

async function saveToGitHub() {
  const owner = document.getElementById("github-owner").value.trim();
  const repo  = document.getElementById("github-repo").value.trim();
  const branch= document.getElementById("github-branch").value.trim();
  const file  = document.getElementById("github-file-path").value.trim();
  const token = document.getElementById("github-token").value.trim();

  if (!owner || !repo || !branch || !file || !token)
    return alert("Fill all GitHub fields.");

  const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${file}`;

  const getRes = await fetch(apiURL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!getRes.ok) return alert("Failed to read existing file.");

  const getData = await getRes.json();
  const sha = getData.sha;

  const content = btoa(unescape(encodeURIComponent(
    JSON.stringify(adminAnimeData, null, 2)
  )));

  const uploadRes = await fetch(apiURL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Updated via Admin Panel",
      content,
      sha,
      branch
    })
  });

  if (uploadRes.ok) alert("Uploaded! Vercel will redeploy.");
  else alert("GitHub upload failed.");
}
