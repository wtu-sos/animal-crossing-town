/**
 * 玩家 GOAP Agent - 自主决策系统
 */
class PlayerGOAPAgent {
    constructor(player, gameState) {
        this.player = player;
        this.gameState = gameState;
        this.planner = new GOAPPlanner();
        
        // 可用目标列表
        this.availableGoals = [
            { id: 'work', name: '工作赚钱', icon: '💼', priority: 3, 
              description: '去工作地点完成任务' },
            { id: 'eat', name: '去饭店', icon: '🍜', priority: 5,
              description: '补充能量，恢复体力' },
            { id: 'rest', name: '回家休息', icon: '😴', priority: 4,
              description: '回家睡觉，大幅恢复能量' },
            { id: 'explore', name: '探索小镇', icon: '🚶', priority: 2,
              description: '在小镇中随意漫步' },
            { id: 'visit', name: '拜访 NPC', icon: '👋', priority: 2,
              description: '去找 NPC 聊天互动' },
            { id: 'fishing', name: '去钓鱼', icon: '🎣', priority: 3,
              description: '在码头钓鱼放松' },
            { id: 'shopping', name: '购物', icon: '🛒', priority: 3,
              description: '去商店买东西' }
        ];
        
        // 当前目标
        this.currentGoal = null;
        this.currentPlan = [];
        this.currentAction = null;
        
        // 状态
        this.state = {
            energy: 100,
            money: 0,
            hunger: 0,
            happiness: 50
        };
        
        // 自动规划间隔
        this.planTimer = 0;
        this.planInterval = 300; // 5秒重新评估
        
        // 是否手动覆盖
        this.manualOverride = false;
        this.manualGoal = null;
    }
    
    // 设置手动目标
    setManualGoal(goalId) {
        const goal = this.availableGoals.find(g => g.id === goalId);
        if (goal) {
            this.manualOverride = true;
            this.manualGoal = goal;
            this.currentGoal = goal;
            this.makePlan();
            return true;
        }
        return false;
    }
    
    // 取消手动覆盖，恢复自动
    setAutoMode() {
        this.manualOverride = false;
        this.manualGoal = null;
        this.planTimer = 0; // 立即重新评估
    }
    
    // 评估最佳目标
    evaluateBestGoal() {
        // 如果有手动覆盖，使用手动目标
        if (this.manualOverride && this.manualGoal) {
            return this.manualGoal;
        }
        
        // 根据当前状态评估优先级
        let bestGoal = null;
        let highestPriority = -1;
        
        // 能量极低 -> 优先休息或吃饭
        if (this.player.energy < 20) {
            if (this.player.energy < 10) {
                return this.availableGoals.find(g => g.id === 'rest');
            }
            return this.availableGoals.find(g => g.id === 'eat');
        }
        
        // 能量较低 -> 考虑吃饭
        if (this.player.energy < 40) {
            const eatGoal = this.availableGoals.find(g => g.id === 'eat');
            if (eatGoal && eatGoal.priority > highestPriority) {
                bestGoal = eatGoal;
                highestPriority = eatGoal.priority;
            }
        }
        
        // 从gameState获取时间（game是Game实例）
        let hours = 12; // 默认中午
        if (this.gameState && this.gameState.gameTime) {
            hours = Math.floor(this.gameState.gameTime / 60) % 24;
        }
        
        // 餐时优先吃饭
        if ((hours === 8 || hours === 12 || hours === 18) && this.player.energy < 70) {
            return this.availableGoals.find(g => g.id === 'eat');
        }
        
        // 晚上优先休息
        if (hours >= 22 || hours <= 6) {
            return this.availableGoals.find(g => g.id === 'rest');
        }
        
        // 默认选择工作
        return this.availableGoals.find(g => g.id === 'work');
    }
    
    // 制定计划
    makePlan() {
        if (!this.currentGoal) return;
        
        // 根据目标生成简单计划
        this.currentPlan = this.generatePlanForGoal(this.currentGoal);
        this.currentAction = null;
        
        console.log(`玩家计划 [${this.currentGoal.name}]:`, 
                    this.currentPlan.map(a => a.name).join(' -> '));
    }
    
    // 为目标生成计划
    generatePlanForGoal(goal) {
        const plan = [];
        
        switch(goal.id) {
            case 'work':
                plan.push({ name: '移动到工作地点', type: 'move', target: 'flowerShop' });
                plan.push({ name: '开始工作', type: 'work', duration: 5000 });
                break;
                
            case 'eat':
                plan.push({ name: '去饭店', type: 'move', target: 'restaurant' });
                plan.push({ name: '点餐', type: 'action', duration: 1000 });
                plan.push({ name: '用餐', type: 'eat', duration: 3000 });
                break;
                
            case 'rest':
                plan.push({ name: '回家', type: 'move', target: 'playerHouse' });
                plan.push({ name: '睡觉', type: 'rest', duration: 10000 });
                break;
                
            case 'explore':
                // 随机选择几个点逛逛
                const locations = ['park', 'dock', 'townHall'];
                const target = locations[Math.floor(Math.random() * locations.length)];
                plan.push({ name: '漫步', type: 'wander', target: target, duration: 8000 });
                break;
                
            case 'visit':
                plan.push({ name: '去找朋友', type: 'move', target: 'npc1House' });
                plan.push({ name: '聊天', type: 'talk', duration: 3000 });
                break;
                
            case 'fishing':
                plan.push({ name: '去码头', type: 'move', target: 'dock' });
                plan.push({ name: '钓鱼', type: 'fish', duration: 6000 });
                break;
                
            case 'shopping':
                const shops = ['flowerShop', 'fishShop', 'toolShop'];
                const shop = shops[Math.floor(Math.random() * shops.length)];
                plan.push({ name: '去商店', type: 'move', target: shop });
                plan.push({ name: '购物', type: 'shop', duration: 2000 });
                break;
        }
        
        return plan;
    }
    
    // 更新（每帧调用）
    update(deltaTime, map, npcs) {
        this.planTimer++;
        
        // 定期重新评估目标
        if (this.planTimer >= this.planInterval) {
            this.planTimer = 0;
            
            if (!this.manualOverride) {
                const newGoal = this.evaluateBestGoal();
                if (!this.currentGoal || newGoal.id !== this.currentGoal.id) {
                    this.currentGoal = newGoal;
                    this.makePlan();
                }
            }
        }
        
        // 执行当前计划
        if (this.currentPlan.length > 0 || this.currentAction) {
            this.executePlan(deltaTime, map);
        } else {
            // 计划完成，重新开始
            this.makePlan();
        }
        
        // 更新状态显示
        this.updateStatus();
    }
    
    // 执行计划
    executePlan(deltaTime, map) {
        // 获取当前行动
        if (!this.currentAction && this.currentPlan.length > 0) {
            this.currentAction = this.currentPlan.shift();
            this.currentAction.startTime = Date.now();
        }
        
        if (!this.currentAction) return;
        
        const action = this.currentAction;
        
        switch(action.type) {
            case 'move':
                this.executeMove(action, map);
                break;
                
            case 'work':
            case 'eat':
            case 'rest':
            case 'talk':
            case 'fish':
            case 'shop':
                this.executeTimedAction(action, deltaTime);
                break;
                
            case 'wander':
                this.executeWander(action, map, deltaTime);
                break;
        }
    }
    
    // 执行移动
    executeMove(action, map) {
        const targetPos = map.getBuildingPosition(action.target);
        if (!targetPos) {
            console.warn('Target not found:', action.target);
            this.currentAction = null;
            return;
        }
        
        const dx = targetPos.x - this.player.x;
        const dy = targetPos.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            // 到达目标
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isMoving = false;
            this.currentAction = null;
            console.log('Player arrived at:', action.target);
            return;
        }
        
        // 计算速度
        const speed = this.player.energy < 30 ? 1.2 : 2.0;
        
        // 设置速度
        this.player.vx = (dx / distance) * speed;
        this.player.vy = (dy / distance) * speed;
        
        // 应用移动
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // 更新方向和动画
        this.player.isMoving = true;
        if (Math.abs(this.player.vx) > Math.abs(this.player.vy)) {
            this.player.direction = this.player.vx > 0 ? 'right' : 'left';
        } else {
            this.player.direction = this.player.vy > 0 ? 'down' : 'up';
        }
        
        // 更新动画帧
        if (!this.player.animationTimer) this.player.animationTimer = 0;
        this.player.animationTimer++;
        if (this.player.animationTimer > 6) {
            this.player.animationFrame = (this.player.animationFrame + 1) % 4;
            this.player.animationTimer = 0;
        }
        
        // 消耗能量
        if (typeof this.player.consumeEnergy === 'function') {
            this.player.consumeEnergy(0.02);
        } else {
            this.player.energy = Math.max(0, this.player.energy - 0.02);
        }
    }
    
    // 执行定时动作
    executeTimedAction(action, deltaTime) {
        const elapsed = Date.now() - action.startTime;
        
        // 停止移动
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.isMoving = false;
        
        // 根据动作类型处理
        switch(action.type) {
            case 'work':
                // 工作消耗能量
                if (Math.random() < 0.1) {
                    this.player.consumeEnergy(0.1);
                }
                break;
                
            case 'eat':
                // 吃饭恢复能量
                if (Math.random() < 0.1) {
                    this.player.restoreEnergy(1);
                }
                break;
                
            case 'rest':
                // 休息大幅恢复
                if (Math.random() < 0.2) {
                    this.player.restoreEnergy(2);
                }
                break;
        }
        
        // 检查是否完成
        if (elapsed >= action.duration) {
            this.currentAction = null;
        }
    }
    
    // 执行漫步
    executeWander(action, map, deltaTime) {
        const elapsed = Date.now() - action.startTime;
        
        if (elapsed >= action.duration) {
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.isMoving = false;
            this.currentAction = null;
            return;
        }
        
        // 随机漫步
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            this.player.vx = Math.cos(angle) * 1.0;
            this.player.vy = Math.sin(angle) * 1.0;
        }
        
        // 应用移动
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // 边界检查
        this.player.x = Math.max(0, Math.min(this.player.x, map.pixelWidth - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, map.pixelHeight - this.player.height));
        
        this.player.isMoving = true;
        this.player.consumeEnergy(0.01);
    }
    
    // 更新状态显示
    updateStatus() {
        this.state.energy = this.player.energy;
    }
    
    // 获取当前状态描述
    getCurrentStatus() {
        if (!this.currentGoal) {
            return { text: '思考中...', icon: '🤔', progress: 0 };
        }
        
        let actionText = '';
        let progress = 0;
        
        if (this.currentAction) {
            const elapsed = Date.now() - (this.currentAction.startTime || Date.now());
            const duration = this.currentAction.duration || 1000;
            progress = Math.min(100, (elapsed / duration) * 100);
            
            switch(this.currentAction.type) {
                case 'move':
                    actionText = '正在移动';
                    progress = 50;
                    break;
                case 'work':
                    actionText = '工作中';
                    break;
                case 'eat':
                    actionText = '用餐中';
                    break;
                case 'rest':
                    actionText = '休息中';
                    break;
                case 'fish':
                    actionText = '钓鱼中';
                    break;
                default:
                    actionText = this.currentAction.name;
            }
        } else {
            actionText = '准备中';
        }
        
        return {
            goal: this.currentGoal,
            action: actionText,
            text: `${this.currentGoal.icon} ${this.currentGoal.name} - ${actionText}`,
            icon: this.currentGoal.icon,
            progress: progress,
            isManual: this.manualOverride
        };
    }
    
    // 获取可用的目标列表
    getAvailableGoals() {
        return this.availableGoals;
    }
    
    // 获取计划步骤
    getPlanSteps() {
        const steps = [];
        
        // 已完成/正在进行的步骤
        if (this.currentAction) {
            steps.push({
                name: this.currentAction.name,
                status: 'doing',
                icon: '▶️'
            });
        }
        
        // 待执行的步骤
        for (const action of this.currentPlan) {
            steps.push({
                name: action.name,
                status: 'pending',
                icon: '⏳'
            });
        }
        
        return steps;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerGOAPAgent;
}