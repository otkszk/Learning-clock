let timetable = [];
let currentPeriod = {};
let showMinuteFiveNumbers = true;

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');

/* ------------------------
   Canvas 高 DPI 対応
   ------------------------ */
function resizeCanvasForDPR() {
  const cssSize = Math.min(window.innerWidth * 0.9, 420);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  // 描画はCSSピクセル単位で行う
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvasForDPR();
window.addEventListener('resize', () => {
  resizeCanvasForDPR();
  drawClock();
});

/* ------------------------
   ヘルパー（中心・半径）
   ------------------------ */
function getCanvasMetrics() {
  const cssSize = canvas.clientWidth;
  const center = cssSize / 2;
  const radius = cssSize / 2;
  return { cssSize, center, radius };
}

/* ------------------------
   時計描画（扇形：現在→終了 を塗る）
   ------------------------ */
function drawClock() {
  // クリア（CSSピクセル換算）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { center, radius } = getCanvasMetrics();

  // 盤面
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(3, radius * 0.03);
  ctx.strokeStyle = '#2b3a4a';
  ctx.stroke();

  // ★ 現在の時間帯の「残り部分」をピンクで塗る（正しい角度計算）
  if (currentPeriod.start && currentPeriod.end) {
    const now = new Date();
    // 12時間で見た分単位（0～719）
    const nowTotal = ((now.getHours() % 12) * 60) + now.getMinutes();

    const [sh, sm] = currentPeriod.start.split(':').map(Number);
    const [eh, em] = currentPeriod.end.split(':').map(Number);
    const startTotal = ((sh % 12) * 60) + sm;
    const endTotal = ((eh % 12) * 60) + em;

    // 現在時刻が該当範囲内の時だけ描画
    if (nowTotal >= startTotal && nowTotal < endTotal) {
      // 角度に変換（total / 720 * 2π） - π/2で12時を上に
      let nowAngle = (nowTotal / 720) * 2 * Math.PI - Math.PI / 2;
      let endAngle = (endTotal / 720) * 2 * Math.PI - Math.PI / 2;

      // endAngle が nowAngle より小さい場合（理論上は通常起きないが安全策）
      if (endAngle <= nowAngle) endAngle += 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius * 0.9, nowAngle, endAngle, false); // 時計回り
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 182, 193, 0.7)'; // ピンク（半透明）
      ctx.fill();

      // optional: 輪郭を少し描く（濃いピンク）
      ctx.beginPath();
      ctx.arc(center, center, radius * 0.9, nowAngle, endAngle, false);
      ctx.strokeStyle = 'rgba(255,102,140,0.9)';
      ctx.lineWidth = Math.max(2, radius * 0.01);
      ctx.stroke();
    }
  }

  // 目盛・数字（時間/分）
  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);

  // 針
  drawHands(center, radius);

  // デジタル表示更新
  updateDigitalClock();
}

/* ------------------------
   盤面目盛（時間） - 縁取りして見やすく
   ------------------------ */
function drawHourNumbers(center, radius) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(12, Math.round(radius * 0.16));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  ctx.lineWidth = Math.max(3, fontSize * 0.12);
  ctx.fillStyle = '#082737';
  ctx.strokeStyle = 'white';
  for (let num = 1; num <= 12; num++) {
    const ang = (num * Math.PI) / 6;
    const x = center + Math.sin(ang) * radius * 0.72;
    const y = center - Math.cos(ang) * radius * 0.72;
    ctx.strokeText(String(num), x, y);
    ctx.fillText(String(num), x, y);
  }
}

/* ------------------------
   盤面目盛（5分ごと） - 縁取りして見やすく
   ------------------------ */
function drawMinuteFiveNumbers(center, radius) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.max(10, Math.round(radius * 0.10));
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  ctx.lineWidth = Math.max(2, fontSize * 0.1);
  ctx.fillStyle = '#0b4766';
  ctx.strokeStyle = 'white';
  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    const text = (m === 60 ? '60' : String(m));
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }
}

/* ------------------------
   針描画
   ------------------------ */
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

  // 中心点
  ctx.beginPath();
  ctx.arc(center, center, Math.max(4, radius * 0.03), 0, Math.PI * 2);
  ctx.fillStyle = '#143241';
  ctx.fill();
}

/* ------------------------
   デジタル時計
   ------------------------ */
function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  digitalEl.textContent = `${ampm}${h12}:${String(m).padStart(2, '0')}`;
}

/* ------------------------
   Timetable（JSON 読込）
   ------------------------ */
async function loadTimetable(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('読み込み失敗');
    const raw = await res.json();
    // フォーマット：「名称」「開始時刻」「終了時刻」
    timetable = raw.map(item => ({
      name: item['名称'] || item['name'],
      start: item['開始時刻'] || item['start'],
      end: item['終了時刻'] || item['end']
    })).filter(x => x.name && x.start && x.end);
  } catch (e) {
    timetable = [];
    speak('時刻表の読み込みに失敗しました');
    console.error(e);
  }
}

/* ------------------------
   リスト描画（全件出すが高さで隠す）+ 現在行を中央へ
   ------------------------ */
function renderTimetable() {
  const listEl = document.getElementById('timetableList');
  listEl.innerHTML = '';

  if (timetable.length === 0) return;

  // 現在のインデックスを取得
  const now = new Date();
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  let currentIndex = -1;

  timetable.forEach((p, i) => {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    if (curMinutes >= startM && curMinutes < endM) {
      currentIndex = i;
    }
  });

  // 全項目を追加
  timetable.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'timetable-item';
    div.textContent = `${p.start}〜${p.end}  ${p.name}`;
    if (i === currentIndex) div.classList.add('active');
    listEl.appendChild(div);
  });

  // 現在行を確実に中央へ（若干の遅延でDOMレイアウト安定後に行う）
  if (currentIndex >= 0) {
    // requestAnimationFrame を使って DOM レイアウト後に scrollIntoView を呼ぶ
    requestAnimationFrame(() => {
      const activeEl = listEl.querySelector('.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    });
  }
}

/* ------------------------
   現在の期間判定・表示更新
   ------------------------ */
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
    const end = new Date(); end.setHours(eh, em, 0, 0);
    const diff = Math.max(0, Math.floor((end - now)/60000));
    speak(`${currentPeriod.name}は、あと${diff}分で終わります`);
  } else {
    speak('現在、授業はありません');
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
  // ボタンイベント
  document.getElementById('btn-now').addEventListener('click', speakNow);
  document.getElementById('btn-name').addEventListener('click', speakName);
  document.getElementById('btn-start').addEventListener('click', speakStart);
  document.getElementById('btn-end').addEventListener('click', speakEnd);
  document.getElementById('btn-remain').addEventListener('click', speakRemain);
  document.getElementById('btn-toggle-minutes').addEventListener('click', toggleMinuteFive);

  document.querySelectorAll('.tt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.file;
      loadTimetable(path).then(() => {
        updateCurrentPeriod();
        drawClock();
      });
    });
  });

  // 初期ロード（時刻表1）
  loadTimetable('data/timetable1.json').then(() => {
    updateCurrentPeriod();
    drawClock();
  });

  // 毎秒、先に現在期間を更新してから描画する（描画は最新データで行う）
  setInterval(() => {
    updateCurrentPeriod();
    drawClock();
  }, 1000);
});
