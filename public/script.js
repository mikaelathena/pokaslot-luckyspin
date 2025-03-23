const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const codeInput = document.getElementById('codeInput');

const spinSound = new Audio('assets/spin.mp3');
const winSound = new Audio('assets/win.mp3');

const prizes = [
  "FREE SPIN", "50.000", "IPHONE 14", "88.000",
  "10.000", "1.000.000", "HONDA BEAT", "15.000",
  "2.500.000", "25.000", "30.000", "500.000"
];

const slice = 360 / prizes.length;
let rotation = 0;
let isSpinning = false;

const DEBUG_MODE = false; // atau true kalau mau aktifkan log di console

function drawWheel() {
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(rotation * Math.PI / 180);

  for (let i = 0; i < prizes.length; i++) {
    const start = (slice * i) * Math.PI / 180;
    const end = (slice * (i + 1)) * Math.PI / 180;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#1e3a8a';
    ctx.arc(0, 0, radius, start, end);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(
      Math.cos((start + end) / 2) * radius * 0.6,
      Math.sin((start + end) / 2) * radius * 0.6
    );
    ctx.rotate((start + end) / 2);

    const label = DEBUG_MODE ? `${i}: ${prizes[i]}` : prizes[i];
    ctx.fillText(label, 0, 0);

    if (DEBUG_MODE) {
      console.log(`[${i}] ${prizes[i]}`);
    }

    ctx.restore();
  }
  ctx.restore();
}

function spinToPrize(index) {
  const sliceAngle = 360 / prizes.length;
  const visualOffset = 3; // akan dikalibrasi manual nanti
  const correctedIndex = (index + visualOffset + prizes.length) % prizes.length;
  const targetAngle = 360 - (correctedIndex * sliceAngle + sliceAngle / 2);
  const fullRotations = 6 * 360;
  const totalRotation = rotation + fullRotations + targetAngle;

  const duration = 8000;
  const frameRate = 1000 / 60;
  const totalFrames = duration / frameRate;
  let currentFrame = 0;
  const startRotation = rotation;
  const endRotation = totalRotation;
  const easeOutQuint = t => 1 - Math.pow(1 - t, 5);

  spinSound.currentTime = 0;
  spinSound.play();

  const spinInterval = setInterval(() => {
    currentFrame++;
    const progress = easeOutQuint(currentFrame / totalFrames);
    rotation = (startRotation + (endRotation - startRotation) * progress) % 360;
    drawWheel();

    if (currentFrame >= totalFrames) {
      clearInterval(spinInterval);
      rotation = endRotation % 360;
      drawWheel();
      setTimeout(() => showPrize(index), 500);
      isSpinning = false;
    }
  }, frameRate);
}

function showPrize(index) {
  winSound.currentTime = 0;
  winSound.play();
  const prize = prizes[index];
  document.getElementById('prizeText').innerText = prize;
  $('#prizeModal').modal('show');
}

spinBtn.addEventListener('click', async () => {
  if (isSpinning) return;

  const code = codeInput.value.trim();
  if (!code) return alert('Masukkan kode terlebih dahulu');

  try {
    const res = await fetch(`/api/spin/${code}`);
    const data = await res.json();

    if (!data.success) return alert(data.message);

    const index = prizes.indexOf(data.prize);
    if (index === -1) return alert('Hadiah tidak valid');

    isSpinning = true;
    spinToPrize(index);
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan.');
  }
});

drawWheel();
