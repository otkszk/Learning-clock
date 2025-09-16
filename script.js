let scheduleData = [];
let currentPeriod = {};
let showMinutes = false;

const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");
const radius = canvas.height / 2;

// 時計全体を描画
function drawClock() {
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

// 時計の背景
function drawFace(ctx, radius) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.lineWidth = radius * 0.05;
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
    hour = hour % 12;
    hour = (hour * Math.PI) / 6 +
           (minute * Math.PI) / (6 * 60) +
           (second * Math.PI) / (360 * 60);
    drawHand(ctx, hour, radius * 0.5, radius * 0.07);

    // 分針
    minute = (minute * Math.PI) / 30 + (second * Math.PI) / (30 * 60);
    drawHand(ctx, minute, radius * 0.75, radius * 0.05);

    // 秒針
    second = (second * Math.PI) / 30;
    drawHand(ctx, second, radius * 0.85, radius * 0.02, "red");
}

// 針の描画
function drawHand(ctx, pos, length, width, color = "#000") {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.
