let scheduleData = [];
let currentPeriod = {};
let showMinutes = false;

const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");

// 高DPI（スマホ/タブレット）対応
function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 400);
    canvas.width = size * 2;   // 高解像度描画
    canvas.height = size * 2;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawClock() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(radius, radius);

    drawFace(ctx, radius);
    drawNumbers(ctx, radius);
    if (showMinutes) drawMinuteMarks(ctx, radius);
    drawTime(ctx, radius);

    ctx.restore();
    updateDigitalClock();
}

// 時計の外枠
function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.lineWidth = radius * 0.03;
    ctx.strokeStyle = "#333";
    ctx.stroke();
}

// 時間（1～12）
function drawNumbers(ctx, radius) {
    ctx.font = radius * 0.15 + "px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 12; num++) {
        let ang = (num * Math.PI) / 6;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.8);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.8);
        ctx.rotate(-ang);
    }
}

// 分（1～60）
function drawMinuteMarks(ctx, radius) {
    ctx.font = radius * 0.07 + "px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    for (let num = 1; num <= 60; num++) {
        let ang = (num * Math.PI) / 30;
        ctx.rotate(ang);
        ctx.translate(0, -radius * 0.65);
        ctx.rotate(-ang);
        ctx.fillText(num.toString(), 0, 0);
        ctx.rotate(ang);
        ctx.translate(0, radius * 0.65);
        ctx.rotate(-ang);
    }
}

// 時計の針
function drawTime(ctx, radius) {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();

    // 時針
    let hourPos = (hour % 12) * Math.PI / 6 +
                  (minute * Math.PI) / (6 * 60) +
                  (second * Math.PI) / (360 * 60);
    drawHand(ctx, hourPos, radius * 0.5, radius * 0.07);

    // 分針
    let minutePos = (minute * Math.PI) / 30 +
                    (second * Math.PI) / (30 * 60);
    drawHand(ctx, minutePos, radius * 0.75, radius * 0.05);

    // 秒針
    let secondPos = (second * Math.PI) / 30;
    drawHand(ctx, secondPos, radius * 0.85, radius * 0.02, "red");
}

// 針を描画
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

// デジタル時計
function updateDigitalClock() {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let ampm = hour >= 12 ? "午後" : "午前";
    let displayHour = hour % 12 || 12;
    document.getElementById("digitalClock").innerText =
        `${ampm} ${displayHour}:${minute.toString().padStart(2, "0")}`;
}

// --------- ボタン機能 ---------
function toggleMinuteMarks() {
    showMinutes = !showMinutes;
    drawClock();
}

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
    if (currentPeriod.name) speak(currentPeriod.name);
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

// --------- 時刻表管理 ---------
async function loadSchedule(path) {
    const res = await fetch(path);
    scheduleData = await res.json();
}

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
            currentPeriod = { name: period.name, start: period.start, end: period.end };
            break;
        }
    }

    document.getElementById("currentPeriod").innerText = currentPeriod.name || "-";
    document.getElementById("startTime").innerText = currentPeriod.start || "-";
    document.getElementById("endTime").innerText = currentPeriod.end || "-";
}

// --------- 毎秒更新 ---------
setInterval(() => {
    drawClock();
    updateSchedule();
}, 1000);

loadSchedule("data/schedule1.json");
drawClock();
