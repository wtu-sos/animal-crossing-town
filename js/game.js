/**
 * 游戏主类
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.gameTime = 360; // 游戏时间（分钟，从6:00开始）
        
        // 初始化系统
        this.input = new InputManager();
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.map = new GameMap(32);
        this.player = new Player(
            this.map.pixelWidth / 2,
            this.map.pixelHeight / 2
        );
        
        // 设置相机边界
        this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);
        
        // 初始化
        this.init();
    }
    
    init() {
        // 调整画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 开始游戏循环
        requestAnimationFrame((t) => this.loop(t));
    }
    
    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
        this.camera.width = window.innerWidth;
        this.camera.height = window.innerHeight;
    }
    
    // 游戏主循环
    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新游戏状态
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        // 下一帧
        requestAnimationFrame((t) => this.loop(t));
    }
    
    // 更新游戏状态
    update(deltaTime) {
        // 更新玩家
        this.player.update(this.input, this.map);
        
        // 更新相机跟随
        this.camera.follow(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2
        );
        this.camera.update();
        this.camera.clampToBounds();
        
        // 更新游戏时间
        this.gameTime += deltaTime / 1000 / 6; // 游戏时间比现实快
        if (this.gameTime >= 1440) this.gameTime = 0; // 24小时循环
    }
    
    // 渲染
    render() {
        // 清空画布
        this.renderer.clear();
        
        // 绘制背景（天空）
        this.drawSky();
        
        // 绘制地图
        this.renderer.drawMap(this.map, this.camera);
        
        // 获取并绘制物体
        const visibleObjects = this.map.getObjectsInView(
            this.camera.x,
            this.camera.y,
            this.camera.width,
            this.camera.height
        );
        this.renderer.drawObjects(visibleObjects, this.camera, this.map.tileSize);
        
        // 绘制玩家
        this.renderer.drawPlayer(this.player, this.camera);
        
        // 绘制 UI
        this.renderer.drawUI(this.gameTime, this.player.x, this.player.y);
    }
    
    // 绘制天空背景
    drawSky() {
        const ctx = this.renderer.ctx;
        const hours = this.gameTime / 60;
        
        // 根据时间计算天空颜色
        let topColor, bottomColor;
        
        if (hours >= 5 && hours < 7) {
            // 日出
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else if (hours >= 7 && hours < 17) {
            // 白天
            topColor = '#87CEEB';
            bottomColor = '#E0F6FF';
        } else if (hours >= 17 && hours < 19) {
            // 日落
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else {
            // 夜晚
            topColor = '#1a1a2e';
            bottomColor = '#16213e';
        }
        
        // 绘制渐变天空
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// 启动游戏
window.addEventListener('load', () => {
    window.game = new Game();
});
