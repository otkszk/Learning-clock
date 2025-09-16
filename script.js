const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");

let showMinuteNumbers = false;

// スマホ・タブレット対応
function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 360);
  canvas.width = size * 2;   // 高解像度用
  canvas.height = size * 2;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function getMetrics() {
  const center = canvas.width / 2;
  const radius = canvas.width / 2 * 0.9;
  return { center, radius };
}

function drawClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { center, radius } = getMetrics();

  // 盤面
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#eef7ff';
  ctx.fill();
  ctx.lineWidth = radius * 0.03;
  ctx.strokeStyle = '#2b3a4a';
  ctx.stroke();

  // 針
  drawHands(center, radius);

  // 数字（最後に描画）
  drawHourNumbers(center, radius);
  if (showMinuteNumbers) drawMinuteNumbers(center, radius);

  // デジタル時計
  updateDigitalClock();
}

// 時間（1〜12）
function drawHourNumbers(center, radius) {
  ctx.font = `${radius * 0.15}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "#2b3a4a";

  for (let num = 1; num <= 12; num++) {
    let angle = (num - 3) * (Math.PI * 2) / 12;
    let x = center + Math.cos(angle) * radius * 0.75;
    let y = center + Math.sin(angle) * radius * 0.75;
    ctx.strokeText(num.toString(), x, y);
    ctx.fillText(num.toString(), x, y);
  }
}

// 分（5,10,15,...60）
function drawMinuteNumbers(center, radius) {
  ctx.font = `${radius * 0.1}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "#cc0000";

  for (let num = 5; num <= 60; num += 5) {
    let angle = (num - 15) * (Math.PI * 2) / 60;
    let x = center + Math.cos(angle) * radius * 0.9;
    let y = center + Math.sin(angle) * radius * 0.9;
    ctx.strokeText(num.toString(), x, y);
    ctx.fillText(num.toString(), x, y);
  }
}

// 針
function drawHands(center, radius) {
  const now = new Date();
  let hour = now.getHours() % 12;
  let minute = now.getMinutes();
  let second = now.getSeconds();

  let hourAngle = (Math.PI * 2) * (hour / 12) + (Math.PI * 2) * (minute / 720);
  drawHand(center, hourAngle, radius * 0.5, radius * 0.07, "#000");

  let minuteAngle = (Math.PI * 2) * (minute / 60) + (Math.PI * 2) * (second / 3600);
  drawHand(center, minuteAngle, radius * 0.7, radius * 0.05, "#000");

  let secondAngle = (Math.PI * 2) * (second / 60);
  drawHand(center, secondAngle, radius * 0.85, radius * 0.02, "red");
}

function drawHand(center, angle, length, width, color) {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.moveTo(center, center);
  ctx.lineTo(center + Math.cos(angle) * length,
             center + Math.sin(angle) * length);
  ctx.strokeStyle = color;
  ctx.stroke();
}

// デジタル時計
function updateDigitalClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("digitalClock").textContent = `${h}:${m}:${s}`;
}

// 分表示切替
function toggleMinuteNumbers() {
  showMinuteNumbers = !showMinuteNumbers;
  drawClock();
}

setInterval(drawClock, 1000);
drawClock();
