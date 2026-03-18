/**
 * 游戏主类 - 带调试
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.gameTime = 360;
        this.debug = true; // 开启调试模式
        this.debugInfo = {};
        
        // 初始化系统
        this.input = new InputManager();
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.map = new GameMap(32);
        
        // 玩家从自己家出生
        const playerHomePos = this.map.getBuildingPosition('playerHouse');
        let spawnX = playerHomePos.x;
        let spawnY = playerHomePos.y;
        
        // 在门口生成（稍微向下偏移）
        spawnY += 40;
        
        this.player = new Player(spawnX, spawnY);
        
        // 设置相机边界
        this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);
        
        // 初始化玩法系统
        this.gameplay = new GameplaySystem(this);
        
        // 定期更新NPC（GOAP驱动）
        this.lastNPCUpdate = 0;
        
        // 初始化
        this.init();
        
        console.log('Game initialized');
        console.log('Player spawn:', this.player.x, this.player.y);
        console.log('Map size:', this.map.pixelWidth, this.map.pixelHeight);
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        requestAnimationFrame((t) => this.loop(t));
    }
    
    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
        this.camera.width = window.innerWidth;
        this.camera.height = window.innerHeight;
    }
    
    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    update(deltaTime) {
        // 获取输入向量
        const movement = this.input.getMovementVector();
        
        // 调试信息
        if (this.debug) {
            this.debugInfo = {
                inputX: movement.x.toFixed(3),
                inputY: movement.y.toFixed(3),
                playerX: this.player.x.toFixed(1),
                playerY: this.player.y.toFixed(1),
                isMoving: movement.x !== 0 || movement.y !== 0,
                joystickActive: this.input.joystick.active,
                log: this.player.debugLog
            };
        }
        
        // 更新玩家
        this.player.update(this.input, this.map);
        
        // 处理玩家与NPC的碰撞
        if (this.gameplay) {
            this.handlePlayerNPCCollision();
        }
        
        // 更新相机
        this.camera.follow(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2
        );
        this.camera.update();
        this.camera.clampToBounds();
        
        // 更新时间
        this.gameTime += deltaTime / 1000 / 6;
        if (this.gameTime >= 1440) this.gameTime = 0;
        
        // 更新NPC（每200ms）
        this.lastNPCUpdate += deltaTime;
        if (this.lastNPCUpdate >= 200) {
            this.gameplay.updateNPCs(this.lastNPCUpdate);
            this.lastNPCUpdate = 0;
        }
    }
    
    render() {
        this.renderer.clear();
        this.drawSky();
        this.renderer.drawMap(this.map, this.camera);
        
        const visibleObjects = this.map.getObjectsInView(
            this.camera.x, this.camera.y,
            this.camera.width, this.camera.height
        );
        this.renderer.drawObjects(visibleObjects, this.camera, this.map.tileSize);
        
        // 渲染NPC
        if (this.gameplay) {
            this.gameplay.renderNPCs(this.renderer.ctx, this.camera);
        }
        
        this.renderer.drawPlayer(this.player, this.camera);
        this.renderer.drawUI(this.gameTime, this.player.x, this.player.y, this.player);
        
        // 绘制调试信息
        if (this.debug) {
            this.drawDebugInfo();
        }
    }
    
    drawSky() {
        const ctx = this.renderer.ctx;
        const hours = this.gameTime / 60;
        
        let topColor, bottomColor;
        if (hours >= 5 && hours < 7) {
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else if (hours >= 7 && hours < 17) {
            topColor = '#87CEEB';
            bottomColor = '#E0F6FF';
        } else if (hours >= 17 && hours < 19) {
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else {
            topColor = '#1a1a2e';
            bottomColor = '#16213e';
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 处理玩家与NPC的碰撞
    handlePlayerNPCCollision() {
        const player = this.player;
        
        for (const npc of this.gameplay.npcs) {
            const dx = player.x - npc.x;
            const dy = player.y - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 碰撞距离阈值（玩家和NPC的半径之和）
            const minDistance = 24;
            
            if (distance < minDistance && distance > 0) {
                // 推开玩家（滑动效果）
                const pushX = (dx / distance) * (minDistance - distance) * 0.5;
                const pushY = (dy / distance) * (minDistance - distance) * 0.5;
                
                // 检查推开后的位置是否合法
                const newX = player.x + pushX;
                const newY = player.y + pushY;
                
                if (!this.map.checkCollision(newX, player.y, player.width, player.height)) {
                    player.x = newX;
                }
                if (!this.map.checkCollision(player.x, newY, player.width, player.height)) {
                    player.y = newY;
                }
            }
        }
    }
    
    drawDebugInfo() {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, this.canvas.height - 120, 200, 110);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        let y = this.canvas.height - 105;
        
        for (const [key, value] of Object.entries(this.debugInfo)) {
            ctx.fillText(`${key}: ${value}`, 20, y);
            y += 18;
        }
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
