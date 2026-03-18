/**
 * GOAP (Goal-Oriented Action Planning) AI 系统
 * 让NPC根据身份自主规划行为
 */

// 世界状态管理
class WorldState {
    constructor() {
        this.state = {
            time: 'morning', // morning, afternoon, evening, night
            playerNearby: false,
            hasFlowers: false,
            hasFish: false,
            hasFruits: false,
            isTired: false,
            isHungry: false,
            money: 0,
            energy: 100,
            atHome: false,
            atWork: false,
            atWater: false,
            hasTool: false
        };
        this.npcs = new Map();
    }
    
    updateTime(gameTime) {
        const hours = gameTime / 60;
        if (hours >= 6 && hours < 12) this.state.time = 'morning';
        else if (hours >= 12 && hours < 18) this.state.time = 'afternoon';
        else if (hours >= 18 && hours < 22) this.state.time = 'evening';
        else this.state.time = 'night';
    }
    
    get(key) {
        return this.state[key];
    }
    
    set(key, value) {
        this.state[key] = value;
    }
    
    // 复制状态用于规划
    clone() {
        const newState = new WorldState();
        newState.state = { ...this.state };
        return newState;
    }
}

// GOAP 行动基类
class GOAPAction {
    constructor(name, cost = 1) {
        this.name = name;
        this.cost = cost;
        this.preconditions = {}; // 前置条件
        this.effects = {}; // 执行后的效果
        this.duration = 1000; // 执行时间(ms)
        this.isRunning = false;
    }
    
    // 检查是否满足前置条件
    checkProceduralPrecondition(agent, worldState) {
        return true;
    }
    
    // 检查状态是否满足前置条件
    preconditionsMet(state) {
        for (const [key, value] of Object.entries(this.preconditions)) {
            if (state[key] !== value) return false;
        }
        return true;
    }
    
    // 应用效果到状态
    applyEffects(state) {
        for (const [key, value] of Object.entries(this.effects)) {
            state[key] = value;
        }
    }
    
    // 执行行动（子类重写）
    perform(agent, worldState, deltaTime) {
        return true; // true = 完成
    }
    
    // 是否完成
    isDone() {
        return !this.isRunning;
    }
    
    // 重置
    reset() {
        this.isRunning = false;
    }
}

// GOAP 规划器
class GOAPPlanner {
    // A*算法找最优行动序列
    plan(agent, availableActions, worldState, goal) {
        // 重置所有行动
        availableActions.forEach(a => a.reset());
        
        // 找到可用的行动（满足前置条件）
        const usableActions = availableActions.filter(a => 
            a.checkProceduralPrecondition(agent, worldState)
        );
        
        // 构建规划树
        const root = {
            state: worldState.clone(),
            action: null,
            parent: null,
            cost: 0
        };
        
        const leaves = [];
        const open = [root];
        
        while (open.length > 0) {
            // 找最低成本节点
            open.sort((a, b) => a.cost - b.cost);
            const current = open.shift();
            
            // 检查是否满足目标
            if (this.goalMet(current.state, goal)) {
                leaves.push(current);
                continue;
            }
            
            // 扩展节点
            for (const action of usableActions) {
                if (action.preconditionsMet(current.state)) {
                    const newState = current.state.clone();
                    action.applyEffects(newState);
                    
                    const node = {
                        state: newState,
                        action: action,
                        parent: current,
                        cost: current.cost + action.cost
                    };
                    
                    open.push(node);
                }
            }
        }
        
        // 找到最优路径
        if (leaves.length === 0) return null;
        
        leaves.sort((a, b) => a.cost - b.cost);
        return this.buildPlan(leaves[0]);
    }
    
    // 检查目标是否满足
    goalMet(state, goal) {
        for (const [key, value] of Object.entries(goal)) {
            if (state[key] !== value) return false;
        }
        return true;
    }
    
    // 构建行动计划
    buildPlan(endNode) {
        const plan = [];
        let current = endNode;
        
        while (current.parent) {
            if (current.action) {
                plan.unshift(current.action);
            }
            current = current.parent;
        }
        
        return plan;
    }
}

// ==================== 具体行动定义 ====================

// 移动回家行动
class MoveHomeAction extends GOAPAction {
    constructor() {
        super('MoveHome', 1);
        this.preconditions = {};
        this.effects = { atHome: true };
    }
    
    perform(agent, worldState, deltaTime, gameplay) {
        this.isRunning = true;
        
        const map = gameplay.game.map;
        const homePos = getBuildingPosition(map, agent.homeBuilding);
        
        const dx = homePos.x - agent.x;
        const dy = homePos.y - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            agent.vx = 0;
            agent.vy = 0;
            this.isRunning = false;
            return true;
        }
        
        // 向目标移动
        const speed = 1.5;
        agent.vx = (dx / distance) * speed;
        agent.vy = (dy / distance) * speed;
        
        return false;
    }
}

// 移动去工作行动
class MoveToWorkAction extends GOAPAction {
    constructor() {
        super('MoveToWork', 1);
        this.preconditions = {};
        this.effects = { atWork: true };
    }
    
    perform(agent, worldState, deltaTime, gameplay) {
        this.isRunning = true;
        
        const map = gameplay.game.map;
        const workPos = getBuildingPosition(map, agent.workBuilding);
        
        const dx = workPos.x - agent.x;
        const dy = workPos.y - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            agent.vx = 0;
            agent.vy = 0;
            this.isRunning = false;
            return true;
        }
        
        // 向目标移动
        const speed = 1.5;
        agent.vx = (dx / distance) * speed;
        agent.vy = (dy / distance) * speed;
        
        return false;
    }
}

// 种花行动
class PlantFlowerAction extends GOAPAction {
    constructor() {
        super('PlantFlower', 2);
        this.preconditions = { hasTool: true, energy: 20 };
        this.effects = { hasFlowers: true, energy: -10 };
        this.duration = 2000;
    }
    
    perform(agent, worldState, deltaTime) {
        this.isRunning = true;
        
        // 在NPC位置种花
        // 这里简化处理，实际应该调用gameplay的种花逻辑
        
        this.isRunning = false;
        return true;
    }
}

// 浇花行动
class WaterFlowerAction extends GOAPAction {
    constructor() {
        super('WaterFlower', 1);
        this.preconditions = { hasTool: true };
        this.effects = { energy: -5 };
    }
}

// 钓鱼行动
class FishAction extends GOAPAction {
    constructor() {
        super('Fish', 3);
        this.preconditions = { atWater: true, hasTool: true, energy: 30 };
        this.effects = { hasFish: true, energy: -15 };
        this.fishTime = 0;
    }
    
    perform(agent, worldState, deltaTime) {
        this.isRunning = true;
        this.fishTime += deltaTime;
        
        if (this.fishTime >= 3000) {
            this.fishTime = 0;
            this.isRunning = false;
            return true;
        }
        
        return false;
    }
}

// 砍树行动
class ChopTreeAction extends GOAPAction {
    constructor() {
        super('ChopTree', 2);
        this.preconditions = { hasTool: true, energy: 25 };
        this.effects = { hasFruits: true, energy: -10 };
    }
}

// 休息行动
class RestAction extends GOAPAction {
    constructor() {
        super('Rest', 1);
        this.preconditions = { atHome: true };
        this.effects = { energy: 100, isTired: false };
        this.restTime = 0;
    }
    
    perform(agent, worldState, deltaTime) {
        this.isRunning = true;
        this.restTime += deltaTime;
        
        if (this.restTime >= 5000) {
            this.restTime = 0;
            this.isRunning = false;
            return true;
        }
        
        return false;
    }
}

// 吃东西行动
class EatAction extends GOAPAction {
    constructor() {
        super('Eat', 1);
        this.preconditions = { hasFruits: true };
        this.effects = { isHungry: false, energy: 20, hasFruits: false };
    }
}

// 与玩家互动
class InteractWithPlayerAction extends GOAPAction {
    constructor() {
        super('InteractWithPlayer', 1);
        this.preconditions = { playerNearby: true };
        this.effects = {};
    }
}

// ==================== NPC GOAP Agent ====================

class GOAPAgent {
    constructor(npc, role, worldState) {
        this.npc = npc;
        this.role = role;
        this.worldState = worldState;
        this.planner = new GOAPPlanner();
        this.currentPlan = [];
        this.currentAction = null;
        this.goals = this.setupGoals();
        this.actions = this.setupActions();
        this.currentGoal = null;
        this.planTimer = 0;
        this.replanInterval = 300; // 5秒重新规划一次
    }
    
    // 设置目标
    setupGoals() {
        const goals = {
            gardener: [
                { hasFlowers: true, atWork: true }, // 工作目标
                { energy: 100, atHome: true }, // 休息目标
                { isHungry: false } // 进食目标
            ],
            fisherman: [
                { hasFish: true, atWater: true },
                { energy: 100, atHome: true },
                { isHungry: false }
            ],
            miner: [
                { money: 50 }, // 赚钱目标
                { energy: 100, atHome: true },
                { isHungry: false }
            ],
            villager: [
                { isHungry: false },
                { energy: 50 },
                { atHome: true }
            ]
        };
        return goals[this.role] || goals.villager;
    }
    
    // 设置行动
    setupActions() {
        const actions = [];
        
        // 移动行动
        actions.push(new MoveHomeAction());
        actions.push(new MoveToWorkAction());
        
        // 基础行动
        actions.push(new RestAction());
        actions.push(new EatAction());
        actions.push(new InteractWithPlayerAction());
        
        // 职业相关行动
        if (this.role === 'gardener') {
            actions.push(new PlantFlowerAction());
            actions.push(new WaterFlowerAction());
        } else if (this.role === 'fisherman') {
            actions.push(new FishAction());
        } else if (this.role === 'miner') {
            actions.push(new ChopTreeAction());
        }
        
        return actions;
    }
    
    // 更新状态
    update(deltaTime, gameplay) {
        this.planTimer++;
        
        // 更新世界状态
        this.updateWorldState(gameplay);
        
        // 定期重新规划（如果没有当前行动或计划为空）
        if (this.planTimer >= this.replanInterval) {
            this.planTimer = 0;
            // 只有在没有正在执行的移动时才重新规划
            if (!this.currentAction || this.currentAction.isDone()) {
                this.selectGoal();
                this.makePlan();
            }
        }
        
        // 如果当前行动完成，获取下一个
        if ((!this.currentAction || this.currentAction.isDone()) && this.currentPlan.length > 0) {
            this.currentAction = this.currentPlan.shift();
            if (this.currentAction) {
                this.currentAction.reset();
            }
        }
        
        // 根据行动更新NPC移动
        this.updateMovement(gameplay);
    }
    
    // 更新世界状态
    updateWorldState(gameplay) {
        // 检查能量
        this.worldState.set('energy', this.npc.energy || 100);
        this.worldState.set('isTired', (this.npc.energy || 100) < 30);
        
        // 检查玩家是否 nearby
        const player = gameplay.game.player;
        const dx = this.npc.x - player.x;
        const dy = this.npc.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.worldState.set('playerNearby', distance < 60);
        
        // 检查是否在家/在工作地点
        const map = gameplay.game.map;
        if (map && map.BUILDINGS) {
            const homePos = getBuildingPosition(map, this.npc.homeBuilding);
            const workPos = getBuildingPosition(map, this.npc.workBuilding);
            
            const distToHome = Math.sqrt(
                Math.pow(this.npc.x - homePos.x, 2) + 
                Math.pow(this.npc.y - homePos.y, 2)
            );
            const distToWork = Math.sqrt(
                Math.pow(this.npc.x - workPos.x, 2) + 
                Math.pow(this.npc.y - workPos.y, 2)
            );
            
            this.worldState.set('atHome', distToHome < 50);
            this.worldState.set('atWork', distToWork < 50);
        }
    }
    
    // 选择目标（基于优先级）
    selectGoal() {
        // 优先级：低能量 > 饥饿 > 工作
        if (this.worldState.get('isTired')) {
            this.currentGoal = { energy: 100, atHome: true };
        } else if (this.worldState.get('isHungry')) {
            this.currentGoal = { isHungry: false };
        } else {
            // 随机选择一个工作目标
            this.currentGoal = this.goals[0];
        }
    }
    
    // 制定计划
    makePlan() {
        const plan = this.planner.plan(
            this.npc,
            this.actions,
            this.worldState,
            this.currentGoal
        );
        
        if (plan) {
            this.currentPlan = plan;
            console.log(`${this.npc.name} 的计划:`, plan.map(a => a.name).join(' -> '));
        }
    }
    
    // 更新NPC移动
    updateMovement(gameplay) {
        if (!this.currentAction) {
            this.npc.vx = 0;
            this.npc.vy = 0;
            this.npc.isMoving = false;
            return;
        }
        
        // 执行当前行动的移动逻辑
        const finished = this.currentAction.perform(this.npc, this.worldState, 16, gameplay);
        
        // 检查是否完成
        if (finished) {
            this.currentAction.applyEffects(this.worldState);
            this.currentAction.reset();
            this.currentAction = null;
        }
        
        // 根据行动类型处理状态
        if (this.currentAction && this.currentAction.name === 'Rest') {
            this.npc.vx = 0;
            this.npc.vy = 0;
            this.npc.isMoving = false;
            // 恢复能量
            this.npc.energy = Math.min(100, (this.npc.energy || 100) + 0.5);
        } else if (this.currentAction && this.currentAction.name === 'Fish') {
            // 钓鱼时静止
            this.npc.vx = 0;
            this.npc.vy = 0;
            this.npc.isMoving = false;
            this.npc.energy = Math.max(0, (this.npc.energy || 100) - 0.1);
        } else {
            // 其他行动（移动）消耗能量
            this.npc.isMoving = (this.npc.vx !== 0 || this.npc.vy !== 0);
            if (this.npc.isMoving) {
                this.npc.energy = Math.max(0, (this.npc.energy || 100) - 0.05);
            }
        }
        
        // 更新朝向
        if (this.npc.vx !== 0 || this.npc.vy !== 0) {
            if (Math.abs(this.npc.vx) > Math.abs(this.npc.vy)) {
                this.npc.direction = this.npc.vx > 0 ? 'right' : 'left';
            } else {
                this.npc.direction = this.npc.vy > 0 ? 'down' : 'up';
            }
        }
    }
}

// ==================== NPC 身份配置 - 大富翁小镇版 ====================

const NPC_ROLES = {
    阿狸: {
        role: 'gardener',
        homeBuilding: 'npc1House',
        workBuilding: 'flowerShop',
        color: '#FF6B6B',
        icon: '🌸',
        dialogues: ['欢迎来我的花店！', '今天的玫瑰开得很美~', '买点种子回去种吧！', '种花可是我的最爱！']
    },
    小橘: {
        role: 'fisherman',
        homeBuilding: 'npc2House',
        workBuilding: 'dock',
        color: '#4ECDC4',
        icon: '🎣',
        dialogues: ['码头今天的鱼很多！', '刚钓到的鲈鱼，新鲜！', '要不要学钓鱼？', '我的渔具店有卖鱼竿哦！']
    },
    小白: {
        role: 'miner',
        homeBuilding: 'npc3House',
        workBuilding: 'toolShop',
        color: '#FFE66D',
        icon: '⛏️',
        dialogues: ['工具店新到了镐子！', '挖矿需要好工具~', '要小心安全哦！', '我的工具质量最好！']
    }
};

// 从地图获取建筑位置
function getBuildingPosition(map, buildingKey) {
    if (!map || !map.BUILDINGS) return { x: 500, y: 500 };
    const building = map.BUILDINGS[buildingKey];
    if (!building) return { x: 500, y: 500 };
    
    // 返回建筑入口位置（底部中间）
    return {
        x: (building.x + building.w / 2) * map.tileSize,
        y: (building.y + building.h) * map.tileSize
    };
}

// NPC状态显示
function getNPCStatus(npc, agent) {
    if (!agent || !agent.currentAction) return '💤 空闲';

    const actionName = agent.currentAction.name;

    if (actionName === 'Rest') return '😴 休息中';
    if (actionName === 'Fish') return '🎣 钓鱼中';
    if (actionName === 'PlantFlower') return '🌱 种花中';
    if (actionName === 'WaterFlower') return '💧 浇花中';
    if (actionName === 'ChopTree') return '🪓 工作中';
    if (actionName === 'Eat') return '🍎 进食中';
    if (actionName.startsWith('MoveTo')) return '🚶 移动中';
    if (actionName === 'InteractWithPlayer') return '💬 对话中';

    return '🎯 工作中';
}

// 模块导出（用于测试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorldState,
        GOAPAction,
        GOAPPlanner,
        GOAPAgent,
        MoveHomeAction,
        MoveToWorkAction,
        RestAction,
        EatAction,
        FishAction,
        getBuildingPosition,
        getNPCStatus,
        NPC_ROLES
    };
}
