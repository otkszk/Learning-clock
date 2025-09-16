let timetable = [];
let currentEntry = null;

// 時計を動かす
function updateClock() {
  const now = new Date();

  // アナログ時計
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const hourDeg = ((hour % 12) + minute / 60) * 30;
  const minuteDeg = (minute + second / 60) * 6;

  document.getElementById("hour-hand").style.transform =
    `translateX(-50%) rotate(${hourDeg}deg)`;
  document.getElementById("minute-hand").style.transform =
    `translateX(-50%) rotate(${minuteDeg}deg)`;

  // デジタル時計
  const ampm = hour < 12 ? "午前" : "午後";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const digitalTime = `${ampm}${displayHour}:${String(minute).padStart(2, '0')}`;
  document.getElementById("digital-clock").textContent = digitalTime;

  // 時刻表チェック
  updateSchedule(now);
}

function updateSchedule(now) {
  currentEntry = null;
  for (let entry of timetable) {
    const start = parseTime(entry["開始時刻"]);
    const end = parseTime(entry["終了時刻"]);
    if (now >= start && now < end) {
      currentEntry = entry;
      break;
    }
  }

  if (currentEntry) {
    document.getElementById("current-subject").textContent = currentEntry["名称"];
    document.getElementById("current-start").textContent = currentEntry["開始時刻"];
    document.getElementById("current-end").textContent = currentEntry["終了時刻"];
  } else {
    document.getElementById("current-subject").textContent = "---";
    document.getElementById("current-start").textContent = "---";
    document.getElementById("current-end").textContent = "---";
  }
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

// 音声合成（日本語）
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  speechSynthesis.speak(utter);
}

// ボタン機能
function speakNow() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h < 12 ? "午前" : "午後";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  speak(`今の時刻は、${ampm}${h12}時${m}分です`);
}

function speakName() {
  if (currentEntry) {
    speak(`${currentEntry["名称"]}`);
  }
}

function speakStart() {
  if (currentEntry) {
    speak(`${currentEntry["名称"]}は、${currentEntry["開始時刻"]}から始まりました`);
  }
}

function speakEnd() {
  if (currentEntry) {
    speak(`${currentEntry["名称"]}は、${currentEntry["終了時刻"]}に終わります`);
  }
}

function speakRemain() {
  if (currentEntry) {
    const now = new Date();
    const end = parseTime(currentEntry["終了時刻"]);
    const diff = Math.max(0, Math.floor((end - now) / 60000));
    speak(`${currentEntry["名称"]}は、あと${diff}分で終わります`);
  }
}

// 時刻表を読み込む
async function loadTimetable(filename) {
  const res = await fetch(`data/${filename}`);
  timetable = await res.json();
  updateSchedule(new Date());
}

// 初期化
setInterval(updateClock, 1000);
loadTimetable("timetable1.json");
