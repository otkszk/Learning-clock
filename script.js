let timetable = [];
let currentPeriod = {};
let showMinuteFiveNumbers = true;
let showMinuteOneNumbers = false;
let digitalVisible = true;
let blinkState = true;

const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");
const digitalEl = document.getElementById("digitalClock");
const remainEl = document.getElementById("remainTime");
const listEl = document.getElementById("timetableList");

function resizeCanvasForDPR() {
  const cssSize = Math.min(window.innerWidth * 0.6, 420);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + "px";
  canvas.style.height = cssSize + "px";
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getCanvasMetrics() {
  const cssSize = canvas.clientWidth;
  return { center: cssSize / 2, radius: cssSize / 2 };
}

/* 時計描画 */
function drawClock() {
  const { center, radius } = getCanvasMetrics();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = Math.max(4, radius * 0.03);
  ctx.strokeStyle = "#000";
  ctx.stroke();

  // 残り時間ピンク
  if (currentPeriod.start && currentPeriod.end) {
    const now = new Date();
    const totalSecsNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [eh, em] = currentPeriod.end.split(":").map(Number);
    const endSecs = eh * 3600 + em * 60;

    const nowAngle = ((totalSecsNow % 3600) / 3600) * 2 * Math.PI - Math.PI / 2;
    let endAngle = ((endSecs % 3600) / 3600) * 2 * Math.PI - Math.PI / 2;
    if (endAngle <= nowAngle) endAngle += 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius * 0.9, nowAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,182,193,0.6)";
    ctx.fill();
  }

  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);
  if (showMinuteOneNumbers) drawMinuteOneNumbers(center, radius);
  drawHands(center, radius);
  updateDigitalClock();
  updateRemainDisplay();
}

/* 時間・分表示など */
function drawHourNumbers(c, r) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(r * 0.16)}px "Noto Sans JP"`;
  ctx.fillStyle = "#082737";
  for (let n = 1; n <= 12; n++) {
    const ang = (n * Math.PI) / 6;
    const x = c + Math.sin(ang) * r * 0.72;
    const y = c - Math.cos(ang) * r * 0.72;
    ctx.fillText(n, x, y);
  }
}
function drawMinuteFiveNumbers(c, r) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(r * 0.1)}px "Noto Sans JP"`;
  ctx.fillStyle = "#0b4766";
  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30;
    const x = c + Math.sin(ang) * r * 0.88;
    const y = c - Math.cos(ang) * r * 0.88;
    ctx.fillText(m, x, y);
  }
}
function drawMinuteOneNumbers(c, r) {
  const now = new Date();
  const cm = now.getMinutes() % 60;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(r * 0.06)}px "Noto Sans JP"`;
  for (let m = 1; m <= 60; m++) {
    const ang = (m * Math.PI) / 30;
    const x = c + Math.sin(ang) * r * 0.9;
    const y = c - Math.cos(ang) * r * 0.9;
    ctx.fillStyle = m === cm || (m === 60 && cm === 0) ? "red" : "#333";
    ctx.fillText(m, x, y);
  }
}
function drawHands(c, r) {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const hA = ((h % 12) + m / 60 + s / 3600) * (Math.PI / 6);
  const mA = (m + s / 60) * (Math.PI / 30);
  const sA = s * (Math.PI / 30);
  function hand(a, l, w, col) {
    const x = c + Math.sin(a) * r * l;
    const y = c - Math.cos(a) * r * l;
    ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(x, y);
    ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.stroke();
  }
  hand(hA, 0.5, 6, "#143241");
  hand(mA, 0.75, 4, "red");
  hand(sA, 0.88, 2, "#000");
}

/* ✅ デジタル時計（透明点滅） */
function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const ampm = h < 12 ? "午前" : "午後";
  const h12 = h % 12 === 0 ? 12 : h % 12;

  // コロン部分を span にして透明化点滅
  const colonClass = blinkState ? "colon" : "colon off";
  digitalEl.innerHTML = `${ampm}${h12}<span class="${colonClass}">:</span>${String(m).padStart(2, "0")}`;

  if (digitalVisible) {
    digitalEl.classList.remove("hidden");
    remainEl.classList.remove("hidden");
  } else {
    digitalEl.classList.add("hidden");
    remainEl.classList.add("hidden");
  }
}

function updateRemainDisplay() {
  if (!currentPeriod.end) return (remainEl.textContent = "ー");
  const now = new Date();
  const [eh, em] = currentPeriod.end.split(":").map(Number);
  const end = new Date(); end.setHours(eh, em, 0, 0);
  const diff = Math.max(0, Math.floor((end - now) / 60000));
  remainEl.textContent = `あと${diff}分`;
}

/* 時刻表など（省略せず） */
async function loadTimetable(path) {
  const res = await fetch(path);
  const raw = await res.json();
  timetable = raw.map(i => ({ name: i["名称"], start: i["開始時刻"], end: i["終了時刻"] }));
  updateCurrentPeriod();
}
function updateCurrentPeriod() {
  const now = new Date(), curM = now.getHours() * 60 + now.getMinutes();
  currentPeriod = {};
  let idx = -1;
  for (let i = 0; i < timetable.length; i++) {
    const [sh, sm] = timetable[i].start.split(":").map(Number);
    const [eh, em] = timetable[i].end.split(":").map(Number);
    const st = sh * 60 + sm, et = eh * 60 + em;
    if (curM >= st && curM < et) { idx = i; currentPeriod = timetable[i]; break; }
  }
  renderTimetable(idx);
}
function renderTimetable(activeIndex) {
  listEl.innerHTML = "";
  timetable.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "timetable-item";
    d.textContent = `${p.start}〜${p.end} ${p.name}`;
    if (i === activeIndex) d.classList.add("active");
    listEl.appendChild(d);
  });
  if (activeIndex >= 0) {
    requestAnimationFrame(() => {
      const active = listEl.querySelector(".active");
      if (active) {
        const offsetTop = active.offsetTop;
        const elHeight = listEl.clientHeight;
        const target = offsetTop - elHeight / 2 + active.clientHeight / 2;
        listEl.scrollTo({ top: target, behavior: "smooth" });
      }
    });
  }
}

/* 音声 */
function speak(t) { const u = new SpeechSynthesisUtterance(t); u.lang = "ja-JP"; speechSynthesis.cancel(); speechSynthesis.speak(u); }
function speakNow() {
  const n = new Date(), h = n.getHours(), m = n.getMinutes();
  const am = h < 12 ? "午前" : "午後", h12 = h % 12 === 0 ? 12 : h % 12;
  speak(`今の時刻は、${am}${h12}時${m}分です`);
}
function speakRemain() {
  if (currentPeriod.end) {
    const n = new Date(); const [eh, em] = currentPeriod.end.split(":").map(Number);
    const e = new Date(); e.setHours(eh, em, 0, 0);
    const d = Math.max(0, Math.floor((e - n) / 60000));
    speak(`${currentPeriod.name}は、あと${d}分で終わります`);
  } else speak("今の時間の予定はありません");
}

/* 初期化 */
function init() {
  resizeCanvasForDPR();
  loadTimetable("data/timetable1.json");
  drawClock();
  setInterval(() => { blinkState = !blinkState; updateCurrentPeriod(); drawClock(); }, 1000);

  document.getElementById("btn-toggle-digital").onclick = () => { digitalVisible = !digitalVisible; updateDigitalClock(); };
  document.getElementById("btn-now").onclick = speakNow;
  document.getElementById("btn-remain").onclick = speakRemain;
  document.getElementById("btn-toggle-minutes").onclick = () => { showMinuteFiveNumbers = !showMinuteFiveNumbers; drawClock(); };
  document.getElementById("btn-toggle-minutes1").onclick = () => { showMinuteOneNumbers = !showMinuteOneNumbers; drawClock(); };
  document.querySelectorAll(".tt-btn").forEach(b => b.onclick = () => loadTimetable(b.dataset.file));
  window.addEventListener("resize", () => { resizeCanvasForDPR(); drawClock(); });
}

document.addEventListener("DOMContentLoaded", init);
