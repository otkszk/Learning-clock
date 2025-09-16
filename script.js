let scheduleData = [];
let currentPeriod = {};
let showMinutes = false;

const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");
const radius = canvas.height / 2;
ctx.translate(radius, radius);

function drawClock() {
    ctx.clearRect(-radius, -radius, canvas.width, canvas.height);
    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    if (showMinutes) drawMinuteMarks(ctx, radius);
    drawTime(ctx, radius);
}

function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.lineWidth = radius * 0.05;
    ctx.stroke();
}

function drawNumbers(ctx, radius) {
    ctx.font = radius * 0.15 + "px arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 12; num++) {
        let ang = (num * Math.PI) / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.85);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.85);
        ctx.rotate(-ang);
    }
}

function drawMinuteMarks(ctx, radius) {
    ctx.font = radius * 0.07 + "px arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 60; num++) {
        let ang = (num * Math.PI) / 30;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.75);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.75);
        ctx.rotate(-ang);
    }
}

function drawTime(ctx, radius) {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    // Digital clock
    let ampm = hour >= 12 ? "午後" : "午前";
    let displayHour = hour % 12 || 12;
    document.getElementById("digitalClock").innerText =
        ampm + " " + displayHour + ":" + minute.toString().padStart(2, "0");

    // Hour hand
    hour = hour % 12;
    hour = (hour * Math.PI) / 6 +
           (minute * Math.PI) / (6 * 60) +
           (second * Math.PI) / (360 * 60);
    drawHand(ctx, hour, radius * 0.5, radius * 0.07);

    // Minute hand
    minute = (minute * Math.PI) / 30 + (second * Math.PI) / (30 * 60);
    drawHand(ctx, minute, radius * 0.8, radius * 0.07);

    // Second hand
    second = (second * Math.PI) / 30;
    drawHand(ctx, second, radius * 0.9, radius * 0.02, "red");
}

function drawHand(ctx, pos, length, width, color = "#000") {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

// ボタン機能
function toggleMinuteMarks() {
    showMinutes = !showMinutes;
    drawClock();
}

// 音声読み上げ
function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    speechSynthesis.speak(utter);
}

function speakTime() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const ampm = hour >= 12 ? "午後" : "午前";
    const displayHour = hour % 12 || 12;
    speak(`${ampm}${displayHour}時${minute}分です`);
}

function speakName() {
    if (currentPeriod.name) {
        speak(currentPeriod.name);
    }
}

function speakStart() {
    if (currentPeriod.name && currentPeriod.start) {
        speak(`${currentPeriod.name}は、${currentPeriod.start}から始まりました`);
    }
}

function speakEnd() {
    if (currentPeriod.name && currentPeriod.end) {
        speak(`${currentPeriod.name}は、${currentPeriod.end}に終わります`);
    }
}

function speakRemaining() {
    if (currentPeriod.end) {
        const now = new Date();
        const [eh, em] = currentPeriod.end.split(":").map(Number);
        const endTime = new Date();
        endTime.setHours(eh, em, 0, 0);
        const diff = Math.max(0, Math.floor((endTime - now) / 60000));
        speak(`${currentPeriod.name}は、あと${diff}分で終わります`);
    }
}

// 時刻表読み込み
async function loadSchedule(path) {
    const res = await fetch(path);
    scheduleData = await res.json();
}

// 現在の時間割を更新
function updateSchedule() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    currentPeriod = {};
    for (let period of scheduleData) {
        const [sh, sm] = period.start.split(":").map(Number);
        const [eh, em] = period.end.split(":").map(Number);
        const startM = sh * 60 + sm;
        const endM = eh * 60 + em;
        if (currentMinutes >= startM && currentMinutes < endM) {
            currentPeriod = {
                name: period.name,
                start: period.start,
                end: period.end,
            };
            break;
        }
    }

    document.getElementById("currentPeriod").innerText = currentPeriod.name || "-";
    document.getElementById("startTime").innerText = currentPeriod.start || "-";
    document.getElementById("endTime").innerText = currentPeriod.end || "-";
}

// 時計を1秒ごとに更新
setInterval(() => {
    drawClock();
    updateSchedule();
}, 1000);

// 初期時刻表
loadSchedule("data/schedule1.json");
