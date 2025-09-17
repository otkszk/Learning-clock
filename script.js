// スマホ/タブレット向けに安定して描画する実装
let timetable = []; // 正規化した {name,start,end}
let currentPeriod = {};
let showMinuteFiveNumbers = true; // 初期は表示（5分ごと）

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');

function resizeCanvasForDPR() {
  // CSSサイズ（px）に合わせて内部サイズを DPR 倍にする
  const cssSize = Math.min(window.innerWidth * 0.9, 420);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  // ctx を CSS ピクセル単位で使えるように変換
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvasForDPR();
window.addEventListener('resize', () => {
  resizeCanvasForDPR();
  drawClock();
});

// 中心や半径を CSS ピクセル単位で取得
function getCanvasMetrics() {
  const cssSize = canvas.clientWidth; // style.width の px 値
  const center = cssSize / 2;
  const radius = cssSize / 2;
  return { cssSize, center, radius };
}

// 描画メイン
function drawClock() {
  // clear: device-pixel 単位で全体を消す（安全）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { cssSize, center, radius } = getCanvasMetrics();

  // 盤面（円）
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(3, radius * 0.03);
  ctx.strokeStyle = '#2b3a4a';
  ctx.stroke();

  // 1〜12 の数字（常に表示）
  drawHourNumbers(center, radius);

  // 5分ごとの分数字（ON の時）
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);

  // 針
  drawHands(center, radius);

  // デジタル更新
  updateDigitalClock();
}

// 1〜12 の数字を描画（座標は三角関数）
function drawHourNumbers(center, radius) {
  ctx.fillStyle = '#082737';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(12, Math.round(radius * 0.18));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;

  for (let num = 1; num <= 12; num++) {
    const ang = (num * Math.PI) / 6; // 30度ごと
    const x = center + Math.sin(ang) * radius * 0.72;
    const y = center - Math.cos(ang) * radius * 0.72;
    ctx.fillText(String(num), x, y);
  }
}

// 5分ごとの分（5,10,...60）を描画（外寄り）
function drawMinuteFiveNumbers(center, radius) {
  ctx.fillStyle = '#0b4766';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(10, Math.round(radius * 0.10));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;

  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30; // 分→角度
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    // 60分は "60" として表示
    const text = (m === 60) ? '60' : String(m);
    ctx.fillText(text, x, y);
  }
}

// 針の描画（端点を計算して線で引く）
function drawHands(center, radius) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // 時針角（ラジアン）
  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * (Math.PI / 6);
  const minuteAngle = (minute + second / 60) * (Math.PI / 30);
  const secondAngle = second * (Math.PI / 30);

  // draw hand helper
  function drawHand(angle, lenRatio, width, color = '#000') {
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

  // 時針（太め）
  drawHand(hourAngle, 0.50, Math.max(4, radius * 0.06), '#143241');
  // 分針
  drawHand(minuteAngle, 0.75, Math.max(3, radius * 0.045), '#0b76c1');
  // 秒針（細め）
  drawHand(secondAngle, 0.88, Math.max(1.5, radius * 0.02), 'red');

  // 中心点
  ctx.beginPath();
  ctx.arc(center, center, Math.max(4, radius * 0.03), 0, Math.PI * 2);
  ctx.fillStyle = '#143241';
  ctx.fill();
}

// デジタル表示更新
function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  digitalEl.textContent = `${ampm}${h12}:${String(m).padStart(2, '0')}`;
}

/* ------------------------
   時刻表読み込み・現在時間判定
   ------------------------ */
async function loadTimetable(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('読み込み失敗');
    const raw = await res.json();
    // 正規化：支持されるフィールドに対応（日本語/英語どちらでも）
    timetable = raw.map(item => {
      const name = item['名称'] || item['name'] || item['label'] || '名称不明';
      const start = item['開始時刻'] || item['start'];
      const end = item['終了時刻'] || item['end'];
      return { name, start, end };
    }).filter(e => e.start && e.end);
    speak(`${path} を読み込みました`);
  } catch (e) {
    console.warn(e);
    timetable = [];
    speak('時刻表の読み込みに失敗しました');
  }
}

// 現在の時間割（timetable は正規化済み）
function updateCurrentPeriod() {
  const now = new Date();
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  currentPeriod = {};
  for (const p of timetable) {
    const [sh, sm] = (p.start || '00:00').split(':').map(Number);
    const [eh, em] = (p.end   || '00:00').split(':').map(Number);
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
}

/* ------------------------
   音声（機械読み）
   ------------------------ */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speakNow(){ const n=new Date(); const h=n.getHours(); const m=n.getMinutes(); const am=h<12?'午前':'午後'; const h12=h%12||12; speak(`今の時刻は、${am}${h12}時${m}分です`); }
function speakName(){ if (currentPeriod.name) speak(currentPeriod.name); else speak('現在、授業はありません'); }
function speakStart(){ if (currentPeriod.name) speak(`${currentPeriod.name}は、${currentPeriod.start}から始まりました`); else speak('開始時刻の情報はありません'); }
function speakEnd(){ if (currentPeriod.name) speak(`${currentPeriod.name}は、${currentPeriod.end}に終わります`); else speak('終了時刻の情報はありません'); }
function speakRemain(){ if (currentPeriod.end) { const now = new Date(); const [eh,em] = currentPeriod.end.split(':').map(Number); const end = new Date(); end.setHours(eh, em, 0, 0); const diff = Math.max(0, Math.floor((end - now)/60000)); speak(`${currentPeriod.name}は、あと${diff}分で終わります`); } else speak('残り時間を計算できません'); }

/* ------------------------
   ボタン・初期化
   ------------------------ */
function toggleMinuteFive() {
  showMinuteFiveNumbers = !showMinuteFiveNumbers;
  document.getElementById('btn-toggle-minutes').textContent =
    showMinuteFiveNumbers ? '分表示（5分ごと）ON' : '分表示（5分ごと）OFF';
  drawClock();
}

// イベント設定
document.addEventListener('DOMContentLoaded', () => {
  // ボタン
  document.getElementById('btn-now').addEventListener('click', speakNow);
  document.getElementById('btn-name').addEventListener('click', speakName);
  document.getElementById('btn-start').addEventListener('click', speakStart);
  document.getElementById('btn-end').addEventListener('click', speakEnd);
  document.getElementById('btn-remain').addEventListener('click', speakRemain);
  document.getElementById('btn-toggle-minutes').addEventListener('click', toggleMinuteFive);

  // 時刻表ボタン
  document.querySelectorAll('.tt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.file;
      loadTimetable(path).then(() => updateCurrentPeriod());
    });
  });

  // 最初の時刻表（data フォルダ内のファイル名に合わせてください）
  loadTimetable('data/timetable1.json').then(() => updateCurrentPeriod());

  // 毎秒更新
  drawClock();
  setInterval(() => {
    drawClock();
    updateCurrentPeriod();
  }, 1000);
});
