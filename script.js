/* ---------------------
   基本データ / 状態
   --------------------- */
let timetable = [];
let currentEntry = null;
let minuteMarksVisible = false;

/* 要素参照 */
const analogClock = document.getElementById('analog-clock');
const hourMarksContainer = document.getElementById('hour-marks');
const minuteMarksContainer = document.getElementById('minute-marks');
const hourHand = document.getElementById('hour-hand');
const minuteHand = document.getElementById('minute-hand');
const digitalClock = document.getElementById('digital-clock');
const currentSubjectEl = document.getElementById('current-subject');
const currentStartEl = document.getElementById('current-start');
const currentEndEl = document.getElementById('current-end');
const toggleMinuteBtn = document.getElementById('btn-toggle-minutes');

/* ---------------------
   初期描画：1〜12の数字（常に表示）
   --------------------- */
function createHourNumbers() {
  // 既存の数字をクリア（再描画用）
  hourMarksContainer.innerHTML = '';
  const clockSize = analogClock.clientWidth;
  // 半径：中央から数字を置く距離
  const radius = Math.round(clockSize / 2 - 48);

  for (let i = 1; i <= 12; i++) {
    const angle = i * 30; // 360/12
    const num = document.createElement('div');
    num.className = 'hour-number';
    num.textContent = String(i);
    // 数字が常に水平になるように回転と打ち消し回転を組み合わせる
    num.style.transform = `translate(-50%,-50%) rotate(${angle}deg) translateY(-${radius}px) rotate(-${angle}deg)`;
    hourMarksContainer.appendChild(num);
  }
}

/* ---------------------
   分メモリ（1〜60）の生成／削除（トグル）
   --------------------- */
function createMinuteMarks() {
  minuteMarksContainer.innerHTML = '';
  const clockSize = analogClock.clientWidth;
  const radius = Math.round(clockSize / 2 - 18);

  for (let i = 0; i < 60; i++) {
    const angle = i * 6; // 360/60
    const tick = document.createElement('div');
    tick.className = 'minute-tick';
    // 5分ごとは長め・太め
    if (i % 5 === 0) {
      tick.classList.add('long');
      tick.style.width = '4px';
      tick.style.height = '14px';
      tick.style.marginTop = '-14px';
    } else {
      tick.style.width = '2px';
      tick.style.height = '8px';
      tick.style.marginTop = '-8px';
    }
    // transform: 中心に要素を置いて回転させ、外側に移動
    tick.style.transform = `translate(-50%,-50%) rotate(${angle}deg) translateY(-${radius}px)`;
    minuteMarksContainer.appendChild(tick);
  }
}

/* 分メモリの表示／非表示トグル */
function toggleMinuteMarks() {
  minuteMarksVisible = !minuteMarksVisible;
  if (minuteMarksVisible) {
    // 作成して表示
    createMinuteMarks();
    minuteMarksContainer.style.display = 'block';
    toggleMinuteBtn.textContent = '分非表示';
  } else {
    // 非表示（中身も削除）
    minuteMarksContainer.style.display = 'none';
    minuteMarksContainer.innerHTML = '';
    toggleMinuteBtn.textContent = '分表示';
  }
}

/* リサイズ対応：数字と分メモリを再配置 */
function handleResize() {
  createHourNumbers();
  if (minuteMarksVisible) createMinuteMarks();
}
window.addEventListener('resize', handleResize);

/* ---------------------
   時計の更新（針・デジタル・スケジュール判定）
   --------------------- */
function updateClock() {
  const now = new Date();

  // アナログ針の角度
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const hourDeg = ((hour % 12) + minute / 60) * 30; // 360/12
  const minuteDeg = (minute + second / 60) * 6; // 360/60

  hourHand.style.transform = `translate(-50%,-100%) rotate(${hourDeg}deg)`;
  minuteHand.style.transform = `translate(-50%,-100%) rotate(${minuteDeg}deg)`;

  // デジタル（日本語）例: 午前10:05
  const ampm = hour < 12 ? '午前' : '午後';
  const dispHour = hour % 12 === 0 ? 12 : hour % 12;
  digitalClock.textContent = `${ampm}${dispHour}:${String(minute).padStart(2, '0')}`;

  // スケジュール更新
  updateSchedule(now);
}

/* ---------------------
   時刻表関係
   parseTime: "HH:MM" → 今日のDate
   --------------------- */
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function updateSchedule(now) {
  currentEntry = null;
  for (let entry of timetable) {
    try {
      const start = parseTime(entry['開始時刻']);
      const end = parseTime(entry['終了時刻']);
      if (now >= start && now < end) {
        currentEntry = entry;
        break;
      }
    } catch (e) {
      // parse error があっても続行
    }
  }

  if (currentEntry) {
    currentSubjectEl.textContent = currentEntry['名称'] || '---';
    currentStartEl.textContent = currentEntry['開始時刻'] || '---';
    currentEndEl.textContent = currentEntry['終了時刻'] || '---';
  } else {
    currentSubjectEl.textContent = '---';
    currentStartEl.textContent = '---';
    currentEndEl.textContent = '---';
  }
}

/* ---------------------
   音声合成（日本語・機械読み）
   --------------------- */
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  // 少しゆっくり目にすると子ども向けに聴き取りやすくなる
  utter.rate = 0.95;
  speechSynthesis.cancel(); // 発話中断して新しい発話へ
  speechSynthesis.speak(utter);
}

/* ボタン用読み上げ */
function speakNow() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? '午前' : '午後';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  speak(`今の時刻は、${ampm}${h12}時${m}分です`);
}

function speakName() {
  if (currentEntry) {
    speak(`${currentEntry['名称']}`);
  } else {
    speak('今は授業時間ではありません');
  }
}

function speakStart() {
  if (currentEntry) {
    speak(`${currentEntry['名称']}は、${currentEntry['開始時刻']}から始まりました`);
  } else {
    speak('現在、開始時刻の情報はありません');
  }
}

function speakEnd() {
  if (currentEntry) {
    speak(`${currentEntry['名称']}は、${currentEntry['終了時刻']}に終わります`);
  } else {
    speak('現在、終了時刻の情報はありません');
  }
}

function speakRemain() {
  if (currentEntry) {
    const now = new Date();
    const end = parseTime(currentEntry['終了時刻']);
    let diffMin = Math.max(0, Math.floor((end - now) / 60000));
    speak(`${currentEntry['名称']}は、あと${diffMin}分で終わります`);
  } else {
    speak('現在、残り時間を計算できる授業はありません');
  }
}

/* ---------------------
   時刻表読み込み（data フォルダ）
   例: data/timetable1.json
   --------------------- */
async function loadTimetable(filename) {
  try {
    const res = await fetch(`data/${filename}`);
    if (!res.ok) throw new Error('ファイル読み込み失敗');
    const json = await res.json();
    // 期待する形式: [{ "名称":"1時間目", "開始時刻":"08:45", "終了時刻":"09:30" }, ...]
    timetable = json;
    updateSchedule(new Date());
    speak(`${filename}を読み込みました`);
  } catch (e) {
    console.error(e);
    speak('時刻表の読み込みに失敗しました');
  }
}

/* ---------------------
   初期化
   --------------------- */
function init() {
  createHourNumbers();
  // 初期は分メモリ非表示
  minuteMarksContainer.style.display = 'none';

  // 時計更新（1秒ごと）
  updateClock();
  setInterval(updateClock, 1000);

  // 最初の時刻表を読み込む（存在しない場合はファイルエラーを無視）
  loadTimetable('timetable1.json');
}

// DOM 準備後に init
document.addEventListener('DOMContentLoaded', init);
