let timetable = [];
let currentPeriod = {};
let showMinuteFiveNumbers = true;
let showMinuteOneNumbers = false;
let digitalVisible = true; // デジタル時計表示フラグ
let blinkState = true; // 「：」点滅制御用

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');
const remainEl = document.getElementById('remainTime');

/* Canvas設定 */
function resizeCanvasForDPR() {
  const cssSize = Math.min(window.innerWidth * 0.9, 420);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* 時計描画 */
function getCanvasMetrics() {
  const cssSize = canvas.clientWidth;
  const center = cssSize / 2;
  const radius = cssSize / 2;
  return { center, radius };
}

function drawClock() {
  const { center, radius } = getCanvasMetrics();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 枠
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(4, radius * 0.03);
  ctx.strokeStyle = '#000';
  ctx.stroke();

  // ピンクの残り時間（現在〜終了）
  if (currentPeriod.start && currentPeriod.end) {
    const now = new Date();
    const totalSecsNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const [eh, em] = currentPeriod.end.split(':').map(Number);
    const endSecs = eh * 3600 + em * 60;

    const nowAngle = ((totalSecsNow % 3600) / 3600) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((endSecs % 3600) / 3600) * 2 * Math.PI - Math.PI / 2;

    let correctedEnd = endAngle;
    if (correctedEnd < nowAngle) correctedEnd += 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius * 0.9, nowAngle, correctedEnd, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
    ctx.fill();
  }

  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);
  if (showMinuteOneNumbers) drawMinuteOneNumbers(center, radius);
  drawHands(center, radius);
  updateDigitalClock();
  updateRemainDisplay();
}

/* 文字盤 */
function drawHourNumbers(center, radius) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(radius * 0.16)}px "Noto Sans JP"`;
  ctx.fillStyle = '#082737';
  for (let num = 1; num <= 12; num++) {
    const ang = (num * Math.PI) / 6;
    const x = center + Math.sin(ang) * radius * 0.72;
    const y = center - Math.cos(ang) * radius * 0.72;
    ctx.fillText(num, x, y);
  }
}

function drawMinuteFiveNumbers(center, radius) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(radius * 0.1)}px "Noto Sans JP"`;
  ctx.fillStyle = '#0b4766';
  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    ctx.fillText(m, x, y);
  }
}

/* 1分表示（現在の分を赤く） */
function drawMinuteOneNumbers(center, radius) {
  const now = new Date();
  const currentMinute = now.getMinutes();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(radius * 0.06)}px "Noto Sans JP"`;

  for (let m = 1; m <= 60; m++) {
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.9;
    const y = center - Math.cos(ang) * radius * 0.9;
    ctx.fillStyle = (m === currentMinute || (m === 60 && currentMinute === 0)) ? 'red' : '#333';
    ctx.fillText(m, x, y);
  }
}

/* 時計の針 */
function drawHands(center, radius) {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hourAngle = ((h % 12) + m / 60) * (Math.PI / 6);
  const minAngle = (m + s / 60) * (Math.PI / 30);
  const secAngle = s * (Math.PI / 30);

  function hand(angle, len, w, c) {
    const x = center + Math.sin(angle) * radius * len;
    const y = center - Math.cos(angle) * radius * len;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(x, y);
    ctx.lineWidth = w;
    ctx.strokeStyle = c;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  hand(hourAngle, 0.5, 6, '#143241');
  hand(minAngle, 0.75, 4, 'red');
  hand(secAngle, 0.88, 2, '#000');
}

/* ✅ デジタル時計：点滅コロン仕様 */
function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const colon = blinkState ? ':' : ' ';
  digitalEl.textContent = `${ampm}${h12}${colon}${String(m).padStart(2, '0')}`;

  // 非表示でも位置維持
  if (digitalVisible) {
    digitalEl.classList.remove('hidden');
    remainEl.classList.remove('hidden');
  } else {
    digitalEl.classList.add('hidden');
    remainEl.classList.add('hidden');
  }
}

/* 残り時間 */
function updateRemainDisplay() {
  if (!currentPeriod.end) {
    remainEl.textContent = 'ー';
    return;
  }
  const now = new Date();
  const [eh, em] = currentPeriod.end.split(':').map(Number);
  const end = new Date();
  end.setHours(eh, em, 0, 0);
  const diff = Math.max(0, Math.floor((end - now) / 60000));
  remainEl.textContent = `あと${diff}分`;
}

/* 時刻表関係 */
async function loadTimetable(path) {
  const res = await fetch(path);
  const raw = await res.json();
  timetable = raw.map(i => ({
    name: i['名称'],
    start: i['開始時刻'],
    end: i['終了時刻']
  }));
  updateCurrentPeriod();
}

function updateCurrentPeriod() {
  const now = new Date();
  const curM = now.getHours() * 60 + now.getMinutes();
  currentPeriod = {};
  for (const p of timetable) {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const st = sh * 60 + sm;
    const et = eh * 60 + em;
    if (curM >= st && curM < et) {
      currentPeriod = p;
      break;
    }
  }
  renderTimetable();
}

function renderTimetable() {
  const el = document.getElementById('timetableList');
  el.innerHTML = '';
  const now = new Date();
  const curM = now.getHours() * 60 + now.getMinutes();
  let idx = -1;
  timetable.forEach((p, i) => {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const st = sh * 60 + sm;
    const et = eh * 60 + em;
    if (curM >= st && curM < et) idx = i;
  });
  timetable.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'timetable-item';
    d.textContent = `${p.start}〜${p.end} ${p.name}`;
    if (i === idx) d.classList.add('active');
    el.appendChild(d);
  });
  if (idx >= 0) {
    requestAnimationFrame(() => {
      const active = el.querySelector('.active');
      if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
}

/* 音声 */
function speak(t) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'ja-JP';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speakNow() {
  const n = new Date(), h = n.getHours(), m = n.getMinutes();
  const am = h < 12 ? '午前' : '午後'; const h12 = h % 12 || 12;
  speak(`今の時刻は、${am}${h12}時${m}分です`);
}
function speakRemain() {
  if (currentPeriod.end) {
    const n = new Date(); const [eh, em] = currentPeriod.end.split(':').map(Number);
    const e = new Date(); e.setHours(eh, em, 0, 0);
    const d = Math.max(0, Math.floor((e - n) / 60000));
    speak(`${currentPeriod.name}は、あと${d}分で終わります`);
  } else {
    speak(`今の時間の予定はありません`);
  }
}

/* 初期化 */
function init() {
  resizeCanvasForDPR();
  loadTimetable('data/timetable1.json');
  drawClock();
  setInterval(() => {
    blinkState = !blinkState; // ✅ 「：」点滅
    updateCurrentPeriod();
    drawClock();
  }, 1000);

  document.getElementById('btn-toggle-digital').onclick = () => {
    digitalVisible = !digitalVisible;
    updateDigitalClock();
  };
  document.getElementById('btn-now').onclick = speakNow;
  document.getElementById('btn-remain').onclick = speakRemain;
  document.getElementById('btn-toggle-minutes').onclick = () => {
    showMinuteFiveNumbers = !showMinuteFiveNumbers;
    drawClock();
  };
  document.getElementById('btn-toggle-minutes1').onclick = () => {
    showMinuteOneNumbers = !showMinuteOneNumbers;
    drawClock();
  };
  document.querySelectorAll('.tt-btn').forEach(b => {
    b.onclick = () => loadTimetable(b.dataset.file);
  });
}
document.addEventListener('DOMContentLoaded', init);
