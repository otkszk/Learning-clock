let timetable = [];
let currentPeriod = {};
let showMinuteFiveNumbers = true;

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');

/* Canvas 高DPI対応 */
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

/* 時計描画 */
function getCanvasMetrics() {
  const cssSize = canvas.clientWidth;
  const center = cssSize / 2;
  const radius = cssSize / 2;
  return { center, radius };
}

function drawClock() {
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

  // ★ 分針基準で「現在〜終了」部分を塗る
  if (currentPeriod.start && currentPeriod.end) {
    const now = new Date();
    const nowM = now.getMinutes();

    const [eh, em] = currentPeriod.end.split(':').map(Number);
    const endM = em; // 終了時刻の分

    // 今の分針角度と終了分針角度
    let nowAngle = (nowM / 60) * 2 * Math.PI - Math.PI / 2;
    let endAngle = (endM / 60) * 2 * Math.PI - Math.PI / 2;

    // 今の分から終了分まで塗る
    if (endM > nowM || (eh !== now.getHours())) {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius * 0.9, nowAngle, endAngle, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
      ctx.fill();
    }
  }

  // 目盛
  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);

  // 針
  drawHands(center, radius);

  // デジタル
  updateDigitalClock();
}

function drawHourNumbers(center, radius) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(radius * 0.16);
  ctx.font = `${fontSize}px "Noto Sans JP", Arial`;
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
  const fontSize = Math.round(radius * 0.10);
  ctx.font = `${fontSize}px "Noto Sans JP", Arial`;
  ctx.fillStyle = '#0b4766';
  for (let m = 5; m <= 60; m += 5) {
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    ctx.fillText(m, x, y);
  }
}

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
  hand(minAngle, 0.75, 4, '#0b76c1');
  hand(secAngle, 0.88, 2, 'red');
}

function updateDigitalClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  digitalEl.textContent = `${ampm}${h12}:${String(m).padStart(2,'0')}`;
}

/* 時刻表関連 */
async function loadTimetable(path) {
  const res = await fetch(path);
  const raw = await res.json();
  timetable = raw.map(i => ({
    name: i['名称'],
    start: i['開始時刻'],
    end: i['終了時刻']
  }));
}

function updateCurrentPeriod() {
  const now = new Date();
  const curM = now.getHours()*60+now.getMinutes();
  currentPeriod = {};
  for (const p of timetable) {
    const [sh,sm]=p.start.split(':').map(Number);
    const [eh,em]=p.end.split(':').map(Number);
    const st=sh*60+sm, et=eh*60+em;
    if(curM>=st && curM<et){currentPeriod=p;break;}
  }
  document.getElementById('currentPeriod').textContent=currentPeriod.name||'-';
  document.getElementById('startTime').textContent=currentPeriod.start||'-';
  document.getElementById('endTime').textContent=currentPeriod.end||'-';
  renderTimetable();
}

function renderTimetable(){
  const el=document.getElementById('timetableList');el.innerHTML='';
  const now=new Date(),curM=now.getHours()*60+now.getMinutes();
  let idx=-1;
  timetable.forEach((p,i)=>{const [sh,sm]=p.start.split(':').map(Number);
    const [eh,em]=p.end.split(':').map(Number);
    const st=sh*60+sm,et=eh*60+em;
    if(curM>=st&&curM<et)idx=i;});
  timetable.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='timetable-item';
    d.textContent=`${p.start}〜${p.end} ${p.name}`;
    if(i===idx)d.classList.add('active');
    el.appendChild(d);
  });
  if(idx>=0)requestAnimationFrame(()=>{el.querySelector('.active').scrollIntoView({block:'center'});});
}

/* 音声 */
function speak(t){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';speechSynthesis.cancel();speechSynthesis.speak(u);}
function speakNow(){const n=new Date(),h=n.getHours(),m=n.getMinutes();const am=h<12?'午前':'午後';const h12=h%12||12;speak(`今の時刻は、${am}${h12}時${m}分です`);}
function speakName(){if(currentPeriod.name)speak(currentPeriod.name);}
function speakStart(){if(currentPeriod.name)speak(`${currentPeriod.name}は、${currentPeriod.start}から始まりました`);}
function speakEnd(){if(currentPeriod.name)speak(`${currentPeriod.name}は、${currentPeriod.end}に終わります`);}
function speakRemain(){if(currentPeriod.end){const n=new Date();const[eh,em]=currentPeriod.end.split(':').map(Number);const e=new Date();e.setHours(eh,em,0,0);const d=Math.max(0,Math.floor((e-n)/60000));speak(`${currentPeriod.name}は、あと${d}分で終わります`);}}

/* 初期化 */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('btn-now').onclick=speakNow;
  document.getElementById('btn-name').onclick=speakName;
  document.getElementById('btn-start').onclick=speakStart;
  document.getElementById('btn-end').onclick=speakEnd;
  document.getElementById('btn-remain').onclick=speakRemain;
  document.getElementById('btn-toggle-minutes').onclick=()=>{showMinuteFiveNumbers=!showMinuteFiveNumbers;drawClock();};

  document.querySelectorAll('.tt-btn').forEach(b=>b.onclick=()=>{loadTimetable(b.dataset.file).then(()=>updateCurrentPeriod());});
  loadTimetable('data/timetable1.json').then(()=>updateCurrentPeriod());
  drawClock();
  setInterval(()=>{updateCurrentPeriod();drawClock();},1000);
});
