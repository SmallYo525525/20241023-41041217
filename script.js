const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

// 擋板參數
const paddleWidth = 100;
const paddleHeight = 20;
let paddleX = (canvas.width - paddleWidth) / 2;

// 磚塊參數
const brickWidth = 75;
const brickHeight = 20;
const bricks = [];

// 遊戲難度設定
const difficultySettings = {
    easy: { rows: 3, columns: 9, ballSpeed: { dx: 2, dy: -2 } },
    medium: { rows: 4, columns: 9, ballSpeed: { dx: 3, dy: -3 } },
    hard: { rows: 5, columns: 9, ballSpeed: { dx: 4, dy: -4 } }
};

// 隨機生成數字的機率
const numberChance = 0.2; // 中等和困難的數字磚塊機率
const hardNumberChance = 0.1; // 僅困難模式數字三的機率

// 球參數
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2; // 初始 dx
let dy = -2; // 初始 dy

// 控制擋板
let rightPressed = false;
let leftPressed = false;

// 分數參數
let score = 0;

// 計算磚塊的起始 x 坐標，使其水平居中
function initializeBricks() {
    const { rows, columns } = difficultySettings[difficulty];
    const totalBricksWidth = columns * (brickWidth + 10) - 10;
    const startX = (canvas.width - totalBricksWidth) / 2;
    let startY = 30;

    for (let c = 0; c < columns; c++) {
        bricks[c] = [];
        for (let r = 0; r < rows; r++) {
            let hasNumber = null;
            if (difficulty === 'medium' && Math.random() < numberChance) {
                hasNumber = { value: 2, hitsRequired: 2 }; // 中等難度數字2
            } else if (difficulty === 'hard') {
                if (Math.random() < hardNumberChance) {
                    hasNumber = { value: 3, hitsRequired: 3 }; // 數字3需要3次擊中
                } else if (Math.random() < numberChance) {
                    hasNumber = { value: 2, hitsRequired: 2 }; // 數字2需要2次擊中
                }
            }
            bricks[c][r] = { 
                x: startX + c * (brickWidth + 10), 
                y: startY + r * (brickHeight + 10), 
                status: 1,
                number: hasNumber
            };
        }
    }
}

function drawPaddle() {
    context.beginPath();
    context.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    context.fillStyle = "#0095DD";
    context.fill();
    context.closePath();
}

function drawBricks() {
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                context.beginPath();
                context.rect(b.x, b.y, brickWidth, brickHeight);
                context.fillStyle = "#0095DD";
                context.fill();
                context.closePath();

                // 繪製數字
                if (b.number !== null) {
                    context.fillStyle = "#FFFFFF";
                    context.font = "16px Arial";
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillText(b.number.hitsRequired, b.x + brickWidth / 2, b.y + brickHeight / 2);
                }
            }
        }
    }
}

function drawBall() {
    context.beginPath();
    context.arc(x, y, ballRadius, 0, Math.PI * 2);
    context.fillStyle = "#0095DD";
    context.fill();
    context.closePath();
}

function updateScoreDisplay() {
    document.getElementById('scoreDisplay').innerText = "分數: " + score;
}

function collisionDetection() {
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    if (b.number) {
                        b.number.hitsRequired--; // 每次擊中減少所需擊中次數
                        if (b.number.hitsRequired <= 0) {
                            score += b.number.value; // 加分
                            b.status = 0; // 消除磚塊
                        }
                    } else {
                        score++; // 普通磚塊加分
                        b.status = 0; // 消除磚塊
                    }
                    updateScoreDisplay();
                }
            }
        }
    }

    // 擋板碰撞
    if (x > paddleX && x < paddleX + paddleWidth && y + ballRadius > canvas.height - paddleHeight) {
        dy = -dy;
    }
}

function gameOver() {
    clearInterval(interval);
    swal.fire({
        title: "遊戲結束",
        text: "你的得分是: " + score,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: '重新開始',
        cancelButtonText: '退出'
    }).then((result) => {
        if (result.isConfirmed) {
            resetGame();
        } else {
            document.location.reload();
        }
    });
}

function checkGameEnd() {
    const allBricksBroken = bricks.every(column => column.every(brick => brick.status === 0));
    if (y + dy > canvas.height - ballRadius || allBricksBroken) {
        gameOver();
    }
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();

    // 鍵盤控制擋板
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    }

    checkGameEnd();
}

let interval;

function resetGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    const { ballSpeed } = difficultySettings[difficulty]; // 取得當前難度的球速
    dx = ballSpeed.dx;
    dy = ballSpeed.dy;
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    updateScoreDisplay();
    initializeBricks();
    interval = setInterval(draw, 10);
}

// 選擇難度
function setDifficulty(selectedDifficulty) {
    difficulty = selectedDifficulty;
    initializeBricks();
    document.getElementById('startButtonContainer').classList.remove('d-none');
}

// 設置按鈕事件
document.getElementById('easyButton').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('mediumButton').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('hardButton').addEventListener('click', () => setDifficulty('hard'));

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('menu').classList.add('d-none');
    document.getElementById('gameArea').classList.remove('d-none');
    resetGame(); // 開始新的遊戲
});

// 控制擋板的移動
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') rightPressed = true;
    else if (event.key === 'ArrowLeft') leftPressed = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowRight') rightPressed = false;
    else if (event.key === 'ArrowLeft') leftPressed = false;
});

// 使用滑鼠控制擋板
canvas.addEventListener('mousemove', (event) => {
    const relativeX = event.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2; // 讓擋板跟隨滑鼠位置
    }
});
