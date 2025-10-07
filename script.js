// 全体の状態
let timetable = [];
let currentPeriod = {};
let showMinuteFiveNumbers = true;
let showMinuteOneNumbers = false;
let digitalVisible = true;
let blinkState = true;

const canvas = document.getElementById('analogClock');
const ctx = canvas.getContext('2d');
const digitalEl = document.getElementById('digitalClock');
const remainEl = document.getElementById('remainTime');
const listEl = document.getElementById('timetableList');

/* --- Canvas 高DPI対応 --- */
function resizeCanvasForDPR(){
  const cssSize = Math.min(window.innerWidth * 0.6, 420); // 中央幅に合わせる
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

/* --- キャンバス中心／半径取得 --- */
function getCanvasMetrics(){
  const cssSize = canvas.clientWidth;
  const center = cssSize/2;
  const radius = cssSize/2;
  return {center, radius};
}

/* --- 時計描画 --- */
function drawClock(){
  const {center, radius} = getCanvasMetrics();
  // 物理ピクセルを含むクリア
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // 盤面（内側の白円）＋黒枠
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = Math.max(4, radius*0.03);
  ctx.strokeStyle = '#000';
  ctx.stroke();

  // 残り時間（ピンク）：【現在時刻 -> 終了時刻】を毎秒で細かく描く（秒単位の角度）
  if(currentPeriod.start && currentPeriod.end){
    const now = new Date();
    const totalSecsNow = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();

    const [eh, em] = currentPeriod.end.split(':').map(Number);
    const endSecs = eh*3600 + em*60;

    // nowAngle / endAngle（1時間単位の分針の角度ベース ※秒で補正）
    const nowAngle = ((totalSecsNow % 3600) / 3600) * 2 * Math.PI - Math.PI/2;
    let endAngle = ((endSecs % 3600) / 3600) * 2 * Math.PI - Math.PI/2;

    if(endAngle <= nowAngle) endAngle += 2 * Math.PI; // 安全補正

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius*0.9, nowAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,182,193,0.6)';
    ctx.fill();
  }

  // 目盛・数字
  drawHourNumbers(center, radius);
  if(showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);
  if(showMinuteOneNumbers) drawMinuteOneNumbers(center, radius);

  // 針
  drawHands(center, radius);

  // デジタル更新（コロン点滅）
  updateDigitalClock();

  // 残り時間の右側更新
  updateRemainDisplay();
}

/* --- 12時間表示の数字（縁取りなしでシンプル） --- */
function drawHourNumbers(center, radius){
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(radius * 0.16);
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  ctx.fillStyle = '#082737';
  for(let num=1; num<=12; num++){
    const ang = (num * Math.PI) / 6;
    const x = center + Math.sin(ang) * radius * 0.72;
    const y = center - Math.cos(ang) * radius * 0.72;
    ctx.fillText(String(num), x, y);
  }
}

/* --- 5分表示（5,10,...60）--- */
function drawMinuteFiveNumbers(center, radius){
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(radius * 0.10);
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  ctx.fillStyle = '#0b4766';
  for(let m=5; m<=60; m+=5){
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.88;
    const y = center - Math.cos(ang) * radius * 0.88;
    ctx.fillText(m===60? '60' : String(m), x, y);
  }
}

/* --- 1分表示（1〜60、小さめ）--- */
function drawMinuteOneNumbers(center, radius){
  const now = new Date();
  const cm = now.getMinutes() % 60;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.round(radius * 0.06);
  ctx.font = `${fontSize}px "Noto Sans JP", Arial, sans-serif`;
  for(let m=1; m<=60; m++){
    const ang = (m * Math.PI) / 30;
    const x = center + Math.sin(ang) * radius * 0.9;
    const y = center - Math.cos(ang) * radius * 0.9;
    // 現在の分だけ赤に（0分は60として扱う）
    const isCurrent = (m === cm) || (m === 60 && cm === 0);
    ctx.fillStyle = isCurrent ? 'red' : '#333';
    ctx.fillText(String(m), x, y);
  }
}

/* --- 針（時：濃紺、分：赤、秒：黒）--- */
function drawHands(center, radius){
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hourAngle = ((h % 12) + m/60 + s/3600) * (Math.PI/6);
  const minAngle = (m + s/60) * (Math.PI/30);
  const secAngle = (s) * (Math.PI/30);

  function drawHand(angle, lenRatio, width, color){
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

  drawHand(hourAngle, 0.5, Math.max(4, radius*0.06), '#143241');     // 時針
  drawHand(minAngle, 0.75, Math.max(3, radius*0.045), 'red');        // 分針（赤）
  drawHand(secAngle, 0.88, Math.max(1.5, radius*0.02), '#000000');   // 秒針（黒）

  // 中心点
  ctx.beginPath();
  ctx.arc(center, center, Math.max(4, radius*0.03), 0, Math.PI*2);
  ctx.fillStyle = '#143241';
  ctx.fill();
}

/* --- デジタル時計（点滅コロン） --- */
function updateDigitalClock(){
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const colon = blinkState ? ':' : ' ';
  digitalEl.textContent = `${ampm}${h12}${colon}${String(m).padStart(2,'0')}`;

  // visibility-based 非表示（領域を維持）
  if(digitalVisible){
    digitalEl.classList.remove('hidden');
    remainEl.classList.remove('hidden');
  } else {
    digitalEl.classList.add('hidden');
    remainEl.classList.add('hidden');
  }
}

/* --- 右側の「あと〇分」表示更新 --- */
function updateRemainDisplay(){
  if(!currentPeriod.end){
    remainEl.textContent = 'ー';
    return;
  }
  const now = new Date();
  const [eh, em] = currentPeriod.end.split(':').map(Number);
  const end = new Date();
  end.setHours(eh, em, 0, 0);
  const diff = Math.max(0, Math.floor((end - now)/60000));
  remainEl.textContent = `あと${diff}分`;
}

/* --- 時刻表読み込み --- */
async function loadTimetable(path){
  try{
    const res = await fetch(path);
    if(!res.ok) throw new Error('読み込み失敗');
    const raw = await res.json();
    timetable = raw.map(i => ({
      name: i['名称'] || i.name,
      start: i['開始時刻'] || i.start,
      end: i['終了時刻'] || i.end
    })).filter(x => x.name && x.start && x.end);
  }catch(e){
    console.error(e);
    timetable = [];
  }
  updateCurrentPeriod(); // 読み込み後に反映
}

/* --- 現在区間判定とリスト描画 --- */
function updateCurrentPeriod(){
  const now = new Date();
  const curM = now.getHours()*60 + now.getMinutes();
  let idx = -1;
  currentPeriod = {};
  for(let i=0;i<timetable.length;i++){
    const p = timetable[i];
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const st = sh*60 + sm;
    const et = eh*60 + em;
    if(curM >= st && curM < et){
      idx = i;
      currentPeriod = p;
      break;
    }
  }
  renderTimetable(idx);
}

/* --- リスト描画 + アクティブ行を中央にスクロール --- */
function renderTimetable(activeIndex){
  listEl.innerHTML = '';
  if(!timetable || timetable.length === 0) return;

  // 追加
  timetable.forEach((p,i) => {
    const div = document.createElement('div');
    div.className = 'timetable-item';
    div.textContent = `${p.start}〜${p.end}  ${p.name}`;
    div.dataset.index = i;
    if(i === activeIndex) div.classList.add('active');
    listEl.appendChild(div);
  });

  // 中央へスクロール（確実に中央に来るよう手動設定）
  if(typeof activeIndex === 'number' && activeIndex >= 0){
    const activeEl = listEl.querySelector('.timetable-item.active');
    if(activeEl){
      // レイアウト反映後にスクロール
      requestAnimationFrame(() => {
        const offsetTop = activeEl.offsetTop;
        const elHeight = listEl.clientHeight;
        const elMid = elHeight / 2;
        const target = offsetTop - elMid + (activeEl.clientHeight / 2);
        // clamp target
        const maxScroll = listEl.scrollHeight - elHeight;
        const final = Math.max(0, Math.min(target, maxScroll));
        listEl.scrollTo({ top: final, behavior: 'smooth' });
      });
    }
  } else {
    // アクティブなしなら上に戻す（任意）
    listEl.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/* --- 音声 --- */
function speak(text){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ja-JP';
  u.rate = 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
function speakNow(){
  const n = new Date();
  const h = n.getHours(); const m = n.getMinutes();
  const am = h<12 ? '午前' : '午後';
  const h12 = h%12 === 0 ? 12 : h%12;
  speak(`今の時刻は、${am}${h12}時${m}分です`);
}
function speakRemain(){
  if(!currentPeriod.end){
    speak('今の時間の予定はありません');
    return;
  }
  const now = new Date();
  const [eh, em] = currentPeriod.end.split(':').map(Number);
  const end = new Date(); end.setHours(eh, em, 0, 0);
  const diff = Math.max(0, Math.floor((end - now)/60000));
  speak(`${currentPeriod.name}は、あと${diff}分で終わります`);
}

/* --- 初期化 --- */
function init(){
  resizeCanvasForDPR();

  // ボタンイベント
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
    b.addEventListener('click', () => loadTimetable(b.dataset.file));
  });

  // 最初に時刻表1を読み込む
  loadTimetable('data/timetable1.json');

  // 1秒毎に点滅トグル・更新描画
  setInterval(() => {
    blinkState = !blinkState;
    updateCurrentPeriod();
    drawClock();
  }, 1000);

  // 画面リサイズでキャンバス再調整
  window.addEventListener('resize', () => {
    resizeCanvasForDPR();
    drawClock();
  });

  // 初回描画
  drawClock();
}

document.addEventListener('DOMContentLoaded', init);
