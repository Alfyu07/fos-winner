/**
 * ==============================================================================
 * FOS BEST PERFORMER - INTERACTIVE AWARD ANNOUNCEMENT
 * Concept: Serius -> Suspense -> Countdown -> Hening -> BOOM -> Reveal -> Chaos
 * ==============================================================================
 */

// Global Configuration (Easily customized or edited live in-browser via 'S' key)
const DEFAULT_CONFIG = {
  winners: [
    "DITHA AYUDYA ERFIANTI - KCP CAKRA",
    "AZIZUDDIN MARNO - KC Gerung",
    "LALU WIBAWA PERMADI - KCP KERUAK"
  ],
  title: "FOS BEST PERFORMER",
  subtitle: "Siapakah yang paling gacor dalam pengisian FOS?",
  awardCategory: "TERBAIK DALAM PENGISIAN SISTEM FOS",
  memeCaptions: [
    "FOS INPUT GO BRRRRR 🚀",
    "ADMIN PALING GACOR 🔥",
    "SEHARI TEMBUS 100 APLIKASI 💯",
    "APPROVAL SECEPAT KILAT ⚡",
    "DATA VALID NO DEBAT 📋"
  ],
  autoChaosDelayMs: 2000,
  revealIntervalMs: 1400,
  audio: {
    suspense: "assets/sounds/suspense.mp3",
    countdownHit: "assets/sounds/countdown-hit.mp3",
    riser: "assets/sounds/riser.mp3",
    explosion: "assets/sounds/explosion.mp3",
    cheering: "assets/sounds/cheering.mp3",
    clapping: "assets/sounds/clapping.mp3",
    happyCat: "assets/sounds/happy-happy-happy.mp3"
  }
};

// Load user customizations from localStorage if available
let CONFIG = { ...DEFAULT_CONFIG };
try {
  const saved = localStorage.getItem("fos_award_config");
  if (saved) {
    const parsed = JSON.parse(saved);
    // Ensure clapping audio is registered
    if (parsed.audio) {
      parsed.audio.clapping = "assets/sounds/clapping.mp3";
    }
    // If the saved data was from the old template, overwrite with the real winners
    if (parsed.winners && (parsed.winners.includes("AHMAD FAUZI") || parsed.winners.includes("NAMA PEMENANG 1"))) {
      parsed.winners = [...DEFAULT_CONFIG.winners];
    }
    localStorage.setItem("fos_award_config", JSON.stringify(parsed));
    CONFIG = { ...CONFIG, ...parsed, audio: { ...DEFAULT_CONFIG.audio, ...(parsed.audio || {}) } };
  }
} catch (e) {
  console.warn("Could not load saved config:", e);
}

/* ==============================================================================
   STATE & DOM ELEMENTS
   ============================================================================== */
const state = {
  isRunning: false,
  isMuted: false,
  timelineTimeouts: [],
  fireworksActive: false,
  chaosActive: false,
  emojiInterval: null,
  memeCaptionInterval: null,
  audioCtx: null
};

// DOM References
const el = {
  stage: document.getElementById("stage"),
  flashOverlay: document.getElementById("flash-overlay"),
  radialShockwave: document.getElementById("radial-shockwave"),
  explosionOverlay: document.getElementById("explosion-overlay"),
  explosionGif: document.getElementById("explosion-gif"),

  sceneSuspense: document.getElementById("scene-suspense"),
  sceneCelebration: document.getElementById("scene-celebration"),

  openingCard: document.getElementById("opening-card"),
  openingTitle: document.getElementById("opening-title"),
  openingSubtitle: document.getElementById("opening-subtitle"),

  countdownCard: document.getElementById("countdown-card"),
  countdownNumber: document.getElementById("countdown-number"),
  countdownPulseRing: document.getElementById("countdown-pulse-ring"),

  teaserCard: document.getElementById("teaser-card"),

  instantRevealContainer: document.getElementById("instant-reveal-container"),
  instantBadge: document.getElementById("instant-badge"),
  instantWinnerName: document.getElementById("instant-winner-name"),
  instantWinnerBranch: document.getElementById("instant-winner-branch"),

  finalComposition: document.getElementById("final-composition"),
  finalMainTitle: document.getElementById("final-main-title"),
  finalSubHeading: document.getElementById("final-sub-heading"),
  winnersGrid: document.getElementById("winners-grid"),

  memeCaptionBox: document.getElementById("meme-caption-box"),
  memeCaptionText: document.getElementById("meme-caption-text"),
  chaosEmojiLayer: document.getElementById("chaos-emoji-layer"),

  startOverlay: document.getElementById("start-overlay"),
  btnStartShow: document.getElementById("btn-start-show"),

  btnFullscreen: document.getElementById("btn-fullscreen"),
  btnAudioToggle: document.getElementById("btn-audio-toggle"),
  btnSettings: document.getElementById("btn-settings"),
  btnRestart: document.getElementById("btn-restart"),

  settingsModal: document.getElementById("settings-modal"),
  btnCloseSettings: document.getElementById("btn-close-settings"),
  inputWinners: document.getElementById("input-winners"),
  inputTitle: document.getElementById("input-title"),
  inputSubtitle: document.getElementById("input-subtitle"),
  inputCategory: document.getElementById("input-category"),
  inputMemes: document.getElementById("input-memes"),
  btnSaveClose: document.getElementById("btn-save-close"),
  btnSaveRestart: document.getElementById("btn-save-restart"),
  btnResetDefaults: document.getElementById("btn-reset-defaults")
};

/* ==============================================================================
   AUDIO SYSTEM (HYBRID: MP3 FILES + NATIVE WEB AUDIO API SYNTHESIZER)
   ============================================================================== */
class SoundEngine {
  constructor() {
    this.activeAudios = [];
    this.initAudioContext();
  }

  stopAll() {
    this.activeAudios.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    });
    this.activeAudios = [];
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval);
      this.synthLoopInterval = null;
    }
  }

  setMuted(muted) {
    this.activeAudios.forEach((audio) => {
      audio.muted = muted;
    });
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && !state.audioCtx) {
        state.audioCtx = new AudioContextClass();
      }
      if (state.audioCtx && state.audioCtx.state === "suspended") {
        state.audioCtx.resume();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  play(soundKey, loop = false) {
    if (state.isMuted) return;
    this.initAudioContext();

    const src = CONFIG.audio[soundKey];
    if (src) {
      // Try playing file from assets/sounds/
      const audio = new Audio(src);
      audio.volume = 0.9;
      audio.loop = loop;
      this.activeAudios.push(audio);
      audio.onended = () => {
        if (!audio.loop) {
          const idx = this.activeAudios.indexOf(audio);
          if (idx !== -1) this.activeAudios.splice(idx, 1);
        }
      };

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // File missing or blocked -> fallback to synthesized sound
          this.playSynthesized(soundKey, loop);
        });
        return;
      }
    }

    // Direct synth fallback
    this.playSynthesized(soundKey, loop);
  }

  playSynthesized(soundKey, loop = false) {
    if (state.isMuted || !state.audioCtx) return;
    const ctx = state.audioCtx;
    const now = ctx.currentTime;

    if (loop && soundKey === "happyCat") {
      if (this.synthLoopInterval) clearInterval(this.synthLoopInterval);
      this.synthLoopInterval = setInterval(() => {
        if (!state.isRunning || state.isMuted) return;
        this.playSynthesized("happyCat", false);
      }, 1500);
    }

    switch (soundKey) {
      case "suspense": {
        // Deep ambient sub-drone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 3);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 1);
        gain.gain.linearRampToValueAtTime(0.01, now + 3.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3.3);
        break;
      }

      case "countdownHit": {
        // Punchy sub-drop impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.5);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }

      case "riser": {
        // Tension tension riser sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 1.4);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
        break;
      }

      case "explosion": {
        // 808 Sub-boom + noise blast
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 1.4);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now);

        // Sub bass kick
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

        oscGain.gain.setValueAtTime(1.0, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.35);
        break;
      }

      case "cheering": {
        // Synthesize celebratory cheer texture
        const duration = 3.5;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, now);
        filter.Q.setValueAtTime(1.5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.4);
        gain.gain.linearRampToValueAtTime(0.3, now + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        break;
      }

      case "clapping": {
        // Synthesize cheering crowd hand-claps
        const duration = 3.2;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(1400, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.25, now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        break;
      }

      case "happyCat": {
        // Melodic synth playing the bouncy "Happy Happy Happy" motif!
        // Motif notes: (F#5, A5, B5, C#6) bouncy staccato chime
        const notes = [
          { f: 587.33, t: 0.0, d: 0.12 }, // D5
          { f: 659.25, t: 0.16, d: 0.12 }, // E5
          { f: 739.99, t: 0.32, d: 0.18 }, // F#5
          { f: 880.00, t: 0.54, d: 0.22 }, // A5 (Happy!)
          { f: 880.00, t: 0.82, d: 0.22 }, // A5 (Happy!)
          { f: 987.77, t: 1.10, d: 0.35 }  // B5 (Happy!)
        ];

        notes.forEach(({ f, t, d }) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.type = "triangle";
          noteOsc.frequency.setValueAtTime(f, now + t);

          noteGain.gain.setValueAtTime(0, now + t);
          noteGain.gain.linearRampToValueAtTime(0.3, now + t + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.start(now + t);
          noteOsc.stop(now + t + d + 0.05);
        });
        break;
      }
    }
  }
}

const sounds = new SoundEngine();

/* ==============================================================================
   CANVAS 1: AMBIENT CINEMATIC BACKGROUND
   ============================================================================== */
const ambientCanvas = document.getElementById("ambient-canvas");
const ambientCtx = ambientCanvas.getContext("2d");

let stars = [];
function resizeAmbientCanvas() {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
  stars = [];
  const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * ambientCanvas.width,
      y: Math.random() * ambientCanvas.height,
      radius: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.7 + 0.2,
      speed: Math.random() * 0.3 + 0.1,
      angle: Math.random() * Math.PI * 2
    });
  }
}
window.addEventListener("resize", resizeAmbientCanvas);
resizeAmbientCanvas();

function drawAmbient() {
  ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

  // Deep luxury gradient background
  const bgGrad = ambientCtx.createRadialGradient(
    ambientCanvas.width / 2,
    ambientCanvas.height * 0.4,
    50,
    ambientCanvas.width / 2,
    ambientCanvas.height / 2,
    ambientCanvas.width * 0.8
  );
  bgGrad.addColorStop(0, "#0e142d");
  bgGrad.addColorStop(0.5, "#060916");
  bgGrad.addColorStop(1, "#030408");
  ambientCtx.fillStyle = bgGrad;
  ambientCtx.fillRect(0, 0, ambientCanvas.width, ambientCanvas.height);

  // Moving subtle spotlight
  const time = Date.now() * 0.0006;
  const spotX = ambientCanvas.width / 2 + Math.sin(time) * (ambientCanvas.width * 0.2);
  const spotGrad = ambientCtx.createRadialGradient(
    spotX,
    ambientCanvas.height * 0.25,
    10,
    spotX,
    ambientCanvas.height * 0.3,
    ambientCanvas.width * 0.45
  );
  spotGrad.addColorStop(0, "rgba(255, 215, 0, 0.06)");
  spotGrad.addColorStop(0.6, "rgba(0, 191, 255, 0.03)");
  spotGrad.addColorStop(1, "transparent");
  ambientCtx.fillStyle = spotGrad;
  ambientCtx.fillRect(0, 0, ambientCanvas.width, ambientCanvas.height);

  // Floating ambient dust particles
  stars.forEach((star) => {
    star.y -= star.speed;
    star.x += Math.sin(star.angle += 0.01) * 0.3;
    if (star.y < 0) {
      star.y = ambientCanvas.height;
      star.x = Math.random() * ambientCanvas.width;
    }
    ambientCtx.beginPath();
    ambientCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ambientCtx.fillStyle = `rgba(255, 235, 170, ${star.alpha})`;
    ambientCtx.shadowBlur = 4;
    ambientCtx.shadowColor = "#FFD700";
    ambientCtx.fill();
    ambientCtx.shadowBlur = 0;
  });

  requestAnimationFrame(drawAmbient);
}
requestAnimationFrame(drawAmbient);

/* ==============================================================================
   CANVAS 2: 60 FPS CELEBRATION FIREWORKS
   ============================================================================== */
const fireworksCanvas = document.getElementById("fireworks-canvas");
const fireworksCtx = fireworksCanvas.getContext("2d");

function resizeFireworksCanvas() {
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeFireworksCanvas);
resizeFireworksCanvas();

let fireworksRockets = [];
let fireworksSparks = [];
const FIREWORK_COLORS = [
  "#FFD700", "#FF4500", "#FF1493", "#00BFFF", "#7B2CBF", "#00FF88", "#FFF", "#FFAA00"
];

class Rocket {
  constructor(targetX, targetY) {
    this.x = Math.random() * fireworksCanvas.width;
    this.y = fireworksCanvas.height + 10;
    this.targetX = targetX || Math.random() * (fireworksCanvas.width * 0.8) + (fireworksCanvas.width * 0.1);
    this.targetY = targetY || Math.random() * (fireworksCanvas.height * 0.45) + 60;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.speed = Math.random() * 5 + 13;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
    this.color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();
    this.x += this.vx;
    this.y += this.vy;
    return this.vy < 0 && this.y <= this.targetY;
  }

  draw(ctx) {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    this.trail.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
}

class Spark {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7 + 1.5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.gravity = 0.08;
    this.friction = 0.96;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.012;
    this.size = Math.random() * 3 + 1.5;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    return this.alpha <= 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spawnFireworkBurst(x, y) {
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  const sparkCount = state.chaosActive ? 110 : 75;
  for (let i = 0; i < sparkCount; i++) {
    fireworksSparks.push(new Spark(x, y, color));
  }
}

function updateFireworksLoop() {
  fireworksCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  if (state.fireworksActive) {
    const spawnChance = state.chaosActive ? 0.12 : 0.045;
    if (Math.random() < spawnChance) {
      fireworksRockets.push(new Rocket());
    }
  }

  // Update rockets
  for (let i = fireworksRockets.length - 1; i >= 0; i--) {
    const r = fireworksRockets[i];
    const reached = r.update();
    r.draw(fireworksCtx);
    if (reached) {
      spawnFireworkBurst(r.x, r.y);
      fireworksRockets.splice(i, 1);
    }
  }

  // Update sparks
  for (let i = fireworksSparks.length - 1; i >= 0; i--) {
    const s = fireworksSparks[i];
    const dead = s.update();
    s.draw(fireworksCtx);
    if (dead) {
      fireworksSparks.splice(i, 1);
    }
  }

  requestAnimationFrame(updateFireworksLoop);
}
requestAnimationFrame(updateFireworksLoop);

/* ==============================================================================
   CONFETTI CANNON (WITH CDN CANVAS-CONFETTI & SAFE FALLBACK)
   ============================================================================== */
function launchConfetti(isBoom = false) {
  if (typeof confetti === "function") {
    if (isBoom) {
      // Big center burst
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF4500", "#00BFFF", "#FFF", "#FF1493"]
      });
      // Left cannon
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.85 }
      });
      // Right cannon
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.85 }
      });
    } else {
      // Continuous party popper
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: Math.random(), y: 0.1 }
      });
    }
  }
}

/* ==============================================================================
   REUSABLE FX: SCREEN SHAKE, SHOCKWAVE & FLASH
   ============================================================================== */
function screenShake(type = "intense") {
  el.stage.classList.remove("screen-shake-intense", "screen-shake-subtle");
  // Force reflow
  void el.stage.offsetWidth;
  el.stage.classList.add(type === "intense" ? "screen-shake-intense" : "screen-shake-subtle");
  setTimeout(() => {
    el.stage.classList.remove("screen-shake-intense", "screen-shake-subtle");
  }, 480);
}

function triggerWhiteFlash(durationMs = 120) {
  el.flashOverlay.classList.add("active");
  setTimeout(() => {
    el.flashOverlay.classList.remove("active");
  }, durationMs);
}

function triggerShockwave() {
  el.radialShockwave.classList.remove("animate");
  void el.radialShockwave.offsetWidth;
  el.radialShockwave.classList.add("animate");
}

function triggerExplosionGif(durationMs = 900) {
  el.explosionOverlay.classList.add("active");
  // Force GIF reload to replay animation from start
  const currentSrc = el.explosionGif.src;
  el.explosionGif.src = "";
  el.explosionGif.src = currentSrc;

  setTimeout(() => {
    el.explosionOverlay.classList.remove("active");
  }, durationMs);
}

/* ==============================================================================
   ANIMATION TIMELINE & SHOW CONTROLLER
   ============================================================================== */
function scheduleTimeout(fn, delayMs) {
  const id = setTimeout(fn, delayMs);
  state.timelineTimeouts.push(id);
  return id;
}

function clearAllTimeouts() {
  state.timelineTimeouts.forEach((id) => clearTimeout(id));
  state.timelineTimeouts = [];
  if (state.emojiInterval) clearInterval(state.emojiInterval);
  if (state.memeCaptionInterval) clearInterval(state.memeCaptionInterval);
}

function parseWinnerInfo(raw) {
  if (!raw) return { name: "", branch: "" };
  if (raw.includes(" - ")) {
    const parts = raw.split(" - ");
    return { name: parts[0].trim(), branch: parts.slice(1).join(" - ").trim() };
  } else if (raw.includes(" – ")) {
    const parts = raw.split(" – ");
    return { name: parts[0].trim(), branch: parts.slice(1).join(" – ").trim() };
  } else if (raw.includes("-")) {
    const parts = raw.split("-");
    return { name: parts[0].trim(), branch: parts.slice(1).join("-").trim() };
  }
  return { name: raw.trim(), branch: "" };
}

function populateFinalWinnersGrid() {
  el.winnersGrid.innerHTML = "";
  const winnerList = (CONFIG.winners && CONFIG.winners.length > 0)
    ? CONFIG.winners
    : DEFAULT_CONFIG.winners;

  const isSingle = winnerList.length === 1;

  winnerList.forEach((rawWinner, idx) => {
    const { name, branch } = parseWinnerInfo(rawWinner);
    const card = document.createElement("div");
    card.className = `winner-gold-card ${isSingle ? "single-winner" : ""}`;
    card.style.setProperty("--card-idx", idx);
    card.innerHTML = `
      <div class="card-crown-mini">👑</div>
      <div class="card-winner-name">${name}</div>
      ${branch ? `<div class="card-winner-branch">🏢 ${branch}</div>` : ""}
      <div class="card-winner-title">🏆 ${CONFIG.awardCategory || "FOS BEST PERFORMER"}</div>
    `;
    el.winnersGrid.appendChild(card);
  });
}

function startShow() {
  sounds.stopAll();
  clearAllTimeouts();
  state.isRunning = true;
  state.fireworksActive = false;
  state.chaosActive = false;

  // Hide modals & overlays
  el.startOverlay.classList.remove("active");
  el.startOverlay.classList.add("hidden");
  el.settingsModal.classList.add("hidden");

  // Reset Scenes
  el.sceneSuspense.classList.remove("hidden");
  el.sceneSuspense.classList.add("active");
  el.sceneCelebration.classList.add("hidden");
  el.sceneCelebration.classList.remove("active");

  el.openingCard.classList.remove("hidden");
  el.countdownCard.classList.add("hidden");
  el.teaserCard.classList.add("hidden");
  el.instantRevealContainer.classList.add("hidden");
  el.instantRevealContainer.classList.remove("fade-out", "winner-smash-in");
  el.finalComposition.classList.add("hidden");
  el.memeCaptionBox.classList.remove("visible");
  el.chaosEmojiLayer.innerHTML = "";

  // Update dynamic texts
  el.openingTitle.textContent = CONFIG.title;
  el.openingSubtitle.textContent = CONFIG.subtitle;
  el.finalMainTitle.textContent = CONFIG.title;
  el.finalSubHeading.textContent = CONFIG.awardCategory;

  // 1. OPENING: 0s - 3s
  sounds.play("suspense");

  scheduleTimeout(() => {
    // Fade out opening title
    el.openingCard.classList.add("hidden");
  }, 2800);

  // 2. COUNTDOWN: 3 -> 2 -> 1
  scheduleTimeout(() => {
    startCountdown();
  }, 3300);
}

function startCountdown() {
  el.countdownCard.classList.remove("hidden");

  // Step 3
  triggerCountdownDigit(3);
  sounds.play("countdownHit");
  screenShake("subtle");

  // Step 2
  scheduleTimeout(() => {
    triggerCountdownDigit(2);
    sounds.play("countdownHit");
    screenShake("subtle");
  }, 1000);

  // Step 1 (Maximum Suspense)
  scheduleTimeout(() => {
    triggerCountdownDigit(1);
    sounds.play("countdownHit");
    sounds.play("riser");
    screenShake("intense");
  }, 2000);

  // Blackout pause + Teaser
  scheduleTimeout(() => {
    el.countdownCard.classList.add("hidden");
    // Layar menjadi gelap 600ms
  }, 2900);

  scheduleTimeout(() => {
    // Show "AND THE WINNER IS..."
    el.teaserCard.classList.remove("hidden");
  }, 3500);

  scheduleTimeout(() => {
    // Screen darkens again before BOOM!
    el.teaserCard.classList.add("hidden");
  }, 5000);

  scheduleTimeout(() => {
    // REVEAL STAGE
    executeWinnerReveal();
  }, 5600);
}

function triggerCountdownDigit(number) {
  el.countdownNumber.textContent = number;
  el.countdownNumber.classList.remove("countdown-impact");
  el.countdownPulseRing.classList.remove("ring-pulse-active");

  void el.countdownNumber.offsetWidth;
  void el.countdownPulseRing.offsetWidth;

  el.countdownNumber.classList.add("countdown-impact");
  el.countdownPulseRing.classList.add("ring-pulse-active");
}

/* ==============================================================================
   WINNER REVEAL SEQUENCE (BOOM -> IMPACT -> SEQUENTIAL REVEAL)
   ============================================================================== */
function executeWinnerReveal() {
  // Switch scene to Celebration
  el.sceneSuspense.classList.add("hidden");
  el.sceneCelebration.classList.remove("hidden");
  el.finalComposition.classList.add("hidden");

  const winnerList = (CONFIG.winners && CONFIG.winners.length > 0)
    ? CONFIG.winners
    : ["JUARA FOS"];

  // 1. Initial Grand BOOM!
  triggerBigBoom();

  // 2. Reveal winners sequentially
  let currentDelay = 150;
  winnerList.forEach((winnerName, index) => {
    scheduleTimeout(() => {
      showInstantWinnerPop(winnerName, index + 1);
    }, currentDelay);

    currentDelay += CONFIG.revealIntervalMs || 1400;
  });

  // 3. Transition to Final Composite Screen after sequential pops
  scheduleTimeout(() => {
    settleToFinalCelebration();
  }, currentDelay + 250);
}

function triggerBigBoom() {
  triggerWhiteFlash(120);
  triggerShockwave();
  triggerExplosionGif(950);
  screenShake("intense");
  sounds.play("explosion");
  sounds.play("cheering");
  sounds.play("clapping");
  launchConfetti(true);

  // Start background fireworks immediately
  state.fireworksActive = true;
}

function showInstantWinnerPop(rawName, rank) {
  // Retrigger explosive impact on each winner name
  triggerShockwave();
  screenShake("intense");
  sounds.play("explosion");
  launchConfetti(false);

  const { name, branch } = parseWinnerInfo(rawName);

  if (el.instantBadge) {
    el.instantBadge.textContent = CONFIG.winners && CONFIG.winners.length > 1
      ? `👑 PEMENANG ${rank} 👑`
      : "👑 PEMENANG TERPILIH 👑";
  }

  el.instantWinnerName.textContent = name;
  if (el.instantWinnerBranch) {
    el.instantWinnerBranch.textContent = branch ? `🏢 ${branch}` : "";
    el.instantWinnerBranch.style.display = branch ? "block" : "none";
  }

  el.instantRevealContainer.classList.remove("hidden", "fade-out");
  el.instantRevealContainer.classList.remove("winner-smash-in");
  void el.instantRevealContainer.offsetWidth;
  el.instantRevealContainer.classList.add("winner-smash-in");
}

/* ==============================================================================
   FINAL SETTLED CELEBRATION & MEME CHAOS
   ============================================================================== */
function settleToFinalCelebration() {
  // 1. Smoothly fade out and hide the instant pop container so it doesn't block the cards!
  el.instantRevealContainer.classList.add("fade-out");
  scheduleTimeout(() => {
    el.instantRevealContainer.classList.add("hidden");
    el.instantRevealContainer.classList.remove("fade-out", "winner-smash-in");
  }, 280);

  // 2. Populate & show final grid with all winners side-by-side
  populateFinalWinnersGrid();
  el.finalComposition.classList.remove("hidden");

  // Trigger sound Happy Cat song on infinite loop!
  sounds.play("happyCat", true);

  // Continuous celebratory confetti
  const confettiInterval = setInterval(() => {
    if (!state.isRunning) {
      clearInterval(confettiInterval);
      return;
    }
    launchConfetti(false);
  }, 1800);
  state.timelineTimeouts.push(confettiInterval);

  // Start Meme captions loop
  startMemeCaptionLoop();

  // Schedule CHAOS MODE (2s after final reveal)
  scheduleTimeout(() => {
    activateChaosMode();
  }, CONFIG.autoChaosDelayMs || 2000);
}

function startMemeCaptionLoop() {
  const captions = (CONFIG.memeCaptions && CONFIG.memeCaptions.length > 0)
    ? CONFIG.memeCaptions
    : ["FOS INPUT GO BRRRRR 🚀", "ADMIN PALING GACOR 🔥"];

  let idx = 0;
  function showNextCaption() {
    if (!state.isRunning) return;
    el.memeCaptionText.textContent = captions[idx % captions.length];
    el.memeCaptionBox.classList.add("visible");

    // Randomize positioning slightly
    const topPercent = Math.floor(Math.random() * 25) + 12;
    const rightPercent = Math.floor(Math.random() * 20) + 4;
    el.memeCaptionBox.style.top = `${topPercent}%`;
    el.memeCaptionBox.style.right = `${rightPercent}%`;

    idx++;
    setTimeout(() => {
      el.memeCaptionBox.classList.remove("visible");
    }, 2800);
  }

  showNextCaption();
  state.memeCaptionInterval = setInterval(showNextCaption, 4200);
}

function activateChaosMode() {
  state.chaosActive = true;
  screenShake("subtle");

  // Flying emojis stream
  const EMOJIS = ["🎉", "🔥", "🏆", "👑", "💥", "✨", "🚀", "🎆", "🥳", "💯", "🐱"];

  state.emojiInterval = setInterval(() => {
    if (!state.isRunning || !state.chaosActive) return;

    const emojiEl = document.createElement("div");
    emojiEl.className = "flying-emoji";
    emojiEl.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    const startX = Math.random() * 92 + 4; // 4vw to 96vw
    const driftX = (Math.random() * 140 - 70) + "px";
    const rot = (Math.random() * 720 - 360) + "deg";
    const dur = (Math.random() * 2 + 2.5) + "s";

    emojiEl.style.left = `${startX}vw`;
    emojiEl.style.setProperty("--drift-x", driftX);
    emojiEl.style.setProperty("--rot", rot);
    emojiEl.style.setProperty("--dur", dur);

    el.chaosEmojiLayer.appendChild(emojiEl);

    setTimeout(() => {
      if (emojiEl.parentNode) emojiEl.remove();
    }, 4500);
  }, 350);
}

function restartShow() {
  clearAllTimeouts();
  startShow();
}

/* ==============================================================================
   FULLSCREEN & UTILITIES
   ============================================================================== */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.warn("Fullscreen request error:", err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function toggleAudio() {
  state.isMuted = !state.isMuted;
  sounds.setMuted(state.isMuted);
  el.btnAudioToggle.textContent = state.isMuted ? "🔇" : "🔊";
  el.btnAudioToggle.title = state.isMuted ? "Unmute Audio (M)" : "Mute Audio (M)";
}

/* ==============================================================================
   SETTINGS / QUICK EDIT MODAL
   ============================================================================== */
function openSettingsModal() {
  el.inputWinners.value = (CONFIG.winners || []).join("\n");
  el.inputTitle.value = CONFIG.title || "";
  el.inputSubtitle.value = CONFIG.subtitle || "";
  el.inputCategory.value = CONFIG.awardCategory || "";
  el.inputMemes.value = (CONFIG.memeCaptions || []).join("\n");

  el.settingsModal.classList.remove("hidden");
  el.settingsModal.classList.add("active");
}

function closeSettingsModal() {
  el.settingsModal.classList.remove("active");
  el.settingsModal.classList.add("hidden");
}

function saveSettings(restartAfterSave = false) {
  const winnerLines = el.inputWinners.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const memeLines = el.inputMemes.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  CONFIG.winners = winnerLines.length > 0 ? winnerLines : ["NAMA PEMENANG"];
  CONFIG.title = el.inputTitle.value.trim() || DEFAULT_CONFIG.title;
  CONFIG.subtitle = el.inputSubtitle.value.trim() || DEFAULT_CONFIG.subtitle;
  CONFIG.awardCategory = el.inputCategory.value.trim() || DEFAULT_CONFIG.awardCategory;
  if (memeLines.length > 0) CONFIG.memeCaptions = memeLines;

  // Persist to localStorage
  try {
    localStorage.setItem("fos_award_config", JSON.stringify(CONFIG));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }

  closeSettingsModal();

  if (restartAfterSave) {
    restartShow();
  }
}

function resetSettingsToDefault() {
  CONFIG = { ...DEFAULT_CONFIG };
  try {
    localStorage.removeItem("fos_award_config");
  } catch (e) {}
  openSettingsModal();
}

/* ==============================================================================
   EVENT LISTENERS & KEYBOARD SHORTCUTS
   ============================================================================== */

// Start Button (User interaction activates audio context & optionally fullscreen)
el.btnStartShow.addEventListener("click", () => {
  sounds.initAudioContext();
  toggleFullscreen();
  startShow();
});

// Host Bar Buttons
el.btnFullscreen.addEventListener("click", toggleFullscreen);
el.btnAudioToggle.addEventListener("click", toggleAudio);
el.btnSettings.addEventListener("click", openSettingsModal);
el.btnRestart.addEventListener("click", restartShow);

// Settings Modal Controls
el.btnCloseSettings.addEventListener("click", closeSettingsModal);
el.btnSaveClose.addEventListener("click", () => saveSettings(false));
el.btnSaveRestart.addEventListener("click", () => saveSettings(true));
el.btnResetDefaults.addEventListener("click", resetSettingsToDefault);

// Keyboard Shortcuts:
// SPACE = Start / Restart
// R = Restart
// F = Fullscreen
// M = Mute / Unmute
// S = Settings modal
// ESC = Exit modal / fullscreen
window.addEventListener("keydown", (e) => {
  // If user is typing inside textarea or input, do not trigger global shortcuts
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    if (e.key === "Escape") {
      closeSettingsModal();
    }
    return;
  }

  switch (e.code) {
    case "Space":
      e.preventDefault();
      sounds.initAudioContext();
      if (!state.isRunning) {
        toggleFullscreen();
      }
      startShow();
      break;

    case "KeyR":
      e.preventDefault();
      sounds.initAudioContext();
      restartShow();
      break;

    case "KeyF":
      e.preventDefault();
      toggleFullscreen();
      break;

    case "KeyM":
      e.preventDefault();
      toggleAudio();
      break;

    case "KeyS":
      e.preventDefault();
      openSettingsModal();
      break;

    case "Escape":
      if (!el.settingsModal.classList.contains("hidden")) {
        closeSettingsModal();
      }
      break;
  }
});

// Initialize display texts
el.openingTitle.textContent = CONFIG.title;
el.openingSubtitle.textContent = CONFIG.subtitle;
el.finalMainTitle.textContent = CONFIG.title;
el.finalSubHeading.textContent = CONFIG.awardCategory;
