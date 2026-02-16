let noCount = 0;
const MAX_NO_ATTEMPTS = 3;
const DODGE_THRESHOLD = 150; // Khoảng cách bắt đầu né

// DOM Elements
const scenes = document.querySelectorAll('.scene');
const memeOverlay = document.getElementById('meme-overlay');
const fireworksContainer = document.getElementById('fireworks-container');

// Start Button logic
document.getElementById('start-btn').addEventListener('click', () => {
    goToScene(2);
    createFireworks();
});

// Scene Transition Function
function goToScene(sceneNumber) {
    scenes.forEach(scene => scene.classList.remove('active'));
    document.getElementById(`scene-${sceneNumber}`).classList.add('active');
    noCount = 0;
}

// "Yes" Buttons Logic
document.getElementById('yes-btn-1').addEventListener('click', () => goToScene(3));
document.getElementById('yes-btn-2').addEventListener('click', () => goToScene(4));
document.getElementById('yes-btn-3').addEventListener('click', () => goToScene(5));

// "No" Buttons Logic (Force-field dodging) – smooth movement, stays in bounds
const PADDING = 24;
const MOVE_ARENA_W = 0.55; // % of viewport width the button can move in
const MOVE_ARENA_H = 0.35; // % of viewport height
let fleeRAF = null;
let lastMouse = { x: 0, y: 0 };

function setupDodging(btnId) {
    const noBtn = document.getElementById(btnId);
    let isChasing = false;

    document.addEventListener('mousemove', (e) => {
        if (!noBtn.closest('.scene').classList.contains('active')) return;
        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;

        const btnRect = noBtn.getBoundingClientRect();
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        const distX = e.clientX - btnCenterX;
        const distY = e.clientY - btnCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < DODGE_THRESHOLD) {
            if (!isChasing) {
                noCount++;
                isChasing = true;
                if (noCount >= MAX_NO_ATTEMPTS) showMeme();
            }
            if (!fleeRAF) {
                fleeRAF = requestAnimationFrame(() => {
                    fleeFromMouse(noBtn, lastMouse.x, lastMouse.y);
                    fleeRAF = null;
                });
            }
        } else {
            isChasing = false;
        }
    });

    noBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showMeme();
    });
}

function getMoveBounds() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const halfW = (w * MOVE_ARENA_W) / 2;
    const halfH = (h * MOVE_ARENA_H) / 2;
    return { minX: cx - halfW, maxX: cx + halfW, minY: cy - halfH, maxY: cy + halfH };
}

function clampPosition(x, y, width, height) {
    const b = getMoveBounds();
    const x2 = Math.max(b.minX, Math.min(b.maxX - width, x));
    const y2 = Math.max(b.minY, Math.min(b.maxY - height, y));
    return { x: x2, y: y2 };
}

function getCenterPosition(btn) {
    const b = getMoveBounds();
    const btnRect = btn.getBoundingClientRect();
    return {
        x: b.minX + (b.maxX - b.minX - btnRect.width) / 2,
        y: b.minY + (b.maxY - b.minY - btnRect.height) / 2
    };
}

function fleeFromMouse(btn, mouseX, mouseY) {
    const btnRect = btn.getBoundingClientRect();
    const isAlreadyDodging = btn.style.position === 'fixed';

    let nextX, nextY;
    if (!isAlreadyDodging) {
        // First time: place at center of screen, not current position
        const center = getCenterPosition(btn);
        nextX = center.x;
        nextY = center.y;
    } else {
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        const distX = btnCenterX - mouseX;
        const distY = btnCenterY - mouseY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance < 1) return;

        const push = 48;
        const moveX = (distX / distance) * push;
        const moveY = (distY / distance) * push;
        nextX = btnRect.left + moveX;
        nextY = btnRect.top + moveY;
    }

    const clamped = clampPosition(nextX, nextY, btnRect.width, btnRect.height);
    nextX = clamped.x;
    nextY = clamped.y;

    const b = getMoveBounds();
    const atLeft = nextX <= b.minX;
    const atRight = nextX >= b.maxX - btnRect.width;
    const atTop = nextY <= b.minY;
    const atBottom = nextY >= b.maxY - btnRect.height;
    if ((atLeft || atRight) && (atTop || atBottom)) {
        nextX = b.minX + Math.random() * (b.maxX - b.minX - btnRect.width);
        nextY = b.minY + Math.random() * (b.maxY - b.minY - btnRect.height);
        const c = clampPosition(nextX, nextY, btnRect.width, btnRect.height);
        nextX = c.x;
        nextY = c.y;
    }

    btn.style.position = 'fixed';
    btn.style.left = `${nextX}px`;
    btn.style.top = `${nextY}px`;
    btn.style.zIndex = '9999';
}

function showMeme() {
    memeOverlay.classList.remove('hidden');
}

document.getElementById('meme-close-btn').addEventListener('click', () => {
    memeOverlay.classList.add('hidden');
    noCount = 0;
});

// Initialize
setupDodging('no-btn-1');
setupDodging('no-btn-2');

// Fireworks logic
function createFireworks() {
    setInterval(() => {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.style.left = Math.random() * 100 + 'vw';
        firework.style.top = Math.random() * 100 + 'vh';
        firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        fireworksContainer.appendChild(firework);
        setTimeout(() => firework.remove(), 1000);
    }, 500);
}

// Add CSS for simple fireworks dynamically
const style = document.createElement('style');
style.textContent = `
    .firework {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        box-shadow: 0 0 10px 2px currentColor;
        animation: explode 1s ease-out forwards;
        z-index: 1;
    }
    @keyframes explode {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(10); opacity: 0; }
    }
`;
document.head.appendChild(style);
