const heroes = [
  { id: "iron_man", name: "IRON MAN", alias: "TONY STARK", type: "AVENGER", short: "A brilliant inventor in a suit of armor, turning recklessness into responsibility.", story: "Tony Stark begins as a genius weapons maker whose captivity forces him to build the first Iron Man armor. Back home, he trades the life of an arms dealer for something harder: using his inventions, ego, and courage to protect a world he helped endanger.", traits: ["Genius inventor", "Arc reactor", "Armor systems"], className: "iron", glow: "rgba(237, 72, 48, .4)" },
  { id: "spider_man", name: "SPIDER-MAN", alias: "PETER PARKER", type: "STREET HERO", short: "A young hero balancing impossible responsibility with an ordinary life.", story: "After a radioactive spider bite gives Peter Parker astonishing abilities, a personal loss teaches him what power really costs. Between school, family, and villains larger than life, he keeps choosing to help—because he knows no one else may be there.", traits: ["Spider-sense", "Wall-crawling", "Web engineering"], className: "spider", glow: "rgba(228, 47, 47, .38)" },
  { id: "doctor_strange", name: "DOCTOR STRANGE", alias: "STEPHEN STRANGE", type: "MYSTIC ARTS", short: "A gifted surgeon who learns that reality is stranger—and wider—than he imagined.", story: "A devastating injury strips Stephen Strange of the surgical skill that defined him. His search for healing leads to the mystic arts, where he exchanges certainty for discipline and becomes a guardian of Earth against threats that bend time, space, and reason.", traits: ["Sorcery", "Time manipulation", "Sanctum guardian"], className: "strange", glow: "rgba(212, 98, 41, .36)" },
  { id: "black_panther", name: "BLACK PANTHER", alias: "T'CHALLA", type: "WAKANDA", short: "A king, scientist, and protector carrying the future of Wakanda.", story: "T'Challa inherits both the mantle of the Black Panther and the responsibility of leading Wakanda. With the strength of the heart-shaped herb and the insight to challenge old traditions, he works to protect his nation while deciding how it should meet the world.", traits: ["Vibranium suit", "Enhanced senses", "Strategic leader"], className: "panther", glow: "rgba(136, 93, 255, .4)" },
  { id: "thor", name: "THOR", alias: "THOR ODINSON", type: "ASGARD", short: "The God of Thunder, learning that worth is earned rather than inherited.", story: "Once a proud prince of Asgard, Thor is cast to Earth and humbled by a world that does not care about his title. He grows into a defender of the Nine Realms—not through strength alone, but through loyalty, sacrifice, and a willingness to change.", traits: ["Mjolnir", "Stormcalling", "Asgardian"], className: "thor", glow: "rgba(91, 153, 247, .35)" },
  { id: "loki", name: "LOKI", alias: "LOKI LAUFEYSON", type: "ASGARD", short: "The god of mischief: clever, complicated, and always one step sideways.", story: "Raised as an Asgardian prince while carrying the secret of his Frost Giant birth, Loki spends much of his life searching for a place to belong. His gifts for illusion and strategy make him dangerous, but beneath the mischief is a character constantly choosing between ambition, family, and redemption.", traits: ["Illusion magic", "Shape-shifting", "Master tactician"], className: "loki", glow: "rgba(107, 194, 79, .38)" },
  { id: "black_widow", name: "BLACK WIDOW", alias: "NATASHA ROMANOFF", type: "AVENGER", short: "A master spy determined to make her second chance count.", story: "Natasha Romanoff was trained to be a weapon in the Red Room, but she chooses a different path. Her sharp instincts and unshakable resolve make her an Avenger, while her past gives every act of trust and sacrifice a deeper meaning.", traits: ["Master spy", "Combat expert", "Tactical mind"], className: "widow", glow: "rgba(212, 62, 48, .38)" },
  { id: "captain_america", name: "CAPTAIN AMERICA", alias: "STEVE ROGERS", type: "AVENGER", short: "A soldier from another era whose moral compass never moved.", story: "Steve Rogers starts as a small but determined volunteer who is chosen for the Super Soldier program because of his character. Awakened decades after the war, he becomes Captain America: a leader who believes freedom is worth defending, even when doing so is difficult.", traits: ["Super soldier", "Vibranium shield", "Field leader"], className: "captain", glow: "rgba(65, 123, 226, .4)" },
  { id: "scarlet_witch", name: "SCARLET WITCH", alias: "WANDA MAXIMOFF", type: "MYSTIC ARTS", short: "A powerful being whose grief and hope can reshape reality itself.", story: "Wanda Maximoff's life is shaped by loss, love, and power she is still learning to understand. From an uneasy ally to an Avenger, she confronts the question at the heart of her story: how do you live with the consequences of changing the world?", traits: ["Chaos magic", "Telekinesis", "Reality warping"], className: "scarlet", glow: "rgba(238, 46, 89, .37)" },
];

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
const YOUTUBE_VIDEO_ID = "F_mhWxOjxp4";
let youtubePlayer = null;
let youtubePlayerPromise = null;

function loadYoutubePlayer() {
  if (youtubePlayer) return Promise.resolve(youtubePlayer);
  if (youtubePlayerPromise) return youtubePlayerPromise;
  youtubePlayerPromise = new Promise((resolve, reject) => {
    const mountPlayer = () => {
      youtubePlayer = new window.YT.Player("youtube-audio-host", {
        width: "1",
        height: "1",
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          modestbranding: 1,
          playlist: YOUTUBE_VIDEO_ID,
          rel: 0,
        },
        events: {
          onReady: event => { event.target.setVolume(35); resolve(event.target); },
          onError: () => reject(new Error("The selected YouTube audio could not be loaded.")),
        },
      });
    };
    if (window.YT && window.YT.Player) {
      mountPlayer();
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") previousReady();
      mountPlayer();
    };
    const apiScript = document.createElement("script");
    apiScript.src = "https://www.youtube.com/iframe_api";
    apiScript.onerror = () => reject(new Error("YouTube could not be reached."));
    document.head.append(apiScript);
  });
  return youtubePlayerPromise;
}

async function startBackgroundMusic() {
  const player = await loadYoutubePlayer();
  player.playVideo();
}

function stopBackgroundMusic() {
  if (youtubePlayer) youtubePlayer.pauseVideo();
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
