const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ------------------------
// СОСТОЯНИЯ ИГРЫ
// ------------------------
let currentScreen = "auth";
let gameState = "start";

// ------------------------
// ПОЛЬЗОВАТЕЛЬ
// ------------------------
let currentUser = null;
let authMode = "login";
let authUsername = "";
let authPassword = "";
let authError = "";
let activeField = "username";
let menuError = "";

// ДАННЫЕ С БЭКЕНДА
let levels = [];                  // массив уровней с API
let difficulties = [];            // массив сложностей с API
let currentDifficultySlug = "normal";
let currentLevelIndex = 0;

// ИГРОВЫЕ ПАРАМЕТРЫ
let initialLives = 3;
let paddleWidth = 140;
let ballSpeed = 5;
let maxBallSpeed = 9;
let speedupEvery = 5;
let speedupAmount = 0.5;

let score = 0;
let lives = 3;
let gameStartTime = null;
let brokenBricksCount = 0;      // для ускорения мяча

// ------------------------
// ИГРОВЫЕ ОБЪЕКТЫ
// ------------------------
let paddle = { x: WIDTH / 2 - 70, y: HEIGHT - 60, width: 140, height: 18 };
let balls = [];
let bricks = [];
let keys = {};

const BALL_RADIUS = 10;
let paddleSpeed = 8;

// ------------------------
// РЕЙТИНГ
// ------------------------
let leaderboardData = [];
let leaderboardDifficulty = "all";

// ------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ------------------------
function adjustBrightness(hex, percent) {
    if (!hex || !hex.startsWith("#")) return "#aaaaaa";
    const num = parseInt(hex.slice(1), 16);
    const r = (num >> 16) + percent;
    const g = ((num >> 8) & 0x00FF) + percent;
    const b = (num & 0x0000FF) + percent;
    return `#${(0x1000000 + (r < 255 ? (r < 0 ? 0 : r) : 255) * 0x10000 +
        (g < 255 ? (g < 0 ? 0 : g) : 255) * 0x100 +
        (b < 255 ? (b < 0 ? 0 : b) : 255)).toString(16).slice(1)}`;
}

function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

function roundedStrokeRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
}

// ------------------------
// ЗАГРУЗКА ДАННЫХ С БЭКЕНДА
// ------------------------
async function loadDifficulties() {
    const data = await getDifficulties();
    const loadedDifficulties = Array.isArray(data) ? data : (data.difficulties || []);

    if (loadedDifficulties.length > 0) {
        difficulties = loadedDifficulties;
        const defaultDiff = difficulties.find(d => d.slug === "normal") || difficulties[0];
        if (defaultDiff) {
            currentDifficultySlug = defaultDiff.slug;
            applyDifficultySettings(defaultDiff);
        }
    }
}

async function loadLevels() {
    const data = await getLevels();
    const loadedLevels = Array.isArray(data) ? data : (data.levels || []);

    if (loadedLevels.length > 0) {
        levels = loadedLevels;
    }
}

function applyDifficultySettings(diff) {
    if (!diff) return;
    initialLives = diff.initial_lives ?? 3;
    paddleWidth = diff.paddle_width ?? 140;
    ballSpeed = diff.ball_speed ?? 5;
    maxBallSpeed = diff.max_ball_speed ?? 9;
    speedupEvery = diff.speedup_every ?? 5;
    speedupAmount = diff.speedup_amount ?? 0.5;
    paddleSpeed = diff.paddle_speed ?? 8;

    // Применяем к текущей игре, если не в процессе
    if (currentScreen !== "game" || gameState === "start") {
        lives = initialLives;
        paddle.width = paddleWidth;
        paddle.x = Math.min(Math.max(paddle.x, 0), WIDTH - paddleWidth);
        if (paddle.x < 0 || paddle.x + paddle.width > WIDTH) {
            paddle.x = WIDTH / 2 - paddleWidth / 2;
        }
    }
}

// ------------------------
// АВТОРИЗАЦИЯ (через api.js)
// ------------------------
async function checkAuth() {
    const data = await getMe();
    if (data.authenticated && data.user) {
        currentUser = data.user;
        currentScreen = "menu";
        await loadDifficulties();
        await loadLevels();
        await loadLeaderboard();
    } else {
        currentUser = null;
        currentScreen = "auth";
    }
}

async function handleAuth() {
    if (authUsername.length < 3) {
        authError = "Логин должен быть от 3 символов";
        return;
    }
    if (authPassword.length < 6) {
        authError = "Пароль должен быть от 6 символов";
        return;
    }

    let result;
    if (authMode === "login") {
        result = await login(authUsername, authPassword);
    } else {
        result = await register(authUsername, authPassword);
    }

    if (result.token || result.user) {
        currentUser = result.user || { username: authUsername };
        authError = "";
        authUsername = "";
        authPassword = "";
        currentScreen = "menu";
        await loadDifficulties();
        await loadLevels();
        await loadLeaderboard();
    } else {
        authError = result.message || "Ошибка авторизации";
    }
}

async function handleLogout() {
    await logoutUser();
    currentUser = null;
    currentScreen = "auth";
    gameState = "start";
    authUsername = "";
    authPassword = "";
    authError = "";
    activeField = "username";
    authMode = "login";
}

// ------------------------
// РЕЙТИНГ
// ------------------------
async function loadLeaderboard() {
    const params = leaderboardDifficulty !== "all" ? `difficulty=${leaderboardDifficulty}` : "";
    const data = await getLeaderboard(params);
    leaderboardData = data.leaderboard || [];
}

// ------------------------
// ОТПРАВКА РЕЗУЛЬТАТА
// ------------------------
async function saveGameResult(result) {
    if (!currentUser) return;
    if (!gameStartTime) return;

    const durationSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    const maxBallsUsed = Math.max(1, balls.length);

    const resultData = {
        score: score,
        difficulty: currentDifficultySlug,
        level_reached: Math.min(currentLevelIndex + 1, levels.length || currentLevelIndex + 1),
        max_balls: maxBallsUsed,
        lives_left: lives,
        duration_seconds: durationSeconds,
        result: result
    };

    await saveScore(resultData);
    await loadLeaderboard();
}

// ------------------------
// ИГРОВАЯ ЛОГИКА
// ------------------------
function initGame() {
    score = 0;
    lives = initialLives;
    brokenBricksCount = 0;
    gameStartTime = Date.now();
    currentLevelIndex = 0;
    createBall();
    loadCurrentLevel();
}

function createBall() {
    const currentLevel = levels[currentLevelIndex];
    const ballsCount = currentLevel?.balls_count || 1;
    balls = [];
    for (let i = 0; i < ballsCount; i++) {
        balls.push({
            x: paddle.x + paddle.width / 2,
            y: paddle.y - BALL_RADIUS,
            dx: ballSpeed * (Math.random() > 0.5 ? 1 : -1),
            dy: -ballSpeed,
            radius: BALL_RADIUS,
            active: true,
            moving: false
        });
    }
}

function loadCurrentLevel() {
    if (!levels.length || currentLevelIndex >= levels.length) {
        winGame();
        return;
    }
    const level = levels[currentLevelIndex];
    createBricksFromLayout(level.layout);
}

function createBricksFromLayout(layout) {
    bricks = [];
    if (!Array.isArray(layout) || layout.length === 0 || !layout[0]) {
        console.error("Некорректный layout уровня:", layout);
        return;
    }
    const brickGap = 4;
    const bricksPerRow = layout[0].length;
    const totalGapsWidth = brickGap * (bricksPerRow + 1);
    const brickWidth = (WIDTH - totalGapsWidth) / bricksPerRow;
    const brickHeight = 28;
    const startX = brickGap;
    const startY = 70;

    const rowColors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#9400d3"];

    layout.forEach((row, r) => {
        const rowColor = rowColors[r % rowColors.length];
        [...row].forEach((cell, c) => {
            if (cell === ".") return;

            let health = 1;
            let points = 10;
            let color = rowColor;

            if (cell === "H") {
                health = 2;
                points = 20;
                color = "#ff6666";
            } else if (cell === "B") {
                health = 1;
                points = 15;
                color = "#66ff66";
            } else if (cell === "X") {
                health = 1;
                points = 10;
            }

            const x = startX + c * (brickWidth + brickGap) + brickGap;
            const y = startY + r * (brickHeight + brickGap) + brickGap;

            bricks.push({
                x, y,
                width: brickWidth,
                height: brickHeight,
                health: health,
                color: color,
                points: points,
                originalHealth: health
            });
        });
    });
}

function movePaddle() {
    if (currentScreen !== "game" || gameState !== "play") return;
    if (keys["ArrowLeft"] && paddle.x > 0) paddle.x -= paddleSpeed;
    if (keys["ArrowRight"] && paddle.x + paddle.width < WIDTH) paddle.x += paddleSpeed;
}

function moveBalls() {
    if (currentScreen !== "game" || gameState !== "play") return;

    let anyActive = false;
    for (let ball of balls) {
        if (!ball.active) continue;
        anyActive = true;
        if (ball.moving) {
            ball.x += ball.dx;
            ball.y += ball.dy;
        } else {
            ball.x = paddle.x + paddle.width / 2;
            ball.y = paddle.y - ball.radius;
            if (keys["Space"]) ball.moving = true;
        }
    }

    // Если все мячи неактивны — потеря жизни
    if (!anyActive && balls.length > 0) {
        lives--;
        if (lives > 0) {
            createBall();
        } else {
            gameState = "gameover";
            saveGameResult("lose");
        }
    }
}

function handleCollisions() {
    if (currentScreen !== "game" || gameState !== "play") return;

    for (let ball of balls) {
        if (!ball.active || !ball.moving) continue;

        // Стены
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) ball.dx *= -1;
        if (ball.y - ball.radius <= 0) ball.dy *= -1;

        // Платформа
        if (ball.y + ball.radius >= paddle.y &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width &&
            ball.dy > 0) {
            ball.dy = -Math.abs(ball.dy);
            let hitPos = (ball.x - paddle.x) / paddle.width;
            ball.dx = (hitPos - 0.5) * 8;
            if (Math.abs(ball.dx) < 2) ball.dx = ball.dx > 0 ? 2 : -2;
            if (Math.abs(ball.dx) > 7) ball.dx = ball.dx > 0 ? 7 : -7;
            ball.y = paddle.y - ball.radius;
        }

        // Кирпичи
        for (let i = 0; i < bricks.length; i++) {
            const brick = bricks[i];
            if (ball.x >= brick.x && ball.x <= brick.x + brick.width &&
                ball.y >= brick.y && ball.y <= brick.y + brick.height) {

                ball.dy *= -1;
                brick.health--;
                score += brick.points;
                brokenBricksCount++;

                // Ускорение мяча (но не выше maxBallSpeed)
                if (brokenBricksCount % speedupEvery === 0) {
                    let newSpeed = Math.abs(ball.dx) + speedupAmount;
                    if (newSpeed <= maxBallSpeed) {
                        ball.dx = ball.dx > 0 ? newSpeed : -newSpeed;
                    }
                    newSpeed = Math.abs(ball.dy) + speedupAmount;
                    if (newSpeed <= maxBallSpeed) {
                        ball.dy = ball.dy > 0 ? newSpeed : -newSpeed;
                    }
                }

                if (brick.health <= 0) {
                    bricks.splice(i, 1);
                    i--;
                }
                break;
            }
        }

        if (ball.y + ball.radius > HEIGHT) ball.active = false;
    }

    if (bricks.length === 0) {
        nextLevel();
    }
}

function nextLevel() {
    currentLevelIndex++;
    if (currentLevelIndex >= levels.length) {
        winGame();
    } else {
        createBall();
        loadCurrentLevel();
    }
}

function winGame() {
    gameState = "win";
    saveGameResult("win");
}

async function startGame() {
    menuError = "";

    if (!difficulties.length) {
        await loadDifficulties();
    }

    if (!levels.length) {
        await loadLevels();
    }

    if (!levels.length) {
        menuError = "Не удалось загрузить уровни с backend";
        currentScreen = "menu";
        return;
    }

    if (!difficulties.length) {
        menuError = "Не удалось загрузить сложности с backend";
        currentScreen = "menu";
        return;
    }

    gameState = "play";
    currentScreen = "game";
    initGame();
}

function restartGame() {
    gameState = "play";
    initGame();
}

function pauseGame() {
    if (gameState === "play") gameState = "pause";
    else if (gameState === "pause") gameState = "play";
}

// ------------------------
// ОТРИСОВКА ЭКРАНОВ
// ------------------------
function drawAuthScreen() {
    ctx.fillStyle = "#0a0a2a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("АРКАНОИД", WIDTH / 2, 80);

    ctx.font = "28px Arial";
    ctx.fillStyle = "#ff9800";
    ctx.fillText(authMode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ", WIDTH / 2, 160);

    // Поле логин
    ctx.fillStyle = activeField === "username" ? "#2a2a4a" : "#1a1a2a";
    roundedRect(WIDTH / 2 - 150, 200, 300, 45, 12);
    if (activeField === "username") {
        ctx.strokeStyle = "#ff9800";
        ctx.lineWidth = 2;
        roundedStrokeRect(WIDTH / 2 - 150, 200, 300, 45, 12);
    }
    ctx.fillStyle = "#888";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Логин:", WIDTH / 2 - 140, 190);
    ctx.fillStyle = "#0f0";
    ctx.font = "20px Arial";
    ctx.fillText(authUsername + (activeField === "username" ? "_" : ""), WIDTH / 2 - 130, 232);

    // Поле пароль
    ctx.fillStyle = activeField === "password" ? "#2a2a4a" : "#1a1a2a";
    roundedRect(WIDTH / 2 - 150, 270, 300, 45, 12);
    if (activeField === "password") {
        ctx.strokeStyle = "#ff9800";
        ctx.lineWidth = 2;
        roundedStrokeRect(WIDTH / 2 - 150, 270, 300, 45, 12);
    }
    ctx.fillStyle = "#888";
    ctx.fillText("Пароль:", WIDTH / 2 - 140, 260);
    ctx.fillStyle = "#0f0";
    let masked = "*".repeat(authPassword.length);
    ctx.fillText(masked + (activeField === "password" ? "_" : ""), WIDTH / 2 - 130, 302);

    if (authError) {
        ctx.fillStyle = "#f44";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(authError, WIDTH / 2, 360);
    }

    // Кнопка входа/регистрации
    ctx.fillStyle = "#4caf50";
    roundedRect(WIDTH / 2 - 120, 390, 240, 45, 12);
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(authMode === "login" ? "ВОЙТИ" : "ЗАРЕГИСТРИРОВАТЬСЯ", WIDTH / 2, 420);

    // Переключение режима
    ctx.fillStyle = "#555";
    roundedRect(WIDTH / 2 - 120, 450, 240, 40, 10);
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    if (authMode === "login") {
        ctx.fillText("📝 Нет аккаунта? Зарегистрироваться →", WIDTH / 2, 475);
    } else {
        ctx.fillText("← Уже есть аккаунт? Войти", WIDTH / 2, 475);
    }

    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    ctx.fillText("Клик на поле - выбор | Tab - переключение", WIDTH / 2, 520);
    ctx.fillText("↑ ↓ - переключить режим | Enter - подтвердить", WIDTH / 2, 545);
}

function drawMenuScreen() {
    ctx.fillStyle = "#0a0a2a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("АРКАНОИД", WIDTH / 2, 80);

    ctx.font = "20px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Выберите сложность:", WIDTH / 2, 160);

    // Кнопки сложностей из API
    const diffY = [190, 245, 300];
    difficulties.forEach((diff, idx) => {
        if (idx >= 3) return;
        const y = diffY[idx];
        ctx.fillStyle = currentDifficultySlug === diff.slug ? "#ff9800" : "#333";
        roundedRect(WIDTH / 2 - 100, y, 200, 40, 12);
        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(diff.name, WIDTH / 2, y + 28);
    });

    ctx.fillStyle = "#4caf50";
    roundedRect(WIDTH / 2 - 120, 365, 240, 50, 14);
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText("СТАРТ ИГРЫ", WIDTH / 2, 398);

    if (menuError) {
        ctx.fillStyle = "#ff6666";
        ctx.font = "14px Arial";
        ctx.fillText(menuError, WIDTH / 2, 345);
    }

    ctx.fillStyle = "#9c27b0";
    roundedRect(WIDTH / 2 - 120, 430, 240, 45, 12);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.fillText("ТАБЛИЦА РЕЙТИНГА", WIDTH / 2, 458);

    if (currentUser) {
        ctx.fillStyle = "#888";
        ctx.font = "16px Arial";
        ctx.fillText(`Игрок: ${currentUser.username}`, WIDTH / 2, 515);

        ctx.fillStyle = "#f44336";
        roundedRect(WIDTH / 2 - 60, 535, 120, 35, 10);
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText("ВЫЙТИ", WIDTH / 2, 558);
    }

    ctx.fillStyle = "#555";
    ctx.font = "12px Arial";
    ctx.fillText("← → - движение | Пробел - мяч | P - пауза | ESC - меню", WIDTH / 2, 620);
}

function drawGame() {
    ctx.fillStyle = "#0a0a2a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Платформа
    ctx.fillStyle = "#00bfff";
    roundedRect(paddle.x, paddle.y, paddle.width, paddle.height, 10);

    // Мячи
    for (let ball of balls) {
        if (!ball.active) continue;
        const grad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 3, ball.x, ball.y, ball.radius);
        grad.addColorStop(0, "#ffff66");
        grad.addColorStop(1, "#ffaa00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Кирпичи
    bricks.forEach(brick => {
        const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        grad.addColorStop(0, brick.color);
        grad.addColorStop(1, adjustBrightness(brick.color, -30));
        ctx.fillStyle = grad;
        roundedRect(brick.x, brick.y, brick.width, brick.height, 6);

        if (brick.health > 1) {
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(brick.health, brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
        }
    });

    // Интерфейс
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Счет: ${score}`, 15, 30);
    ctx.fillText(`Жизни: ${lives}`, 15, 55);
    ctx.fillText(`Уровень: ${currentLevelIndex + 1}`, 15, 80);

    const currentDiff = difficulties.find(d => d.slug === currentDifficultySlug);
    if (currentDiff) {
        ctx.fillStyle = "#ff9800";
        ctx.fillText(`Сложность: ${currentDiff.name}`, 15, 105);
    }

    if (currentUser) {
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffd700";
        ctx.fillText(currentUser.username, WIDTH - 15, 30);
        ctx.textAlign = "left";
    }

    const anyMoving = balls.some(b => b.moving);
    if (!anyMoving && gameState === "play") {
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffdd44";
        ctx.fillText("⚡ Нажмите ПРОБЕЛ ⚡", WIDTH / 2, HEIGHT - 25);
    }
}

function drawPauseScreen() {
    drawGame();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "yellow";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("⏸ ПАУЗА ⏸", WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Нажмите P для продолжения", WIDTH / 2, HEIGHT / 2 + 60);
}

function drawWinScreen() {
    ctx.fillStyle = "#0a0a2a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#4caf50";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆 ПОБЕДА! 🏆", WIDTH / 2, HEIGHT / 3);
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText(`Счет: ${score}`, WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("R - новая игра | ESC - меню", WIDTH / 2, HEIGHT / 2 + 80);
}

function drawGameOverScreen() {
    ctx.fillStyle = "#0a0a2a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#f44336";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("💀 GAME OVER 💀", WIDTH / 2, HEIGHT / 3);
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText(`Счет: ${score}`, WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px Arial";
    ctx.fillStyle = "#aaa";
    ctx.fillText("R - новая игра | ESC - меню", WIDTH / 2, HEIGHT / 2 + 80);
}

function drawLeaderboardScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.95)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "gold";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏆 ТАБЛИЦА РЕЙТИНГА 🏆", WIDTH / 2, 50);

    const filters = ["all", "easy", "normal", "hard"];
    const filterNames = { all: "Все", easy: "Легкая", normal: "Нормальная", hard: "Сложная" };
    filters.forEach((f, i) => {
        const x = WIDTH / 2 - 180 + i * 100;
        ctx.fillStyle = leaderboardDifficulty === f ? "#ff9800" : "#333";
        roundedRect(x, 70, 90, 30, 8);
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(filterNames[f], x + 45, 92);
    });

    if (leaderboardData.length === 0) {
        ctx.fillStyle = "#888";
        ctx.font = "20px Arial";
        ctx.fillText("Нет результатов", WIDTH / 2, HEIGHT / 2);
    } else {
        ctx.font = "13px Arial";
        let y = 120;
        ctx.fillStyle = "#ff9800";
        ctx.fillText("#", WIDTH / 2 - 230, y);
        ctx.fillText("Игрок", WIDTH / 2 - 170, y);
        ctx.fillText("Счет", WIDTH / 2 - 80, y);
        ctx.fillText("Сложность", WIDTH / 2 + 20, y);
        ctx.fillText("Уровень", WIDTH / 2 + 120, y);
        y += 25;

        leaderboardData.slice(0, 10).forEach((entry, i) => {
            ctx.fillStyle = i < 3 ? "#ffd700" : "#ccc";
            ctx.fillText(`${entry.place || i + 1}`, WIDTH / 2 - 230, y + i * 28);
            ctx.fillText((entry.username || "?").substring(0, 12), WIDTH / 2 - 170, y + i * 28);
            ctx.fillText(entry.score, WIDTH / 2 - 80, y + i * 28);
            ctx.fillText(filterNames[entry.difficulty] || entry.difficulty, WIDTH / 2 + 20, y + i * 28);
            ctx.fillText(entry.level_reached, WIDTH / 2 + 120, y + i * 28);
        });
    }

    ctx.fillStyle = "#888";
    ctx.font = "14px Arial";
    ctx.fillText("Нажмите ESC для закрытия", WIDTH / 2, HEIGHT - 30);
}

// ------------------------
// ОБРАБОТКА СОБЫТИЙ
// ------------------------
document.addEventListener("keydown", async (e) => {
    // Записываем нажатия для физических клавиш
    if (e.code === "Space") {
        keys["Space"] = true;
    } else {
        keys[e.key] = true;
    }

    if (currentScreen === "auth") {
        if (e.key === "Tab") {
            e.preventDefault();
            activeField = activeField === "username" ? "password" : "username";
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            authMode = authMode === "login" ? "register" : "login";
            authError = "";
        } else if (e.key === "Enter") {
            if (authUsername.length > 0 && authPassword.length > 0) await handleAuth();
            else if (authUsername.length === 0) {
                activeField = "username";
                authError = "Введите логин";
            } else {
                activeField = "password";
                authError = "Введите пароль";
            }
        } else if (e.key === "Backspace") {
            if (activeField === "username") authUsername = authUsername.slice(0, -1);
            else authPassword = authPassword.slice(0, -1);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && e.key !== " ") {
            if (activeField === "username") authUsername += e.key;
            else authPassword += e.key;
        }
        return;
    }

    if (currentScreen === "leaderboard") {
        if (e.key === "Escape") {
            currentScreen = "menu";
        }
        return;
    }

    if (currentScreen === "menu") {
        if (e.key === "Enter") await startGame();
        return;
    }

    if (currentScreen === "game") {
        if (e.code === "KeyP") pauseGame();
        if (e.code === "Escape") {
            gameState = "start";
            currentScreen = "menu";
        }
        if (e.code === "KeyR" && (gameState === "win" || gameState === "gameover")) {
            restartGame();
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
        keys["Space"] = false;
    } else {
        keys[e.key] = false;
    }
});

canvas.addEventListener("click", async (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (currentScreen === "auth") {
        if (mouseX >= WIDTH / 2 - 150 && mouseX <= WIDTH / 2 + 150) {
            if (mouseY >= 200 && mouseY <= 245) {
                activeField = "username";
                authError = "";
                return;
            }
            if (mouseY >= 270 && mouseY <= 315) {
                activeField = "password";
                authError = "";
                return;
            }
        }
        if (mouseX >= WIDTH / 2 - 120 && mouseX <= WIDTH / 2 + 120) {
            if (mouseY >= 390 && mouseY <= 435) {
                if (authUsername.length > 0 && authPassword.length > 0) await handleAuth();
                else if (authUsername.length === 0) {
                    activeField = "username";
                    authError = "Введите логин";
                } else {
                    activeField = "password";
                    authError = "Введите пароль";
                }
                return;
            }
            if (mouseY >= 450 && mouseY <= 490) {
                authMode = authMode === "login" ? "register" : "login";
                authError = "";
                return;
            }
        }
        return;
    }

    if (currentScreen === "menu") {
        // Выбор сложности
        const diffY = [190, 245, 300];
        for (let idx = 0; idx < difficulties.length && idx < 3; idx++) {
            if (mouseX >= WIDTH / 2 - 100 && mouseX <= WIDTH / 2 + 100 &&
                mouseY >= diffY[idx] && mouseY <= diffY[idx] + 40) {
                currentDifficultySlug = difficulties[idx].slug;
                applyDifficultySettings(difficulties[idx]);
                return;
            }
        }
        // Кнопка старта
        if (mouseX >= WIDTH / 2 - 120 && mouseX <= WIDTH / 2 + 120) {
            if (mouseY >= 365 && mouseY <= 415) {
                await startGame();
                return;
            }
            if (mouseY >= 430 && mouseY <= 475) {
                currentScreen = "leaderboard";
                await loadLeaderboard();
                return;
            }
        }
        // Выход
        if (currentUser && mouseX >= WIDTH / 2 - 60 && mouseX <= WIDTH / 2 + 60 && mouseY >= 535 && mouseY <= 570) {
            await handleLogout();
        }
    }

    if (currentScreen === "leaderboard") {
        const filters = ["all", "easy", "normal", "hard"];
        filters.forEach(async (f, i) => {
            const x = WIDTH / 2 - 180 + i * 100;
            if (mouseX >= x && mouseX <= x + 90 && mouseY >= 70 && mouseY <= 100) {
                leaderboardDifficulty = f;
                await loadLeaderboard();
            }
        });
    }
});

// ------------------------
// СТАРТ ПРИЛОЖЕНИЯ
// ------------------------
async function initApp() {
    await checkAuth();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (currentScreen === "auth") drawAuthScreen();
    else if (currentScreen === "leaderboard") drawLeaderboardScreen();
    else if (currentScreen === "menu") drawMenuScreen();
    else if (currentScreen === "game") {
        movePaddle();
        moveBalls();
        handleCollisions();
        switch (gameState) {
            case "play": drawGame(); break;
            case "pause": drawPauseScreen(); break;
            case "win": drawWinScreen(); break;
            case "gameover": drawGameOverScreen(); break;
        }
    }
    requestAnimationFrame(gameLoop);
}

initApp();