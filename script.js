const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
let currentLevel = 1;
const totalLevels = 5; // 總關卡數

// 擋板參數
const paddleWidth = 100;
const paddleHeight = 20;
let paddleX = (canvas.width - paddleWidth) / 2;

// 磚塊參數
const brickWidth = 75;
const brickHeight = 20;
const bricks = [];

let difficulty = 'easy'; // 全域宣告難度變數
// 遊戲難度設定
const difficultySettings = {
    easy: { rows: 3, columns: 9, ballSpeed: { dx: 3, dy: -3 }, brickProbability: 0.6 },
    medium: { rows: 4, columns: 9, ballSpeed: { dx: 3.5, dy: -3.5 }, brickProbability: 0.7 },
    hard: { rows: 5, columns: 9, ballSpeed: { dx: 4, dy: -4 }, brickProbability: 0.7 }
};


// 隨機生成數字的機率
const numberChance = 0.4; // 中等和困難的數字磚塊機率
const hardNumberChance = 0.4; // 僅困難模式數字三的機率

// 生命數參數
let lives = 100;

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

// 繪製顏色對應的數字方塊
function getBrickColor(value) {
    switch (value) {
        case 1:
            return "#0095DD"; // 預設顏色
        case 2:
            return "#FFA500"; // 橘色
        case 3:
            return "#FF0000"; // 紅色
        default:
            return "#0095DD"; // 普通磚塊顏色
    }
}

// 生成磚塊
function initializeBricks() {
    bricks.length = 0; // 確保每次重新初始化前清空
    const { rows, columns, brickProbability } = difficultySettings[difficulty];
    const totalBricksWidth = columns * (brickWidth + 10) - 10;
    const startX = (canvas.width - totalBricksWidth) / 2;
    let startY = 30;

    for (let c = 0; c < columns; c++) {
        bricks[c] = [];
        for (let r = 0; r < rows; r++) {
            let hasNumber = null;

            // 根據難度的磚塊生成機率決定是否生成磚塊
            if (Math.random() < brickProbability) {
                // 如果生成磚塊，決定是否為數字磚塊
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
            } else {
                // 如果不生成磚塊，則狀態設為0（不顯示）
                bricks[c][r] = { 
                    x: startX + c * (brickWidth + 10), 
                    y: startY + r * (brickHeight + 10), 
                    status: 0, // 磚塊不顯示
                    number: null 
                };
            }
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
                context.fillStyle = getBrickColor(b.number ? b.number.value : 0);
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

let ballTrail = []; // 儲存尾跡的位置

function drawBall() {
    // 繪製尾跡
    for (let i = 0; i < ballTrail.length; i++) {
        context.beginPath();
        context.arc(ballTrail[i].x, ballTrail[i].y, ballRadius, 0, Math.PI * 2);
        const opacity =  (i / ballTrail.length);

        context.fillStyle = `rgba(147, 255, 147, ${opacity})`; // 綠色尾跡
        context.fill();
        context.closePath();
    }

    context.beginPath();
    context.arc(x, y, ballRadius, 0, Math.PI * 2);
    context.fillStyle = "#00BB00"; // 深綠色球
    context.fill();
    context.closePath();

    // 將當前球的位置添加到尾跡
    ballTrail.push({ x, y });
    if (ballTrail.length > 10) {
        ballTrail.shift(); // 限制尾跡長度
    }
}

function updateScoreDisplay() {
    document.getElementById('scoreDisplay').innerText = "分數: " + score + " 生命數: " + lives;
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
                        } else {
                            // 更新顏色根據數字
                            if (b.number.value === 3) {
                                b.number.value = 2; // 變為數字2
                            } else if (b.number.value === 2) {
                                b.number.value = 1; // 變為數字1
                            }
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

function gameWin() {
    clearInterval(interval);
    swal.fire({
        title: "你贏了！",
        text: "你的總得分是: " + score,
        icon: "success",
        showCancelButton: true,
        cancelButtonText: '退出'
    }).then((result) => {
        if (result.isConfirmed) {
            document.location.reload(); // 退出遊戲
        }
    });
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

function nextGame() {
    clearInterval(interval);

    swal.fire({
        title: "恭喜通過關卡 " + (currentLevel-1),
        text: "你的得分是: " + score,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: '進入下一關',
        cancelButtonText: '退出'
    }).then((result) => {
        if (result.isConfirmed) {
            // 計算新的行數
            const newRows = Math.ceil(difficultySettings[difficulty].rows + 0.5);
            difficultySettings[difficulty].rows = newRows; // 更新行數
            document.getElementById('levelNumber').innerText = "關卡 " + currentLevel; // 更新關卡顯示
            if (currentLevel <= totalLevels) {
                resetGame(); // 重置遊戲以開始下一關
            } else {
                gameWin(); // 通過所有關卡時顯示遊戲勝利
            }
        } else {
            document.location.reload(); // 退出遊戲
        }
    });
}

let isGameOver = false;
function checkGameEnd() {
    if (isGameOver) return; // 如果遊戲已結束，直接返回

    const allBricksBroken = bricks.every(column => column.every(brick => brick.status === 0));
    if (allBricksBroken) {
        // 增加關卡數
        currentLevel++;
        if (currentLevel <= totalLevels) {
            nextGame(); // 進入下一關
        } else {
            gameWin(); // 如果已通過所有關卡，顯示遊戲勝利
        }
        
    } else if (y + dy > canvas.height - ballRadius) {
        lives--; // 減少生命數
        if (lives <= 0) {

            isGameOver = true;
            gameOver(); // 如果生命數為0，則遊戲結束
        } else {
            resetBall(); // 如果還有生命，重置球的位置
            updateScoreDisplay()
        }
    }
}

function resetBall() {
    x = paddleX + paddleWidth / 2; // 將球放在擋板中間位置
    y = canvas.height - paddleHeight - ballRadius; // 在擋板上方
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
    // 重置生命數
    lives = 100;
    isGameOver = false; // 重置遊戲狀態
    updateScoreDisplay();
    x = canvas.width / 2;
    y = canvas.height - 30;
    const { ballSpeed } = difficultySettings[difficulty]; // 取得當前難度的球速
    dx = ballSpeed.dx;
    dy = ballSpeed.dy;
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    updateScoreDisplay();
    ballTrail = []; // 重置尾跡
    initializeBricks();
    interval = setInterval(draw, 10);
}

function setDifficulty(selectedDifficulty) {
    difficulty = selectedDifficulty;
    initializeBricks();
    document.getElementById('startButtonContainer').classList.remove('d-none');
}


let selectedDifficulty = null;
let selectedTheme = null;

// 設置主題按鈕事件
document.getElementById('cityThemeButton').addEventListener('click', () => {
    selectedTheme = "city";
    updateButtonSelection('theme');
    checkStartButtonState();
});

document.getElementById('oceanThemeButton').addEventListener('click', () => {
    selectedTheme = "ocean";
    updateButtonSelection('theme');
    checkStartButtonState();
});

document.getElementById('spaceThemeButton').addEventListener('click', () => {
    selectedTheme = "space";
    updateButtonSelection('theme');
    checkStartButtonState();
});

document.getElementById('startButton').addEventListener('click', () => {
    // 設定背景圖片
    if (selectedTheme === "city") {
        document.body.style.backgroundImage = "url('./image/都市.jpg')";
    } else if (selectedTheme === "ocean") {
        document.body.style.backgroundImage = "url('./image/海洋.jpg')";
    } else if (selectedTheme === "space") {
        document.body.style.backgroundImage = "url('./image/宇宙.jpg')";
    }

    document.getElementById('menu').classList.add('d-none');
    document.getElementById('gameArea').classList.remove('d-none');
    resetGame();
});

// 設置難度按鈕事件
document.getElementById('easyButton').addEventListener('click', () => {
    selectedDifficulty = 'easy';
    difficulty = 'easy';
    updateButtonSelection('difficulty');
    checkStartButtonState();
});

document.getElementById('mediumButton').addEventListener('click', () => {
    selectedDifficulty = 'medium';
    difficulty = 'medium';
    updateButtonSelection('difficulty');
    checkStartButtonState();
});

document.getElementById('hardButton').addEventListener('click', () => {
    selectedDifficulty = 'hard';
    difficulty = 'hard';
    updateButtonSelection('difficulty');
    checkStartButtonState();
});

// 檢查開始按鈕狀態
function checkStartButtonState() {
    const startButton = document.getElementById('startButton');
    if (selectedDifficulty && selectedTheme) {
        startButton.disabled = false; // 使按鈕可點擊
    } else {
        startButton.disabled = true; // 使按鈕不可點擊
    }
}

// 更新按鈕選擇狀態
function updateButtonSelection(type) {
    const difficultyButtons = document.querySelectorAll('.difficulty-container .btn');
    const themeButtons = document.querySelectorAll('.theme-container .btn');

    if (type === 'difficulty') {
        difficultyButtons.forEach(button => {
            button.classList.remove('selected'); // 移除所有難度按鈕的選擇效果
        });
        const selectedButton = Array.from(difficultyButtons).find(button => button.name === selectedDifficulty);
        if (selectedButton) {
            selectedButton.classList.add('selected'); // 為選擇的按鈕添加效果
        }
    } else if (type === 'theme') {
        themeButtons.forEach(button => {
            button.classList.remove('selected'); // 移除所有主題按鈕的選擇效果
        });
        const selectedButton = Array.from(themeButtons).find(button => button.id.includes(selectedTheme));
        if (selectedButton) {
            selectedButton.classList.add('selected'); // 為選擇的按鈕添加效果
        }
    }
}



// 控制擋板
document.addEventListener('mousemove', (event) => {
    const relativeX = event.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        
        
        paddleX = relativeX - paddleWidth / 2; // 讓擋板跟隨滑鼠位置
        
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') rightPressed = true;
    else if (event.key === 'ArrowLeft') leftPressed = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowRight') rightPressed = false;
    else if (event.key === 'ArrowLeft') leftPressed = false;
});


// 一鍵消除
function clearBricks() {
    console.log("1")
    for (let c = 0; c < bricks.length; c++) {
        for (let r = 0; r < bricks[c].length; r++) {
            bricks[c][r].status = 0; // 將所有磚塊狀態設為 0
        }
    }
    updateScoreDisplay(); // 更新分數顯示
}
document.getElementById('clearBricksButton').addEventListener('click', clearBricks);
