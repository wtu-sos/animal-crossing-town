/**
 * 游戏玩法系统 - 收集、种植、钓鱼、背包等
 */
class GameplaySystem {
    constructor(game) {
        this.game = game;
        this.inventory = {
            flowers: [],
            fish: [],
            fruits: []
        };
        this.tool = null; // 当前工具: 'net', 'rod', 'shovel', 'axe'
        this.isFishing = false;
        this.fishingMiniGame = null;
        this.plantedFlowers = [];
        
        // 世界状态（用于GOAP）
        this.worldState = new WorldState();
        
        // 初始化NPC
        this.npcs = this.generateNPCs();
        
        // 初始化GOAP Agents
        this.agents = this.initGOAPAgents();
        
        // 绑定按键
        this.bindKeys();
    }
    
    // 初始化GOAP Agents
    initGOAPAgents() {
        const agents = [];
        for (const npc of this.npcs) {
            const agent = new GOAPAgent(npc, npc.role, this.worldState);
            // 立即初始化，让NPC开始行动
            if (this.game) {
                agent.init(this.game.gameTime || 360);
            }
            agents.push(agent);
        }
        return agents;
    }
    
    // 生成NPC
    generateNPCs() {
        const npcs = [];
        const names = ['阿狸', '小橘', '小白'];
        
        for (let i = 0; i < 3; i++) {
            const name = names[i];
            const config = NPC_ROLES[name];
            
            // 从家中开始（使用地图建筑位置）
            const homePos = getBuildingPosition(this.game.map, config.homeBuilding);
            const x = homePos.x;
            const y = homePos.y;
            
            npcs.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                width: 24,
                height: 24,
                name: name,
                role: config.role,
                homeBuilding: config.homeBuilding,
                workBuilding: config.workBuilding,
                color: config.color,
                icon: config.icon,
                dialogues: config.dialogues,
                currentDialogue: 0,
                direction: 'down',
                animationFrame: 0,
                moveTimer: 0,
                isMoving: false,
                energy: 100, // GOAP能量系统
                hasTool: true // 职业工具
            });
        }
        return npcs;
    }
    
    // NPC对话
    getNPCDialogues(index) {
        const dialogues = [
            ['你好呀！欢迎来到小镇！', '这里的花都很漂亮呢~', '你可以收集花朵哦！'],
            ['听说河边可以钓到鱼！', '你要试试钓鱼吗？', '按空格键在水边试试！'],
            ['我喜欢在这里种花~', '你也可以试着种花哦！', '背包里有种子就能种！']
        ];
        return dialogues[index] || ['你好！'];
    }
    
    // 绑定按键
    bindKeys() {
        window.addEventListener('keydown', (e) => {
            // 空格键 - 互动/钓鱼/对话
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleAction();
            }

            // 数字键切换工具
            if (e.key >= '1' && e.key <= '4') {
                this.switchTool(parseInt(e.key));
            }

            // B键打开背包
            if (e.key.toLowerCase() === 'b') {
                this.toggleInventory();
            }

            // G键显示GOAP状态
            if (e.key.toLowerCase() === 'g') {
                this.showGOAPPanel();
            }
        });
    }
    
    // 处理互动
    handleAction() {
        const player = this.game.player;
        const map = this.game.map;

        // 检查是否与NPC对话
        const nearbyNPC = this.getNearbyNPC();
        if (nearbyNPC) {
            this.talkToNPC(nearbyNPC);
            return;
        }

        // 检查是否在饭店附近并可以吃饭
        if (player.isNearRestaurant(map)) {
            if (player.startEating()) {
                return;
            }
        }

        // 检查是否在水边钓鱼
        if (this.isNearWater()) {
            this.startFishing();
            return;
        }

        // 检查是否靠近花朵可收集
        const flower = this.getNearbyFlower();
        if (flower) {
            this.collectFlower(flower);
            return;
        }

        // 检查是否可以种树
        if (this.tool === 'shovel' && this.canPlant()) {
            this.plantTree();
            return;
        }

        // 检查是否可以砍树
        if (this.tool === 'axe') {
            const tree = this.getNearbyTree();
            if (tree) {
                this.chopTree(tree);
                return;
            }
        }
    }
    
    // 获取附近的NPC
    getNearbyNPC() {
        for (const npc of this.npcs) {
            const dx = this.game.player.x - npc.x;
            const dy = this.game.player.y - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 50) {
                return npc;
            }
        }
        return null;
    }
    
    // 与NPC对话
    talkToNPC(npc) {
        const dialogue = npc.dialogues[npc.currentDialogue];
        this.showDialogue(npc.name, dialogue);
        npc.currentDialogue = (npc.currentDialogue + 1) % npc.dialogues.length;
    }
    
    // 显示对话
    showDialogue(name, text) {
        // 移除旧的对话框
        const oldDialogue = document.getElementById('dialogue-box');
        if (oldDialogue) oldDialogue.remove();
        
        // 创建对话框
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'dialogue-box';
        dialogueBox.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 20px 30px;
            border-radius: 15px;
            border: 3px solid #667eea;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 100;
            animation: popIn 0.3s ease;
        `;
        dialogueBox.innerHTML = `
            <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">${name}</div>
            <div style="color: #333;">${text}</div>
            <div style="font-size: 12px; color: #999; margin-top: 10px;">按空格键继续</div>
        `;
        
        document.getElementById('game-container').appendChild(dialogueBox);
        
        // 3秒后自动关闭
        setTimeout(() => {
            if (dialogueBox.parentNode) {
                dialogueBox.style.opacity = '0';
                dialogueBox.style.transition = 'opacity 0.5s';
                setTimeout(() => dialogueBox.remove(), 500);
            }
        }, 5000);
    }
    
    // 检查是否在水边
    isNearWater() {
        const player = this.game.player;
        const map = this.game.map;
        const checkPoints = [
            { x: player.x + 30, y: player.y },
            { x: player.x - 30, y: player.y },
            { x: player.x, y: player.y + 30 },
            { x: player.x, y: player.y - 30 }
        ];
        
        for (const point of checkPoints) {
            const tileX = Math.floor(point.x / map.tileSize);
            const tileY = Math.floor(point.y / map.tileSize);
            if (map.getTile(tileX, tileY) === map.TILE_TYPES.WATER) {
                return true;
            }
        }
        return false;
    }
    
    // 开始钓鱼
    startFishing() {
        if (this.isFishing) return;
        
        this.isFishing = true;
        this.showNotification('🎣 按空格键钓鱼！当感叹号出现时快速按空格！');
        
        // 钓鱼小游戏
        setTimeout(() => {
            this.fishingBite();
        }, 2000 + Math.random() * 3000);
    }
    
    // 鱼咬钩
    fishingBite() {
        if (!this.isFishing) return;
        
        this.showNotification('❗ 鱼咬钩了！快按空格！', '#ff4444');
        
        let caught = false;
        const catchWindow = 1000; // 1秒反应时间
        
        const checkCatch = (e) => {
            if (e.code === 'Space' && !caught) {
                caught = true;
                window.removeEventListener('keydown', checkCatch);
                this.catchFish();
            }
        };
        
        window.addEventListener('keydown', checkCatch);
        
        setTimeout(() => {
            if (!caught) {
                window.removeEventListener('keydown', checkCatch);
                this.showNotification('😅 鱼跑掉了...', '#999');
                this.isFishing = false;
            }
        }, catchWindow);
    }
    
    // 钓到鱼
    catchFish() {
        const fishTypes = ['🐟 鲤鱼', '🐠 金鱼', '🦈 鲨鱼', '🐡 河豚', '🦑 鱿鱼'];
        const fish = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        
        this.inventory.fish.push(fish);
        this.showNotification(`🎉 钓到了 ${fish}！`, '#ffd700');
        this.isFishing = false;
    }
    
    // 获取附近的花朵
    getNearbyFlower() {
        const player = this.game.player;
        const map = this.game.map;
        
        for (let i = map.objects.length - 1; i >= 0; i--) {
            const obj = map.objects[i];
            if (obj.type === 'flower') {
                const dx = player.x - obj.x;
                const dy = player.y - obj.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 40) {
                    return { obj, index: i };
                }
            }
        }
        return null;
    }
    
    // 收集花朵
    collectFlower(flowerData) {
        const { obj, index } = flowerData;
        const colors = ['红色', '黄色', '粉色', '紫色'];
        const flowerName = colors[obj.variant] + '花朵';
        
        this.inventory.flowers.push({
            name: flowerName,
            variant: obj.variant,
            x: obj.x,
            y: obj.y
        });
        
        // 从地图上移除
        this.game.map.objects.splice(index, 1);
        
        this.showNotification(`🌸 收集了 ${flowerName}！`, '#ff69b4');
    }
    
    // 获取附近的树
    getNearbyTree() {
        const player = this.game.player;
        const map = this.game.map;
        
        for (const obj of map.objects) {
            if (obj.type === 'tree') {
                const dx = player.x - obj.x;
                const dy = player.y - obj.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 50) {
                    return obj;
                }
            }
        }
        return null;
    }
    
    // 砍树
    chopTree(tree) {
        tree.shaking = true;
        this.showNotification('🪓 正在砍树...');
        
        setTimeout(() => {
            tree.shaking = false;
            // 随机掉落
            if (Math.random() > 0.5) {
                this.inventory.fruits.push('🍎 苹果');
                this.showNotification('🍎 获得了苹果！', '#ff6b6b');
            }
        }, 500);
    }
    
    // 检查是否可以种植
    canPlant() {
        const player = this.game.player;
        const map = this.game.map;
        const tileX = Math.floor(player.x / map.tileSize);
        const tileY = Math.floor(player.y / map.tileSize);
        
        return map.getTile(tileX, tileY) === map.TILE_TYPES.GRASS &&
               !map.checkCollision(player.x, player.y, 24, 24);
    }
    
    // 种植花朵
    plantTree() {
        if (this.inventory.flowers.length === 0) {
            this.showNotification('🌱 没有种子可以种植！', '#999');
            return;
        }
        
        const player = this.game.player;
        const seed = this.inventory.flowers.pop();
        
        this.game.map.objects.push({
            type: 'flower',
            x: Math.floor(player.x / 32) * 32,
            y: Math.floor(player.y / 32) * 32,
            tileX: Math.floor(player.x / 32),
            tileY: Math.floor(player.y / 32),
            variant: seed.variant,
            interactive: false
        });
        
        this.showNotification('🌱 种下了 ' + seed.name + '！', '#32cd32');
    }
    
    // 切换工具
    switchTool(toolNum) {
        const tools = [null, 'net', 'rod', 'shovel', 'axe'];
        this.tool = tools[toolNum];
        
        const toolNames = {
            null: '空手',
            net: '捕虫网',
            rod: '钓鱼竿',
            shovel: '铲子',
            axe: '斧头'
        };
        
        this.showNotification(`🛠️ 工具: ${toolNames[this.tool]}`, '#667eea');
        this.updateToolDisplay();
    }
    
    // 更新工具显示
    updateToolDisplay() {
        let toolDisplay = document.getElementById('tool-display');
        if (!toolDisplay) {
            toolDisplay = document.createElement('div');
            toolDisplay.id = 'tool-display';
            toolDisplay.style.cssText = `
                position: absolute;
                top: 60px;
                left: 20px;
                background: rgba(0,0,0,0.7);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 50;
            `;
            document.getElementById('ui-layer').appendChild(toolDisplay);
        }
        
        const toolIcons = {
            null: '✋',
            net: '🦋',
            rod: '🎣',
            shovel: '🔨',
            axe: '🪓'
        };
        
        toolDisplay.textContent = `${toolIcons[this.tool]} 当前工具`;
    }
    
    // 显示通知
    showNotification(text, color = '#fff') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: ${color};
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 200;
            animation: fadeInOut 2s ease;
            pointer-events: none;
        `;
        notification.textContent = text;
        
        document.getElementById('game-container').appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    // 显示GOAP状态面板
    showGOAPPanel() {
        let panel = document.getElementById('goap-panel');
        if (panel) {
            panel.remove();
            return;
        }
        
        panel = document.createElement('div');
        panel.id = 'goap-panel';
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 20px;
            border-radius: 15px;
            min-width: 250px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 100;
            border: 2px solid #667eea;
        `;
        
        let html = '<h3 style="margin: 0 0 15px 0; color: #667eea;">🧠 NPC GOAP状态</h3>';
        
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            const agent = this.agents[i];
            const config = NPC_ROLES[npc.name] || {};
            
            html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">`;
            html += `<div style="font-weight: bold; color: ${npc.color};">${config.icon} ${npc.name}</div>`;
            html += `<div style="font-size: 12px; color: #aaa;">身份: ${npc.role}</div>`;
            html += `<div style="font-size: 12px; margin-top: 5px;">能量: ${Math.floor(npc.energy)}%</div>`;
            html += `<div style="font-size: 12px; color: #FFD700;">当前: ${getNPCStatus(npc, agent)}</div>`;
            
            if (agent && agent.currentPlan && agent.currentPlan.length > 0) {
                html += `<div style="font-size: 11px; color: #aaa; margin-top: 5px;">计划:</div>`;
                html += `<div style="font-size: 10px; color: #888;">`;
                agent.currentPlan.slice(0, 3).forEach((action, idx) => {
                    html += `${idx + 1}. ${action.name}<br>`;
                });
                if (agent.currentPlan.length > 3) {
                    html += `...还有${agent.currentPlan.length - 3}个行动`;
                }
                html += `</div>`;
            }
            
            html += `</div>`;
        }
        
        html += '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #444; font-size: 11px; color: #666;">按 G 键关闭</div>';
        
        panel.innerHTML = html;
        document.getElementById('game-container').appendChild(panel);
    }
    
    // 打开/关闭背包
    toggleInventory() {
        let inventoryPanel = document.getElementById('inventory-panel');
        
        if (inventoryPanel) {
            inventoryPanel.remove();
            return;
        }
        
        inventoryPanel = document.createElement('div');
        inventoryPanel.id = 'inventory-panel';
        inventoryPanel.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.95);
            padding: 30px;
            border-radius: 20px;
            border: 3px solid #667eea;
            min-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 150;
            box-shadow: 0 4px 30px rgba(0,0,0,0.3);
        `;
        
        let html = '<h3 style="margin: 0 0 20px 0; color: #667eea;">🎒 背包</h3>';
        
        // 花朵
        html += '<div style="margin-bottom: 15px;"><strong>🌸 花朵:</strong> ' + 
                (this.inventory.flowers.length || '无') + '</div>';
        
        // 鱼
        html += '<div style="margin-bottom: 15px;"><strong>🐟 鱼:</strong> ' + 
                (this.inventory.fish.length ? this.inventory.fish.join(', ') : '无') + '</div>';
        
        // 水果
        html += '<div style="margin-bottom: 15px;"><strong>🍎 水果:</strong> ' + 
                (this.inventory.fruits.length ? this.inventory.fruits.join(', ') : '无') + '</div>';
        
        // 操作提示
        html += '<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">';
        html += '按 B 键关闭背包';
        html += '</div>';
        
        inventoryPanel.innerHTML = html;
        document.getElementById('game-container').appendChild(inventoryPanel);
    }
    
    // 更新NPC（GOAP驱动）
    updateNPCs(deltaTime = 16) {
        const gameTime = this.game.gameTime;
        
        // 更新世界状态时间
        this.worldState.updateTime(gameTime);
        
        // 更新每个GOAP Agent
        for (let i = 0; i < this.agents.length; i++) {
            const agent = this.agents[i];
            const npc = this.npcs[i];
            
            // GOAP规划更新（传入游戏时间）
            agent.update(deltaTime, this, gameTime);
            
            // 更新动画帧
            npc.animationFrame = (npc.animationFrame + 1) % 4;
            
            // 根据GOAP决策应用移动
            if (npc.isMoving) {
                this.moveNPCWithCollision(npc);
            }
            
            // 调试：输出NPC状态
            if (window.game && window.game.debug && i === 0 && Math.random() < 0.05) {
                const actionName = agent.currentAction ? agent.currentAction.name : 'null';
                const pathInfo = agent.currentAction && agent.currentAction.path ? 
                    `path:${agent.currentAction.currentPathIndex}/${agent.currentAction.path.length}` : 'no-path';
                console.log(`[${npc.name}] pos:(${npc.x.toFixed(0)},${npc.y.toFixed(0)}) vx:${npc.vx.toFixed(2)} vy:${npc.vy.toFixed(2)} isMoving:${npc.isMoving} action:${actionName} ${pathInfo}`);
            }
        }
    }
    
    // NPC移动带碰撞检测
    moveNPCWithCollision(npc) {
        const newX = npc.x + npc.vx;
        const newY = npc.y + npc.vy;
        
        // 检查与地图的碰撞
        const mapCollision = this.game.map.checkCollision(newX, newY, npc.width, npc.height);
        if (mapCollision) {
            // 碰到墙壁，停止移动并让NPC重新寻路
            npc.vx = 0;
            npc.vy = 0;
            npc.isMoving = false;
            
            // 触发重新寻路 - 找到对应的agent并清除当前路径
            const agentIndex = this.npcs.indexOf(npc);
            if (agentIndex !== -1 && this.agents[agentIndex]) {
                const agent = this.agents[agentIndex];
                if (agent.currentAction && agent.currentAction.path) {
                    agent.currentAction.path = null;
                    agent.currentAction.currentPathIndex = 0;
                }
            }
            return;
        }
        
        // 检查与其他NPC的碰撞
        for (const other of this.npcs) {
            if (other === npc) continue;
            
            const dx = newX - other.x;
            const dy = newY - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                // NPC之间碰撞，推开
                const pushX = dx / distance * 0.5;
                const pushY = dy / distance * 0.5;
                npc.vx += pushX;
                npc.vy += pushY;
                return;
            }
        }
        
        // 检查与玩家的碰撞
        const player = this.game.player;
        const pdx = newX - player.x;
        const pdy = newY - player.y;
        const pDistance = Math.sqrt(pdx * pdx + pdy * pdy);
        
        if (pDistance < 30) {
            // 与玩家碰撞，NPC退让
            const pushX = pdx / pDistance * 0.3;
            const pushY = pdy / pDistance * 0.3;
            npc.vx += pushX;
            npc.vy += pushY;
            return;
        }
        
        // 应用移动
        npc.x = newX;
        npc.y = newY;
        
        // 边界限制
        npc.x = Math.max(0, Math.min(npc.x, this.game.map.pixelWidth - npc.width));
        npc.y = Math.max(0, Math.min(npc.y, this.game.map.pixelHeight - npc.height));
    }
    
    // 渲染NPC
    renderNPCs(ctx, camera) {
        for (let i = 0; i < this.npcs.length; i++) {
            const npc = this.npcs[i];
            const agent = this.agents[i];
            const screenX = npc.x - camera.x;
            const screenY = npc.y - camera.y;

            // 跳过屏幕外的NPC
            if (screenX < -80 || screenX > camera.width + 80 ||
                screenY < -80 || screenY > camera.height + 80) {
                continue;
            }

            // 绘制NPC移动路径（调试用）
            if (agent && agent.currentAction) {
                this.drawNPCPath(ctx, camera, npc, agent);
            }

            const bobOffset = Math.sin(npc.animationFrame * Math.PI / 2) * 2;
            const config = NPC_ROLES[npc.name] || { icon: '👤' };

            // 绘制NPC头顶状态
            const status = getNPCStatus(npc, agent);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(screenX - 35, screenY - 45 + bobOffset, 70, 16);
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(status, screenX, screenY - 34 + bobOffset);

            // 身份图标
            ctx.font = '14px sans-serif';
            ctx.fillText(config.icon, screenX, screenY - 50 + bobOffset);

            // 身体
            ctx.fillStyle = npc.color;
            ctx.fillRect(screenX - 8, screenY - 4 + bobOffset, 16, 14);

            // 头部
            ctx.fillStyle = '#FFDBAC';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 10 + bobOffset, 8, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX - 4, screenY - 10 + bobOffset, 2, 2);
            ctx.fillRect(screenX + 2, screenY - 10 + bobOffset, 2, 2);

            // 名字
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, screenX, screenY - 20 + bobOffset);

            // 能量条
            const energy = npc.energy || 100;
            const barWidth = 24;
            const barHeight = 3;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - barWidth/2, screenY + 12 + bobOffset, barWidth, barHeight);
            ctx.fillStyle = energy > 50 ? '#4CAF50' : energy > 25 ? '#FFC107' : '#F44336';
            ctx.fillRect(screenX - barWidth/2, screenY + 12 + bobOffset, barWidth * (energy/100), barHeight);
        }
    }

    // 绘制NPC移动路径（调试用）
    drawNPCPath(ctx, camera, npc, agent) {
        if (!agent.currentAction) return;

        const actionName = agent.currentAction.name;
        let targetPos = null;

        if (actionName === 'MoveHome') {
            targetPos = getBuildingPosition(this.game.map, npc.homeBuilding);
        } else if (actionName === 'MoveToWork') {
            targetPos = getBuildingPosition(this.game.map, npc.workBuilding);
        }

        if (targetPos) {
            const startX = npc.x - camera.x;
            const startY = npc.y - camera.y;
            const endX = targetPos.x - camera.x;
            const endY = targetPos.y - camera.y;

            // 绘制虚线路径
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]);

            // 绘制目标标记
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(endX, endY, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes popIn {
        0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
`;
document.head.appendChild(style);
