/**
 * 游戏控制器 - 协调模型和视图
 */
class GameController {
    constructor(canvas) {
        // 模型层
        this.state = null;
        this.player = null;
        this.npcs = [];
        this.map = null;
        
        // 视图层
        this.renderer = null;
        this.canvas = canvas;
        
        // 输入
        this.input = null;
        
        // 相机
        this.camera = null;
        
        // 游戏循环
        this.lastTime = 0;
        this.isRunning = false;
        
        // 服务
        this.services = {};
    }
    
    // 初始化
    async init() {
        // 初始化状态
        this.state = new (await this.loadModule('models/GameState.js'))();
        
        // 初始化地图
        this.map = new (await this.loadModule('models/GameMap.js'))();
        
        // 初始化玩家
        const PlayerModel = await this.loadModule('models/PlayerModel.js');
        const startPos = this.map.getBuildingPosition('playerHouse');
        this.player = new PlayerModel(startPos.x, startPos.y + 40);
        
        // 同步玩家状态到全局状态
        this.state.player.x = this.player.x;
        this.state.player.y = this.player.y;
        this.state.player.energy = this.player.energy;
        
        // 初始化NPC
        await this.initNPCs();
        
        // 初始化视图
        const RenderService = await this.loadModule('views/RenderService.js');
        this.renderer = new RenderService(this.canvas);
        this.renderer.resize(window.innerWidth, window.innerHeight);
        
        // 初始化相机
        const Camera = await this.loadModule('controllers/Camera.js');
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);
        
        // 初始化输入
        this.input = new (await this.loadModule('controllers/InputController.js'))();
        
        // 初始化完成
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // 开始游戏循环
        requestAnimationFrame((t) => this.loop(t));
        
        console.log('Game initialized');
    }
    
    // 动态加载模块
    async loadModule(path) {
        // 浏览器环境使用动态导入
        if (typeof window !== 'undefined') {
            const module = await import(`../${path}`);
            return module.default || module;
        }
        // Node环境使用require
        return require(`../${path}`);
    }
    
    // 初始化NPC
    async initNPCs() {
        const NPCModel = await this.loadModule('models/NPCModel.js');
        const goap = await this.loadModule('services/GOAPService.js');
        
        const npcConfigs = [
            { id: 'npc1', name: '阿狸', role: 'gardener', config: { homeBuilding: 'npc1House', workBuilding: 'flowerShop', color: '#FF6B6B', icon: '🌸', dialogues: ['欢迎来我的花店！', '今天的玫瑰开得很美~'] } },
            { id: 'npc2', name: '小橘', role: 'fisherman', config: { homeBuilding: 'npc2House', workBuilding: 'dock', color: '#4ECDC4', icon: '🎣', dialogues: ['码头今天的鱼很多！', '刚钓到的鲈鱼，新鲜！'] } },
            { id: 'npc3', name: '小白', role: 'miner', config: { homeBuilding: 'npc3House', workBuilding: 'toolShop', color: '#FFE66D', icon: '⛏️', dialogues: ['工具店新到了镐子！', '挖矿需要好工具~'] } }
        ];
        
        for (const config of npcConfigs) {
            const npc = new NPCModel(config.id, config.name, config.role, config.config);
            const homePos = this.map.getBuildingPosition(config.config.homeBuilding);
            npc.x = homePos.x;
            npc.y = homePos.y;
            
            this.npcs.push(npc);
            this.state.npcs.push(npc.toJSON());
        }
    }
    
    // 游戏主循环
    loop(timestamp) {
        if (!this.isRunning) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新逻辑
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    // 更新逻辑
    update(deltaTime) {
        // 更新时间
        this.state.updateTime(deltaTime);
        
        // 更新玩家
        this.player.update(this.input, this.map, deltaTime);
        
        // 同步玩家状态
        this.state.updatePlayerPosition(this.player.x, this.player.y);
        this.state.player.energy = this.player.energy;
        this.state.player.isEating = this.player.isEating;
        
        // 更新相机
        this.camera.follow(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.camera.update();
        this.camera.clampToBounds();
        
        // 更新NPC
        for (const npc of this.npcs) {
            npc.update(deltaTime, this.state);
        }
        
        // 处理交互
        this.handleInteractions();
    }
    
    // 处理交互
    handleInteractions() {
        // 检查玩家是否要吃饭
        if (this.input.isActionPressed() && this.player.isNearBuilding(this.map, 'restaurant')) {
            if (!this.player.isEating) {
                this.player.startEating();
                
                // 3秒后完成吃饭
                setTimeout(() => {
                    const recovered = this.player.finishEating(50);
                    this.renderer.showNotification(`⚡ 能量恢复 +${Math.floor(recovered)}!`, '#4CAF50');
                }, 3000);
            }
        }
    }
    
    // 渲染
    render() {
        this.renderer.clear();
        
        // 绘制天空
        this.renderer.drawSky(this.state.getHours());
        
        // 绘制地图
        this.renderMap();
        
        // 绘制NPC
        for (const npc of this.npcs) {
            this.renderer.drawEntity(npc, this.camera, {
                color: npc.config.color,
                name: npc.name,
                showEnergy: true,
                statusIcon: npc.config.icon
            });
        }
        
        // 绘制玩家
        this.renderer.drawEntity(this.player, this.camera, {
            color: this.player.appearance.shirt,
            showEnergy: true,
            statusIcon: this.player.isEating ? '🍜' : null
        });
        
        // 更新DOM UI
        this.renderer.updateDOMUI(this.state);
    }
    
    // 渲染地图
    renderMap() {
        const tileSize = this.map.tileSize;
        const startCol = Math.floor(this.camera.x / tileSize);
        const endCol = startCol + Math.ceil(this.camera.width / tileSize) + 1;
        const startRow = Math.floor(this.camera.y / tileSize);
        const endRow = startRow + Math.ceil(this.camera.height / tileSize) + 1;
        
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = this.map.getTile(col, row);
                const screenX = col * tileSize - this.camera.x;
                const screenY = row * tileSize - this.camera.y;
                this.renderer.drawTile(tile, screenX, screenY, tileSize);
            }
        }
        
        // 绘制建筑
        for (const [key, building] of Object.entries(this.map.BUILDINGS)) {
            this.renderer.drawBuilding(building, this.camera, this.map);
        }
    }
    
    // 暂停游戏
    pause() {
        this.isRunning = false;
    }
    
    // 恢复游戏
    resume() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
    
    // 保存游戏
    save() {
        return this.state.serialize();
    }
    
    // 加载游戏
    load(data) {
        this.state.deserialize(data);
        // 同步状态到实体
        this.player.x = this.state.player.x;
        this.player.y = this.state.player.y;
        this.player.energy = this.state.player.energy;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameController;
}
