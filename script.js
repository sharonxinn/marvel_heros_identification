const heroes = window.HERO_PROFILES || [];

const API_BASE_URL = "http://127.0.0.1:8000";
const archiveGrid = document.querySelector("#archive-grid");
const imageInput = document.querySelector("#image-input");
const dropZone = document.querySelector("#drop-zone");
const previewContainer = document.querySelector("#preview-container");
const analyzeButton = document.querySelector("#analyze-button");
const cameraButton = document.querySelector("#camera-button");
const emptyResult = document.querySelector("#empty-result");
const analysisLoading = document.querySelector("#analysis-loading");
const analysisError = document.querySelector("#analysis-error");
const errorMessage = document.querySelector("#error-message");
const heroResult = document.querySelector("#hero-result");
const progressText = document.querySelector("#loading-progress");
const loadingMessage = document.querySelector("#loading-message");
const resultName = document.querySelector("#result-name");
const resultAvatar = document.querySelector("#result-avatar");
const resultDescription = document.querySelector("#result-description");
const confidenceValue = document.querySelector("#confidence-value");
const confidenceBar = document.querySelector("#confidence-bar");
const modelState = document.querySelector("#model-state");
const modal = document.querySelector("#story-modal");
const modalName = document.querySelector("#modal-name");
const modalAlias = document.querySelector("#modal-alias");
const modalFile = document.querySelector("#modal-file");
const modalStory = document.querySelector("#modal-story");
const modalTraits = document.querySelector("#modal-traits");
const modalPortrait = document.querySelector("#modal-portrait");

let selectedHero = null;
let uploadedFile = null;
let currentObjectUrl = null;
let cameraStream = null;
let cameraVideo = null;
const SOUNDCLOUD_TRACK_URL = "https://soundcloud.com/davidstunes/avengers-infinity-war-theme?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing";
let soundcloudWidget = null;
let soundcloudWidgetPromise = null;

function loadSoundCloudWidget() {
  if (soundcloudWidget) return Promise.resolve(soundcloudWidget);
  if (soundcloudWidgetPromise) return soundcloudWidgetPromise;
  soundcloudWidgetPromise = new Promise((resolve, reject) => {
    const mountWidget = () => {
      const iframe = document.querySelector("#soundcloud-audio-host");
      if (!iframe) {
        reject(new Error("The SoundCloud player host could not be found."));
        return;
      }
      soundcloudWidget = window.SC.Widget(iframe);
      soundcloudWidget.bind(window.SC.Widget.Events.READY, () => {
        soundcloudWidget.setVolume(35);
        resolve(soundcloudWidget);
      });
      soundcloudWidget.bind(window.SC.Widget.Events.ERROR, () => {
        reject(new Error("The selected SoundCloud track could not be loaded."));
      });
    };
    if (window.SC && window.SC.Widget) {
      mountWidget();
      return;
    }
    const apiScript = document.createElement("script");
    apiScript.src = "https://w.soundcloud.com/player/api.js";
    apiScript.async = true;
    apiScript.onerror = () => reject(new Error("SoundCloud could not be reached."));
    apiScript.onload = mountWidget;
    document.head.append(apiScript);
  });
  return soundcloudWidgetPromise;
}

async function startBackgroundMusic() {
  const widget = await loadSoundCloudWidget();
  widget.play();
}

function stopBackgroundMusic() {
  if (soundcloudWidget) soundcloudWidget.pause();
}

function portraitMarkup(hero) {
  if (hero.className === "iron") {
    return '<div class="card-portrait portrait-iron"><div class="helmet"><div class="helmet-top"></div><div class="helmet-face"><i></i><i></i></div><div class="helmet-jaw"></div></div><div class="portrait-chest"><div class="arc-core"></div></div></div>';
  }
  return `<div class="card-portrait ${hero.className}"><div class="generic-head"></div><div class="generic-body"></div></div>`;
}

function renderArchive(showAll = false) {
  const profiles = showAll ? heroes : heroes.slice(0, 4);
  archiveGrid.innerHTML = profiles.map((hero, index) => `
    <article class="archive-card" data-hero="${hero.id}" style="--hero-glow:${hero.glow}">
      <span class="card-number">${String(index + 1).padStart(3, "0")}</span><span class="card-type">${hero.type}</span>
      ${portraitMarkup(hero)}<h3>${hero.name}</h3><p>${hero.alias}</p>
    </article>
  `).join("");
}

function getHero(label) {
  return heroes.find(hero => hero.id === String(label).toLowerCase().trim()) || null;
}

function clearPreview() {
  previewContainer.querySelectorAll(".preview-image, .preview-video").forEach(element => element.remove());
}

function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  cameraVideo = null;
  cameraButton.innerHTML = "<span>◉</span> Use camera";
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  stopCamera();
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  image.className = "preview-image";
  image.src = currentObjectUrl;
  image.alt = "Portrait ready for analysis";
  clearPreview();
  previewContainer.append(image);
  previewContainer.classList.add("has-image");
  dropZone.querySelector(".drop-footer span").textContent = "FACE REGION: READY";
  uploadedFile = file;
  analyzeButton.disabled = false;
}

function setPanel(mode) {
  emptyResult.classList.toggle("hidden", mode !== "empty");
  analysisLoading.classList.toggle("hidden", mode !== "loading");
  analysisError.classList.toggle("hidden", mode !== "error");
  heroResult.classList.toggle("hidden", mode !== "result");
}

function showError(message) {
  setPanel("error");
  errorMessage.textContent = message;
  confidenceBar.style.width = "0";
}

function showResult(hero, prediction) {
  selectedHero = hero;
  setPanel("result");
  resultName.textContent = hero.name;
  resultDescription.textContent = hero.short;
  confidenceValue.textContent = `${(prediction.confidence * 100).toFixed(1)}%`;
  resultAvatar.className = `result-avatar portrait-mini ${hero.className}`;
  requestAnimationFrame(() => { confidenceBar.style.width = `${prediction.confidence * 100}%`; });
}

async function runAnalysis() {
  if (!uploadedFile) return;
  setPanel("loading");
  analyzeButton.disabled = true;
  let progress = 8;
  progressText.textContent = `${progress}%`;
  loadingMessage.textContent = "Detecting and aligning face...";
  const progressTimer = window.setInterval(() => {
    progress = Math.min(progress + Math.floor(Math.random() * 7) + 3, 88);
    progressText.textContent = `${progress}%`;
  }, 170);
  try {
    const formData = new FormData();
    formData.append("image", uploadedFile);
    const response = await fetch(`${API_BASE_URL}/api/classify`, { method: "POST", body: formData });
    const prediction = await response.json();
    if (!response.ok) {
      const detail = typeof prediction.detail === "string" ? prediction.detail : prediction.detail?.message;
      throw new Error(detail || "The recognition service could not process this image.");
    }
    const hero = getHero(prediction.label);
    if (!hero) {
      throw new Error(`The model returned the class “${prediction.label}”, which does not have a story profile. Use the documented dataset label names.`);
    }
    progressText.textContent = "100%";
    loadingMessage.textContent = "Model prediction verified.";
    window.setTimeout(() => showResult(hero, prediction), 180);
  } catch (error) {
    showError(error.message.includes("Failed to fetch")
      ? "Recognition service is offline. Start the local FastAPI server after training the model."
      : error.message);
  } finally {
    window.clearInterval(progressTimer);
    analyzeButton.disabled = false;
  }
}

async function startCamera() {
  if (cameraStream && cameraVideo) {
    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    canvas.getContext("2d").drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) loadFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", .92);
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    clearPreview();
    cameraVideo = document.createElement("video");
    cameraVideo.className = "preview-video";
    cameraVideo.autoplay = true;
    cameraVideo.playsInline = true;
    cameraVideo.srcObject = cameraStream;
    previewContainer.append(cameraVideo);
    previewContainer.classList.add("has-image");
    dropZone.querySelector(".drop-footer span").textContent = "CAMERA: LIVE";
    cameraButton.innerHTML = "<span>◉</span> Capture frame";
  } catch {
    showError("Camera access was not available. Please upload a face-focused image instead.");
  }
}

function openStory(hero) {
  if (!hero) return;
  selectedHero = hero;
  modalName.textContent = hero.name;
  modalAlias.textContent = hero.alias;
  modalFile.textContent = `STORY_FILE // ${String(heroes.indexOf(hero) + 1).padStart(3, "0")}`;
  modalStory.textContent = hero.story;
  modalTraits.innerHTML = hero.traits.map(trait => `<span>${trait}</span>`).join("");
  modalPortrait.className = `modal-portrait ${hero.className}`;
  modalPortrait.innerHTML = hero.className === "iron"
    ? '<div class="helmet"><div class="helmet-top"></div><div class="helmet-face"><i></i><i></i></div><div class="helmet-jaw"></div></div><div class="portrait-chest"><div class="arc-core"></div></div>'
    : '<div class="generic-head"></div><div class="generic-body"></div>';
  modal.showModal();
}

async function checkModelStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const status = await response.json();
    if (status.ready) {
      modelState.textContent = "MODEL ONLINE";
      modelState.style.color = "var(--acid)";
    } else {
      modelState.textContent = "MODEL NOT TRAINED";
      modelState.style.color = "#ffad68";
    }
  } catch {
    modelState.textContent = "MODEL OFFLINE";
    modelState.style.color = "#ff7f75";
  }
}

imageInput.addEventListener("change", event => loadFile(event.target.files[0]));
["dragenter", "dragover"].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.add("dragging"); }));
["dragleave", "drop"].forEach(eventName => dropZone.addEventListener(eventName, event => { event.preventDefault(); dropZone.classList.remove("dragging"); }));
dropZone.addEventListener("drop", event => loadFile(event.dataTransfer.files[0]));
dropZone.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") imageInput.click(); });
analyzeButton.addEventListener("click", runAnalysis);
cameraButton.addEventListener("click", startCamera);
document.querySelector("#open-story").addEventListener("click", () => openStory(selectedHero));
document.querySelector("#close-result").addEventListener("click", () => { setPanel("empty"); confidenceBar.style.width = "0"; });
document.querySelector("#retry-scan").addEventListener("click", () => { setPanel("empty"); document.querySelector("#scanner").scrollIntoView({ behavior: "smooth" }); });
document.querySelector("#close-modal").addEventListener("click", () => modal.close());
document.querySelector("#scan-another").addEventListener("click", () => { modal.close(); document.querySelector("#scanner").scrollIntoView({ behavior: "smooth" }); });
document.querySelector("[data-scroll-to='archive']").addEventListener("click", () => document.querySelector("#archive").scrollIntoView({ behavior: "smooth" }));
document.querySelector(".sound-toggle").addEventListener("click", async event => {
  const button = event.currentTarget;
  const isTurningOn = !button.classList.contains("active");
  try {
    if (isTurningOn) await startBackgroundMusic();
    else stopBackgroundMusic();
    button.classList.toggle("active", isTurningOn);
    button.querySelector(".sound-label").textContent = isTurningOn ? "SOUND: ON" : "SOUND: OFF";
    button.setAttribute("aria-label", isTurningOn ? "Turn background music off" : "Turn background music on");
  } catch {
    button.querySelector(".sound-label").textContent = "SOUND: BLOCKED";
  }
});
archiveGrid.addEventListener("click", event => { const card = event.target.closest(".archive-card"); if (card) openStory(getHero(card.dataset.hero)); });
document.querySelector("#view-all-button").addEventListener("click", event => { const showAll = event.currentTarget.dataset.expanded !== "true"; renderArchive(showAll); event.currentTarget.dataset.expanded = String(showAll); event.currentTarget.innerHTML = showAll ? "Show featured profiles <span>↗</span>" : "View all profiles <span>↘</span>"; });

renderArchive();
checkModelStatus();

// Theme toggle: persist preference and apply `data-theme="light"` when set.
const themeToggle = document.querySelector('.theme-toggle');
function applyTheme(theme) {
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  updateThemeLabel(theme);
}
function updateThemeLabel(theme) {
  if (!themeToggle) return;
  const label = themeToggle.querySelector('.theme-label');
  if (label) label.textContent = theme === 'light' ? 'LIGHT' : 'DARK';
  themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
}
function initTheme() {
  try {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  } catch (e) { /* ignore storage errors */ }
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  });
}
initTheme();

// --- Simple Hero Chatbot (client-side, uses HERO_PROFILES) ---
const chatPanel = document.getElementById('hero-chat');
const openChat = document.getElementById('open-chat');
const closeChat = document.getElementById('close-chat');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

function appendMessage(text, who = 'bot') {
  const wrap = document.createElement('div');
  wrap.className = `chat-message ${who}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = text;
  wrap.appendChild(bubble);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function openChatPanel() { chatPanel.classList.remove('hidden'); chatInput.focus(); }
function closeChatPanel() { chatPanel.classList.add('hidden'); }
openChat && openChat.addEventListener('click', openChatPanel);
closeChat && closeChat.addEventListener('click', closeChatPanel);

// Build a lightweight searchable index over the local profiles.
const SEARCH_INDEX = heroes.map(h => ({
  h,
  text: `${h.id} ${h.name} ${h.alias} ${h.affiliation} ${h.role} ${h.story} ${h.traits.join(' ')}`.toLowerCase(),
  name: h.name.toLowerCase(),
  alias: h.alias.toLowerCase(),
}));

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fuzzyNameScore(name, query) {
  if (!query) return 0;
  const dist = levenshtein(name, query);
  const maxLen = Math.max(name.length, query.length);
  if (maxLen === 0) return 0;
  return 1 - dist / maxLen; // 1.0 best, 0 worst
}

function searchHeroes(query) {
  const q = (query || '').toLowerCase().trim();
  const tokens = q.split(/\W+/).filter(Boolean);
  return SEARCH_INDEX.map(({ h, text, name, alias }) => {
    // token overlap score
    let tokenMatches = 0;
    tokens.forEach(t => { if (text.includes(t)) tokenMatches += 1; });
    const tokenScore = tokens.length ? tokenMatches / tokens.length : 0;
    // name similarity
    const nameScore = Math.max(fuzzyNameScore(name, q), fuzzyNameScore(alias, q));
    // final weighted score
    const score = Math.min(1, tokenScore * 0.65 + nameScore * 0.45);
    return { hero: h, score };
  }).sort((a, b) => b.score - a.score);
}

function findHeroByQuery(q) {
  const raw = (q || '').toLowerCase().trim();
  if (!raw) return null;
  // exact id/name/alias
  const exact = heroes.find(h => h.id === raw || h.name.toLowerCase() === raw || h.alias.toLowerCase() === raw);
  if (exact) return exact;
  // search and return best if confident
  const results = searchHeroes(raw);
  if (results.length && results[0].score >= 0.5) return results[0].hero;
  return null;
}

async function generateBotResponse(question) {
  const q = (question || '').trim();
  if (!q) return "Ask me about a hero's powers, affiliation, or story — try 'Who is Iron Man?'";
  const ql = q.toLowerCase();
  // list / search requests
  if (/\b(list|all heroes|who are|show heroes|names of|search)\b/.test(ql)) {
    const results = searchHeroes(ql).slice(0, 10).map(r => r.hero.name).join(', ');
    return `Matching heroes: ${results}. Ask about a specific name for details.`;
  }

  // strip common question prefixes for lookup
  const cleaned = q.replace(/who is |tell me about |what is |what are |powers of |tell me the story of /ig, '').trim();
  // direct/exact lookup
  const direct = findHeroByQuery(cleaned);
  if (direct) {
    return `<strong>${direct.name}</strong> — alias: ${direct.alias}. Role: ${direct.role}. Affiliation: ${direct.affiliation}. Abilities: ${direct.traits.slice(1,4).join(', ')}. ${direct.story}`;
  }

  // fallback: ranked suggestions
  const ranked = searchHeroes(ql).slice(0, 4);
  if (ranked.length && ranked[0].score > 0.2) {
    if (ranked[0].score >= 0.45) {
      const h = ranked[0].hero;
      return `I think you mean <strong>${h.name}</strong> — ${h.short} Abilities include: ${h.traits.slice(1,4).join(', ')}.`;
    }
    const suggestions = ranked.map(r => `${r.hero.name} (${Math.round(r.score * 100)}%)`).join(', ');
    return `I couldn't be certain. Did you mean: ${suggestions}? Try one of those names.`;
  }

  return "I couldn't find a good match in the local profiles — try asking 'Who is Black Widow?' or use a character name.";
}

chatForm && chatForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  chatInput.value = '';
  // typing indicator
  const typing = document.createElement('div');
  typing.className = 'chat-message bot';
  typing.innerHTML = '<div class="bubble chat-typing">…</div>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  try {
    // Try backend LLM first, fallback to local generator
    let reply = null;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      if (resp.ok) {
        const payload = await resp.json();
        reply = payload.answer || payload.answer_text || null;
      }
    } catch (e) {
      // network error or backend not running — fallback below
      reply = null;
    }
    if (!reply) {
      reply = await generateBotResponse(text);
    }
    typing.remove();
    appendMessage(reply, 'bot');
  } catch (e) {
    typing.remove();
    appendMessage("Sorry, I couldn't process that question.", 'bot');
  }
});

// welcome message
appendMessage('Hi — ask me about any hero in the archive. Try: "Who is Thor?"');
