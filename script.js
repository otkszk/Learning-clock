const canvas = document.getElementById("analogClock");
const ctx = canvas.getContext("2d");

let showMinuteFiveNumbers = false;

// スマホ・タブレット対応でCanvasサイズを動的に設定
function resizeCanvas() {
  const size = Math.min(window.innerWidth * 0.9, 360);
  canvas.width = size * 2;   // 高解像度用に2倍
  canvas.height = size * 2;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// デバイスサイズに応じて中心・半径を計算
function getCanvasMetrics() {
  const cssSize = parseInt(canvas.style.width);
  const center = canvas.width / 2;
  const radius = canvas.width / 2 * 0.9;
  return { cssSize, center, radius };
}

// 時計の描画
function drawClock() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { center, radius } = getCanvasMetrics();

  // 盤面（円）
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = '#eef7ff'; // 淡い水色
  ctx.fill();
  ctx.lineWidth = Math.max(3, radius * 0.03);
  ctx.strokeStyle = '#2b3a4a';
  ctx.stroke();

  // 針
  drawHands(center, radius);

  // 文字は最後に重ねて描画
  drawHourNumbers(center, radius);
  if (showMinuteFiveNumbers) drawMinuteFiveNumbers(center, radius);

  // デジタル時計
  updateDigitalClock();
}

// 時間数字（1〜12）
function drawHourNumbers(center, radius) {
  ctx.font = `${radius * 0.15}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "#2b3a4a";

  for (let num = 1; num <= 12; num++) {
    let angle = (num - 3) * (Math.PI * 2) / 12;
    let x = center + Math.cos(angle) * radius * 0.8;
    let y = center + Math.sin(angle) * radius * 0.8;
    ctx.strokeText(num.toString(), x, y); // 縁取り
    ctx.fillText(num.toString(), x, y);   // 本体
  }
}

// 分数字（5,10,15,...）
function drawMinuteFiveNumbers(center, radius) {
  ctx.font = `${radius * 0.1}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "#cc0000";

  for (let num = 5; num <= 60; num += 5) {
    let angle = (num - 15) * (Math.PI * 2) / 60;
    let x = center + Math.cos(angle) * radius * 0.92;
    let y = center + Math.sin(angle) * radius * 0.92;
    ctx.strokeText(num.toString(), x, y);
    ctx.fillText(num.toString(), x, y);
  }
}

// 時計の針
function drawHands(center, radius) {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let second = now.getSeconds();

  // 時
  hour = hour % 12;
  let hourAngle = (Math.PI * 2) * (hour / 12) +
                  (Math.PI * 2) * (minute / 720);
  drawHand(center, hourAngle, radius * 0.5, radius * 0.07, "#000");

  // 分
  let minuteAngle = (Math.PI * 2) * (minute / 60) +
                    (Math.PI * 2) * (second / 3600);
  drawHand(center, minuteAngle, radius * 0.7, radius * 0.05, "#000");

  // 秒
  let secondAngle = (Math.PI * 2) * (second / 60);
  drawHand(center, secondAngle, radius * 0.85, radius * 0.02, "red");
}

// 針を描画する関数
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

// 分の表示切り替え
function toggleMinuteNumbers() {
  showMinuteFiveNumbers = !showMinuteFiveNumbers;
  drawClock();
}

// 1秒ごとに更新
setInterval(drawClock, 1000);
drawClock();
