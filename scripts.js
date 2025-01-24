// 游戏配置
const GAME_CONFIG = {
    GAME_DURATION: 30,
    ITEM_SPAWN_INTERVAL: 300,
    BOMB_SPAWN_INTERVAL: 5000,
    ITEM_FALL_SPEED: 3,
    PLAYER_SPEED: 25,
    PLAYER_TOUCH_SENSITIVITY: 1.5,
    SCORE_PER_ITEM: 10,
    PLAYER_SIZE: 150,
    PLAYER_BOTTOM_MARGIN: 20,
    PLAYER_HITBOX_ADJUST: 30,
    ITEM_SIZE: 50,
    BOMB_SIZE: 60,
    INITIAL_FALL_SPEED: 2,     // 初始掉落速度
    MAX_FALL_SPEED: 8,         // 最大掉落速度
    SPEED_INCREMENT: 0.1,      // 每秒增加的速度
    INITIAL_SPAWN_INTERVAL: 800, // 初始生成间隔
    MIN_SPAWN_INTERVAL: 200,    // 最小生成间隔
    SPAWN_INTERVAL_DECREMENT: 20 // 每秒减少的生成间隔
};

// 资源管理器
class ResourceManager {
    constructor() {
        this.imageCache = {};
        this.audioCache = {};
        this.totalResources = 0;
        this.loadedResources = 0;
    }

    async loadResources() {
        const images = {
            'welcome_background': 'image/welcome_background.jpeg',
            'game_background': 'image/game_background.jpeg',
            'user': 'image/user.png',
            'yuanbao': 'image/yuanbao.png',
            'hongbao': 'image/hongbao.png',
            'fudai': 'image/fudai.png',
            'jintiao': 'image/jintiao.png',
            'zhuanshi': 'image/zhuanshi.png',
            'zhihongbao': 'image/zhihongbao.png',
            'dahongbao': 'image/dahongbao.png',
            'bomb': 'image/bomb.png'
        };

        const sounds = {
            'background': 'music/background_music.mp3',
            'button': 'music/button.mp3',
            'collect1': 'music/music1.mp3',
            'collect2': 'music/music2.mp3',
            'collect3': 'music/music3.mp3',
            'collect4': 'music/music4.mp3',
            'bomb': 'music/bomb.mp3'
        };

        this.totalResources = Object.keys(images).length + Object.keys(sounds).length;

        try {
            await Promise.all([
                ...Object.entries(images).map(([key, url]) => this.loadImage(key, url)),
                ...Object.entries(sounds).map(([key, url]) => this.loadAudio(key, url))
            ]);
            return true;
        } catch (error) {
            console.error('Resource loading failed:', error);
            return false;
        }
    }

    loadImage(key, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.imageCache[key] = img;
                this.updateProgress();
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    loadAudio(key, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.audioCache[key] = audio;
                this.updateProgress();
                resolve();
            };
            audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
            audio.src = url;
        });
    }

    updateProgress() {
        this.loadedResources++;
        const progress = (this.loadedResources / this.totalResources) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
    }
}

// 游戏主类
class Game {
    constructor() {
        this.resourceManager = new ResourceManager();
        this.canvas = document.querySelector('#gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.items = [];
        this.score = 0;
        this.gameTimer = null;
        this.isGameRunning = false;
        this.lastTime = 0;
        this.fps = 0;
        this.fpsUpdateInterval = null;
        this.playerVelocity = 0;
        this.lastFrameTime = 0;
        this.isMouseControlling = false;
        this.currentFallSpeed = GAME_CONFIG.INITIAL_FALL_SPEED;
        this.currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;
        this.elapsedTime = 0;

        this.initializeEventListeners();
    }

    async initialize() {
        const loadingSuccess = await this.resourceManager.loadResources();
        if (!loadingSuccess) {
            alert('资源加载失败，请刷新重试！');
            return;
        }

        document.querySelector('.loading-screen').style.display = 'none';
        document.querySelector('.welcome-page').style.display = 'flex';
    }

    initializeEventListeners() {
        // 修改开始按钮点击事件，使用事件委托来处理所有 start-button 类的按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('start-button')) {
                // 如果结算弹窗显示中，先隐藏它
                const resultModal = document.querySelector('.result-modal');
                if (resultModal.style.display === 'flex') {
                    resultModal.style.display = 'none';
                }
                this.startGame();
            }
        });

        // 改进键盘控制，支持平滑移动
        let keysPressed = new Set();
        
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;
            keysPressed.add(e.keyCode);
            
            if (keysPressed.has(37)) { // 左箭头
                this.playerVelocity = -GAME_CONFIG.PLAYER_SPEED;
            } else if (keysPressed.has(39)) { // 右箭头
                this.playerVelocity = GAME_CONFIG.PLAYER_SPEED;
            }
        });

        document.addEventListener('keyup', (e) => {
            keysPressed.delete(e.keyCode);
            if (!keysPressed.has(37) && !keysPressed.has(39)) {
                this.playerVelocity = 0;
            }
        });

        // 改进触摸控制
        let lastTouchX = 0;
        let touchStartX = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isGameRunning) return;
            touchStartX = e.touches[0].clientX;
            lastTouchX = touchStartX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isGameRunning) return;
            e.preventDefault();
            
            const currentX = e.touches[0].clientX;
            const deltaX = (currentX - lastTouchX) * GAME_CONFIG.PLAYER_TOUCH_SENSITIVITY;
            lastTouchX = currentX;
            
            const playerElement = document.querySelector('.player');
            const currentLeft = parseFloat(playerElement.style.left) || (window.innerWidth - GAME_CONFIG.PLAYER_SIZE) / 2;
            let newLeft = currentLeft + deltaX;
            
            // 限制在屏幕范围内
            newLeft = Math.max(0, Math.min(window.innerWidth - GAME_CONFIG.PLAYER_SIZE, newLeft));
            
            playerElement.style.left = `${newLeft}px`;
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.playerVelocity = 0;
        });

        // 添加鼠标控制
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isGameRunning) return;
            this.isMouseControlling = true;
            this.handleMouseMove(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isGameRunning || !this.isMouseControlling) return;
            this.handleMouseMove(e);
        });

        document.addEventListener('mouseup', () => {
            this.isMouseControlling = false;
            this.playerVelocity = 0;
        });

        // 防止拖动时选中文本
        document.addEventListener('selectstart', (e) => {
            if (this.isGameRunning) {
                e.preventDefault();
            }
        });
    }

    handleMouseMove(e) {
        const playerElement = document.querySelector('.player');
        const playerWidth = GAME_CONFIG.PLAYER_SIZE;
        const maxLeft = window.innerWidth - playerWidth;
        
        // 计算玩家应该移动到的位置
        // 鼠标位置减去玩家宽度的一半，使玩家中心跟随鼠标
        let targetX = e.clientX - (playerWidth / 2);
        
        // 限制在屏幕范围内
        targetX = Math.max(0, Math.min(maxLeft, targetX));
        
        // 平滑移动到目标位置
        const currentLeft = parseFloat(playerElement.style.left) || (window.innerWidth - playerWidth) / 2;
        const distance = targetX - currentLeft;
        
        // 根据距离设置移动速度
        if (Math.abs(distance) > 1) {
            this.playerVelocity = Math.sign(distance) * Math.min(Math.abs(distance), GAME_CONFIG.PLAYER_SPEED);
        } else {
            this.playerVelocity = 0;
            playerElement.style.left = `${targetX}px`;
        }
    }

    startGame() {
        // 隐藏欢迎页面，显示游戏页面
        document.querySelector('.welcome-page').style.display = 'none';
        document.querySelector('.game-page').style.display = 'block';

        // 重置游戏状态
        this.resetGame();

        // 调整画布大小
        this.resizeCanvas();

        // 开始游戏循环
        this.isGameRunning = true;
        this.gameLoop();

        // 开始生成物品
        this.currentFallSpeed = GAME_CONFIG.INITIAL_FALL_SPEED;
        this.currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;
        this.elapsedTime = 0;
        this.startItemGeneration();
        this.startSpeedProgression();

        // 开始倒计时
        this.startTimer();

        // 播放背景音乐
        this.playBackgroundMusic();
    }

    resetGame() {
        this.score = 0;
        this.items = [];
        this.updateScore(0);
        document.querySelector('#time').textContent = GAME_CONFIG.GAME_DURATION;
        
        // 重置玩家位置，考虑底部边距
        const playerElement = document.querySelector('.player');
        playerElement.style.left = `${(window.innerWidth - GAME_CONFIG.PLAYER_SIZE) / 2}px`;
        playerElement.style.bottom = `${GAME_CONFIG.PLAYER_BOTTOM_MARGIN}px`; // 设置底部距离
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startItemGeneration() {
        // 使用当前的生成间隔
        this.itemGenerationTimer = setInterval(() => {
            if (!this.isGameRunning) return;
            this.generateItem();
        }, this.currentSpawnInterval);

        // 炸弹生成间隔保持不变
        this.bombGenerationTimer = setInterval(() => {
            if (!this.isGameRunning) return;
            this.generateBomb();
        }, GAME_CONFIG.BOMB_SPAWN_INTERVAL);
    }

    generateItem() {
        const items = ['yuanbao', 'hongbao', 'fudai', 'jintiao', 'zhuanshi', 'zhihongbao', 'dahongbao'];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const x = Math.random() * (this.canvas.width - GAME_CONFIG.ITEM_SIZE);
        
        this.items.push({
            type: randomItem,
            x: x,
            y: 0,
            width: GAME_CONFIG.ITEM_SIZE,
            height: GAME_CONFIG.ITEM_SIZE,
            isBomb: false
        });
    }

    generateBomb() {
        this.items.push({
            type: 'bomb',
            x: Math.random() * (this.canvas.width - GAME_CONFIG.BOMB_SIZE),
            y: 0,
            width: GAME_CONFIG.BOMB_SIZE,
            height: GAME_CONFIG.BOMB_SIZE,
            isBomb: true
        });
    }

    gameLoop(timestamp) {
        if (!this.isGameRunning) return;

        // 计算帧时间差
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // 更新玩家位置
        if (this.playerVelocity !== 0) {
            const playerElement = document.querySelector('.player');
            const currentLeft = parseFloat(playerElement.style.left) || (window.innerWidth - GAME_CONFIG.PLAYER_SIZE) / 2;
            let newLeft = currentLeft + (this.playerVelocity * deltaTime / 16);
            
            // 限制在屏幕范围内
            newLeft = Math.max(0, Math.min(window.innerWidth - GAME_CONFIG.PLAYER_SIZE, newLeft));
            
            playerElement.style.left = `${newLeft}px`;
        }

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制所有物品
        this.updateItems();

        // 检测碰撞
        this.checkCollisions();

        // 继续游戏循环
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    updateItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            // 使用当前的掉落速度
            item.y += this.currentFallSpeed;

            // 绘制物品
            const image = this.resourceManager.imageCache[item.type];
            this.ctx.drawImage(image, item.x, item.y, item.width, item.height);

            // 移除超出屏幕的物品
            if (item.y > this.canvas.height) {
                this.items.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        const playerElement = document.querySelector('.player');
        const playerRect = {
            x: parseFloat(playerElement.style.left) || (window.innerWidth - GAME_CONFIG.PLAYER_SIZE) / 2,
            y: this.canvas.height - GAME_CONFIG.PLAYER_SIZE - GAME_CONFIG.PLAYER_BOTTOM_MARGIN,
            width: GAME_CONFIG.PLAYER_SIZE - GAME_CONFIG.PLAYER_HITBOX_ADJUST, // 缩小碰撞箱宽度
            height: GAME_CONFIG.PLAYER_SIZE - GAME_CONFIG.PLAYER_HITBOX_ADJUST // 缩小碰撞箱高度
        };

        // 调整碰撞箱的位置，使其居中
        playerRect.x += GAME_CONFIG.PLAYER_HITBOX_ADJUST / 2;
        playerRect.y += GAME_CONFIG.PLAYER_HITBOX_ADJUST / 2;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            // 调整物品的碰撞箱
            const itemRect = {
                x: item.x + (item.width * 0.2), // 缩小物品碰撞箱 20%
                y: item.y + (item.height * 0.2),
                width: item.width * 0.6, // 碰撞箱宽度为 60%
                height: item.height * 0.6
            };
            
            if (this.isColliding(playerRect, itemRect)) {
                if (item.isBomb) {
                    this.gameOver();
                } else {
                    this.collectItem(item);
                }
                this.items.splice(i, 1);
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    collectItem(item) {
        this.score += GAME_CONFIG.SCORE_PER_ITEM;
        this.updateScore(this.score);
        this.playCollectSound();
    }

    updateScore(score) {
        document.querySelector('#score').textContent = score;
    }

    startTimer() {
        let timeLeft = GAME_CONFIG.GAME_DURATION;
        this.gameTimer = setInterval(() => {
            timeLeft--;
            document.querySelector('#time').textContent = timeLeft;
            if (timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    gameOver() {
        this.isGameRunning = false;
        clearInterval(this.gameTimer);
        
        // 清除所有物品生成的定时器
        if (this.itemGenerationTimer) {
            clearInterval(this.itemGenerationTimer);
            this.itemGenerationTimer = null;
        }
        if (this.bombGenerationTimer) {
            clearInterval(this.bombGenerationTimer);
            this.bombGenerationTimer = null;
        }
        
        // 显示结算弹窗
        const resultModal = document.querySelector('.result-modal');
        resultModal.style.display = 'flex';
        resultModal.querySelector('.final-score').textContent = this.score;

        // 停止背景音乐
        this.stopBackgroundMusic();

        if (this.speedProgressionTimer) {
            clearInterval(this.speedProgressionTimer);
            this.speedProgressionTimer = null;
        }
    }

    playBackgroundMusic() {
        const bgm = this.resourceManager.audioCache['background'];
        bgm.loop = true;
        bgm.play();
    }

    stopBackgroundMusic() {
        const bgm = this.resourceManager.audioCache['background'];
        bgm.pause();
        bgm.currentTime = 0;
    }

    playCollectSound() {
        const sounds = ['collect1', 'collect2', 'collect3', 'collect4'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        const audio = this.resourceManager.audioCache[randomSound].cloneNode();
        audio.play();
    }

    startSpeedProgression() {
        // 每秒更新速度
        this.speedProgressionTimer = setInterval(() => {
            if (!this.isGameRunning) return;

            this.elapsedTime++;
            
            // 更新掉落速度
            this.currentFallSpeed = Math.min(
                GAME_CONFIG.MAX_FALL_SPEED,
                GAME_CONFIG.INITIAL_FALL_SPEED + (this.elapsedTime * GAME_CONFIG.SPEED_INCREMENT)
            );

            // 更新生成间隔
            this.currentSpawnInterval = Math.max(
                GAME_CONFIG.MIN_SPAWN_INTERVAL,
                GAME_CONFIG.INITIAL_SPAWN_INTERVAL - (this.elapsedTime * GAME_CONFIG.SPAWN_INTERVAL_DECREMENT)
            );

            // 重新设置物品生成定时器
            if (this.itemGenerationTimer) {
                clearInterval(this.itemGenerationTimer);
            }
            this.itemGenerationTimer = setInterval(() => {
                if (!this.isGameRunning) return;
                this.generateItem();
            }, this.currentSpawnInterval);

        }, 1000);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.initialize();
});