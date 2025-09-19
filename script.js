let timetable = []; 
let currentPeriod = {};
let showMinuteFiveNumbers = true;

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');

/* ------------------------
   Canvas調整
   ------------------------ */
function resizeCanvasForDPR() {
  const cssSize = Math.min(window.innerWidth * 0.9, 420);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvasForDPR();
window.addEventListener('resize', () => {
  resizeCanvasForDPR();
  drawClock();
});

/* ------------------------
   Clock描画
   ------------------------ */
function getCanvasMetrics() {
  const cssSize = canvas.clientWidth;
  const center = cssSize / 2;
  const radius = cssSize / 2;
  return { cssSize, center, radius };
}

function drawClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { center, radius } = getCanvasMetrics();

  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(3, radius * 0.03);
  ctx.strokeStyle = '#2b3a4a';
  ctx.stroke();

  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);
  drawHands(center, radius);
  updateDigitalClock();
}

function drawHourNumbers(center, radius) {
  ctx.fillStyle = '#082737';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(12, Math.round(radius * 0.18));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  for (let num = 1; num <= 12; num++) {
    const ang = (num * Math.PI) / 6;
    const x = center + Math.sin(ang) * radius * 0.72;
    const y = center - Math.cos(ang) * radius * 0.72;
    ctx.fillText(String(num), x, y);
  }
}

function drawMinuteFiveNumbers(center, radius) {
  ctx.fillStyle = '#0b4766';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(10, Math.round(radius * 0.10));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    ctx.fillText(m === 60 ? '60' : String(m), x, y);
  }
}

function drawHands(center, radius) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * (Math.PI / 6);
  const minuteAngle = (minute + second / 60) * (Math.PI / 30);
  const secondAngle = second * (Math.PI / 30);

  function drawHand(angle, lenRatio, width, color) {
    const x = center + Math.sin(angle) * radius * lenRatio;
    const y = center - Math.cos(angle) * radius * lenRatio;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(x, y);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  drawHand(hourAngle, 0.50, Math.max(4, radius * 0.06), '#143241');
  drawHand(minuteAngle, 0.75, Math.max(3, radius * 0.045), '#0b76c1');
  drawHand(secondAngle, 0.88, Math.max(1.5, radius * 0.02), 'red');

  ctx.beginPath();
  ctx.arc(center, center, Math.max(4, radius * 0.03), 0, Math.PI * 2);
  ctx.fillStyle = '#143241';
  ctx.fill();
}

function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  digitalEl.textContent = `${ampm}${h12}:${String(m).padStart(2, '0')}`;
}

/* ------------------------
   Timetable
   ------------------------ */
async function loadTimetable(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('読み込み失敗');
    const raw = await res.json();
    timetable = raw.map(item => ({
      name: item['名称'],
      start: item['開始時刻'],
      end: item['終了時刻']
    }));
  } catch (e) {
    timetable = [];
    speak('時刻表の読み込みに失敗しました');
  }
}

function renderTimetable() {
  const listEl = document.getElementById('timetableList');
  listEl.innerHTML = '';
  timetable.forEach(p => {
    const div = document.createElement('div');
    div.className = 'timetable-item';
    div.textContent = `${p.start}〜${p.end} ${p.name}`;
    if (currentPeriod.name === p.name) {
      div.classList.add('active');
    }
    listEl.appendChild(div);
  });
}

function updateCurrentPeriod() {
  const now = new Date();
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  currentPeriod = {};
  for (const p of timetable) {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    if (curMinutes >= startM && curMinutes < endM) {
      currentPeriod = { name: p.name, start: p.start, end: p.end };
      break;
    }
  }
  document.getElementById('currentPeriod').textContent = currentPeriod.name || '-';
  document.getElementById('startTime').textContent = currentPeriod.start || '-';
  document.getElementById('endTime').textContent = currentPeriod.end || '-';
  renderTimetable();
}

/* ------------------------
   音声
   ------------------------ */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speakNow(){ 
  const n=new Date(); 
  const h=n.getHours(); 
  const m=n.getMinutes(); 
  const am=h<12?'午前':'午後'; 
  const h12=h%12||12; 
  speak(`今の時刻は、${am}${h12}時${m}分です`); 
}
function speakName(){ if (currentPeriod.name) speak(currentPeriod.name); else speak('現在、授業はありません'); }
function speakStart(){ if (currentPeriod.name) speak(`${currentPeriod.name}は、${currentPeriod.start}から始まりました`); }
function speakEnd(){ if (currentPeriod.name) speak(`${currentPeriod.name}は、${currentPeriod.end}に終わります`); }
function speakRemain(){ 
  if (currentPeriod.end) { 
    const now = new Date(); 
    const [eh,em] = currentPeriod.end.split(':').map(Number); 
    const end = new Date(); 
    end.setHours(eh, em, 0, 0); 
    const diff = Math.max(0, Math.floor((end - now)/60000)); 
    speak(`${currentPeriod.name}は、あと${diff}分で終わります`); 
  } 
}

/* ------------------------
   ボタン・初期化
   ------------------------ */
function toggleMinuteFive() {
  showMinuteFiveNumbers = !showMinuteFiveNumbers;
  document.getElementById('btn-toggle-minutes').textContent =
    showMinuteFiveNumbers ? '分表示（5分ごと）ON' : '分表示（5分ごと）OFF';
  drawClock();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-now').addEventListener('click', speakNow);
  document.getElementById('btn-name').addEventListener('click', speakName);
  document.getElementById('btn-start').addEventListener('click', speakStart);
  document.getElementById('btn-end').addEventListener('click', speakEnd);
  document.getElementById('btn-remain').addEventListener('click', speakRemain);
  document.getElementById('btn-toggle-minutes').addEventListener('click', toggleMinuteFive);

  document.querySelectorAll('.tt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.file;
      loadTimetable(path).then(() => updateCurrentPeriod());
    });
  });

  // 初期ロード
  loadTimetable('data/timetable1.json').then(() => updateCurrentPeriod());

  drawClock();
  setInterval(() => {
    drawClock();
    updateCurrentPeriod();
  }, 1000);
});
