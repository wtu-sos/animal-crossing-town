/**
 * 游戏主类 - 带调试
 */
class Game {
    constructor() {
        console.log('Game constructor starting...');
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found!');
        }
        console.log('Canvas found');
        
        this.lastTime = 0;
        this.gameTime = 360;
        this.debug = true; // 开启调试模式
        this.debugInfo = {};
        
        // 初始化系统
        console.log('Initializing InputManager...');
        this.input = new InputManager();
        console.log('Initializing Renderer...');
        this.renderer = new Renderer(this.canvas);
        console.log('Initializing Camera...');
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        console.log('Initializing GameMap...');
        this.map = new GameMap(32);
        console.log('GameMap initialized');
        
        // 玩家从自己家出生
        console.log('Getting player home position...');
        const playerHomePos = this.map.getBuildingPosition('playerHouse');
        if (!playerHomePos) {
            throw new Error('Player home position not found!');
        }
        let spawnX = playerHomePos.x;
        let spawnY = playerHomePos.y;
        console.log('Player home position:', spawnX, spawnY);
        
        // 在门口生成（稍微向下偏移）
        spawnY += 40;
        
        this.player = new Player(spawnX, spawnY);
        
        // 设置相机边界
        this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);
        
        // 初始化玩法系统
        console.log('Initializing GameplaySystem...');
        this.gameplay = new GameplaySystem(this);
        console.log('GameplaySystem initialized');
        
        // 定期更新NPC（GOAP驱动）
        this.lastNPCUpdate = 0;
        
        // 迷你地图
        this.minimapVisible = false;
        
        // 玩家 GOAP Agent - 使用gameplay的世界状态
        this.playerAgent = null;
        
        // 初始化
        this.init();
        
        // 初始化玩家GOAP Agent（在gameplay初始化之后）
        if (this.gameplay && this.gameplay.worldState) {
            this.playerAgent = new PlayerGOAPAgent(this.player, this.gameplay);
            console.log('Player GOAP Agent initialized');
        }
        
        console.log('Game initialized');
        console.log('Player spawn:', this.player.x, this.player.y);
        console.log('Map size:', this.map.pixelWidth, this.map.pixelHeight);
    }
    
    init() {
        console.log('Game.init() called');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        console.log('Starting game loop at 30 FPS...');
        this.targetFPS = 30;
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }
    
    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
        this.camera.width = window.innerWidth;
        this.camera.height = window.innerHeight;
    }
    
    loop(timestamp) {
        try {
            // 30 FPS 限制
            const elapsed = timestamp - this.lastFrameTime;
            if (elapsed < this.frameInterval) {
                requestAnimationFrame((t) => this.loop(t));
                return;
            }
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
            
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;
            
            this.update(deltaTime);
            this.render();
        } catch (e) {
            console.error('Error in game loop:', e);
        }
        
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
                log: this.player.debugLog
            };
        }
        
        // 更新玩家（使用 GOAP 控制）
        if (this.playerAgent) {
            this.playerAgent.update(deltaTime, this.map, this.gameplay.npcs);
        }
        
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
        this.renderer.drawUI(this.gameTime, this.player.x, this.player.y, this.player, this.playerAgent);
        
        // 绘制调试信息
        if (this.debug) {
            this.drawDebugInfo();
        }
        
        // 更新迷你地图
        if (this.minimapVisible) {
            this.drawMiniMap();
        }
    }
    
    // 绘制迷你地图
    drawMiniMap() {
        const canvas = document.getElementById('minimap');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const mapWidth = this.map.width;
        const mapHeight = this.map.height;
        
        // 设置迷你地图大小
        const scale = 4; // 每个瓦片4像素
        canvas.width = mapWidth * scale;
        canvas.height = mapHeight * scale;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制地图
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tile = this.map.getTile(x, y);
                
                // 根据瓦片类型设置颜色
                switch(tile) {
                    case 0: ctx.fillStyle = '#7CB342'; break; // grass
                    case 1: ctx.fillStyle = '#757575'; break; // road
                    case 2: ctx.fillStyle = '#BDBDBD'; break; // sidewalk
                    case 3: ctx.fillStyle = '#42A5F5'; break; // water
                    case 4: ctx.fillStyle = '#FFE082'; break; // sand
                    case 5: ctx.fillStyle = '#FFB6C1'; break; // house
                    case 6: ctx.fillStyle = '#81C784'; break; // shop
                    case 7: ctx.fillStyle = '#CE93D8'; break; // inn
                    case 8: ctx.fillStyle = '#FFD54F'; break; // townhall
                    case 9: ctx.fillStyle = '#66BB6A'; break; // park
                    case 10: ctx.fillStyle = '#8D6E63'; break; // fence
                    case 11: ctx.fillStyle = '#A1887F'; break; // bridge
                    default: ctx.fillStyle = '#000';
                }
                
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        
        // 绘制玩家位置
        const playerX = Math.floor(this.player.x / this.map.tileSize);
        const playerY = Math.floor(this.player.y / this.map.tileSize);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(playerX * scale, playerY * scale, scale * 2, scale * 2);
        
        // 绘制NPC位置
        ctx.fillStyle = '#00FF00';
        for (const npc of this.gameplay.npcs) {
            const npcX = Math.floor(npc.x / this.map.tileSize);
            const npcY = Math.floor(npc.y / this.map.tileSize);
            ctx.fillRect(npcX * scale, npcY * scale, scale * 2, scale * 2);
        }
        
        // 绘制相机视窗
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        const viewX = Math.floor(this.camera.x / this.map.tileSize) * scale;
        const viewY = Math.floor(this.camera.y / this.map.tileSize) * scale;
        const viewW = Math.floor(this.camera.width / this.map.tileSize) * scale;
        const viewH = Math.floor(this.camera.height / this.map.tileSize) * scale;
        ctx.strokeRect(viewX, viewY, viewW, viewH);
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

// 全局迷你地图切换函数
function toggleMiniMap() {
    if (window.game) {
        // 关闭任务面板（互斥）
        const taskPanel = document.getElementById('task-panel');
        if (taskPanel && taskPanel.style.display !== 'none') {
            taskPanel.style.display = 'none';
        }
        
        window.game.minimapVisible = !window.game.minimapVisible;
        const container = document.getElementById('minimap-container');
        if (container) {
            container.style.display = window.game.minimapVisible ? 'block' : 'none';
        }
    }
}

// 全局任务面板切换函数
function toggleTaskPanel() {
    const panel = document.getElementById('task-panel');
    if (panel) {
        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';
        
        // 如果显示面板，初始化按钮并更新内容
        if (!isVisible && window.game && window.game.playerAgent) {
            initTaskPanelButtons(); // 首次打开时初始化按钮
            updateTaskPanel();
        }
    }
}

// 更新任务面板内容 - 只更新状态，不重新渲染按钮（按钮已在初始化时创建）
function updateTaskPanel() {
    if (!window.game || !window.game.playerAgent) return;
    
    const agent = window.game.playerAgent;
    const status = agent.getCurrentStatus();
    
    // 更新当前任务显示
    const taskIcon = document.querySelector('#current-task-display .task-icon');
    const taskName = document.querySelector('#current-task-display .task-name');
    const taskDesc = document.querySelector('#current-task-display .task-desc');
    const progressFill = document.querySelector('#current-task-display .progress-fill');
    
    if (taskIcon) taskIcon.textContent = status.icon || '🤔';
    if (taskName) taskName.textContent = status.goal ? status.goal.name : '思考中...';
    if (taskDesc) taskDesc.textContent = status.action || '正在决定下一步行动';
    if (progressFill) progressFill.style.width = (status.progress || 0) + '%';
    
    // 更新计划步骤
    const planSteps = document.getElementById('plan-steps');
    if (planSteps) {
        const steps = agent.getPlanSteps();
        if (steps.length === 0) {
            if (planSteps.innerHTML.indexOf('等待计划') === -1) {
                planSteps.innerHTML = '<li>⏳ 等待计划生成...</li>';
            }
        } else {
            planSteps.innerHTML = steps.map(step => 
                `<li class="${step.status}">${step.icon} ${step.name}</li>`
            ).join('');
        }
    }
    
    // 只更新按钮的 active 状态，不重新渲染
    updateGoalButtonsActiveState(agent);
}

// 更新目标按钮的 active 状态（不重新渲染按钮）
function updateGoalButtonsActiveState(agent) {
    const goalsContainer = document.getElementById('available-goals');
    if (!goalsContainer) return;
    
    const currentGoalId = agent.currentGoal ? agent.currentGoal.id : null;
    const buttons = goalsContainer.querySelectorAll('.goal-btn');
    
    buttons.forEach(btn => {
        // 从 onclick 属性中提取 goal id
        const match = btn.getAttribute('onclick');
        if (match) {
            const goalId = match.match(/'([^']+)'/)[1];
            if (goalId === currentGoalId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

// 初始化任务面板按钮（只调用一次）
function initTaskPanelButtons() {
    if (!window.game || !window.game.playerAgent) return;
    
    const agent = window.game.playerAgent;
    const goalsContainer = document.getElementById('available-goals');
    if (!goalsContainer || goalsContainer.children.length > 0) return; // 已初始化
    
    const goals = agent.getAvailableGoals();
    
    goalsContainer.innerHTML = goals.map(goal => `
        <button class="goal-btn" data-goal-id="${goal.id}"
                onclick="setPlayerGoal('${goal.id}')">
            <span class="icon">${goal.icon}</span>
            <span class="name">${goal.name}</span>
        </button>
    `).join('');
}

// 设置玩家目标
function setPlayerGoal(goalId) {
    if (window.game && window.game.playerAgent) {
        window.game.playerAgent.setManualGoal(goalId);
        updateTaskPanel();
    }
}

// 恢复自动模式
function setAutoMode() {
    if (window.game && window.game.playerAgent) {
        window.game.playerAgent.setAutoMode();
        updateTaskPanel();
    }
}

// 定期更新任务面板（如果打开）- 只更新文本，不重新渲染按钮
let lastTaskPanelUpdate = 0;
setInterval(() => {
    const panel = document.getElementById('task-panel');
    if (panel && panel.style.display !== 'none' && window.game && window.game.playerAgent) {
        const now = Date.now();
        if (now - lastTaskPanelUpdate >= 500) {
            lastTaskPanelUpdate = now;
            // 只更新状态文本，不重新渲染按钮
            updateTaskPanelStatusOnly();
        }
    }
}, 500);

// 只更新任务面板状态（不重新渲染按钮）
function updateTaskPanelStatusOnly() {
    if (!window.game || !window.game.playerAgent) return;
    
    const agent = window.game.playerAgent;
    const status = agent.getCurrentStatus();
    
    // 只更新当前任务显示
    const taskIcon = document.querySelector('#current-task-display .task-icon');
    const taskName = document.querySelector('#current-task-display .task-name');
    const taskDesc = document.querySelector('#current-task-display .task-desc');
    const progressFill = document.querySelector('#current-task-display .progress-fill');
    
    if (taskIcon) taskIcon.textContent = status.icon || '🤔';
    if (taskName) taskName.textContent = status.goal ? status.goal.name : '思考中...';
    if (taskDesc) taskDesc.textContent = status.action || '正在决定下一步行动';
    if (progressFill) progressFill.style.width = (status.progress || 0) + '%';
    
    // 更新计划步骤（只更新文本）
    const planSteps = document.getElementById('plan-steps');
    if (planSteps) {
        const steps = agent.getPlanSteps();
        if (steps.length === 0) {
            if (planSteps.innerHTML.indexOf('等待计划') === -1) {
                planSteps.innerHTML = '<li>⏳ 等待计划生成...</li>';
            }
        }
    }
}

window.addEventListener('load', () => {
    try {
        console.log('Game starting...');
        window.game = new Game();
        console.log('Game started successfully!');
    } catch (e) {
        console.error('Game initialization failed:', e);
        alert('游戏初始化失败: ' + e.message);
    }
});
