/**
 * 标准GOAP (Goal-Oriented Action Planning) 系统
 * 
 * 参考实现:
 * - https://github.com/crashkonijn/GOAP
 * - https://github.com/sploreg/goap
 */

// ==================== 核心类 ====================

/**
 * 世界状态 - 用于规划和执行的键值对存储
 */
class WorldState {
    constructor() {
        this.state = new Map();
    }

    set(key, value) {
        this.state.set(key, value);
    }

    get(key) {
        return this.state.get(key);
    }

    has(key) {
        return this.state.has(key);
    }

    clone() {
        const cloned = new WorldState();
        for (const [key, value] of this.state) {
            cloned.set(key, value);
        }
        return cloned;
    }

    equals(other) {
        if (this.state.size !== other.state.size) return false;
        for (const [key, value] of this.state) {
            if (other.get(key) !== value) return false;
        }
        return true;
    }

    toString() {
        const entries = [];
        for (const [key, value] of this.state) {
            entries.push(`${key}:${value}`);
        }
        return entries.join(',');
    }
}

/**
 * GOAP目标 - 定义Agent想要达到的状态
 */
class GOAPGoal {
    constructor(name, priority = 1) {
        this.name = name;
        this.priority = priority;
        this.desiredState = new WorldState();
    }

    addDesiredState(key, value) {
        this.desiredState.set(key, value);
    }

    getPriority(agent, worldState) {
        return this.priority;
    }
}

/**
 * GOAP行动 - 定义可以执行的动作
 */
class GOAPAction {
    constructor(name, cost = 1) {
        this.name = name;
        this.cost = cost;
        this.preconditions = new WorldState();
        this.effects = new WorldState();
        this.inRange = false;
        this.target = null;
    }

    addPrecondition(key, value) {
        this.preconditions.set(key, value);
    }

    addEffect(key, value) {
        this.effects.set(key, value);
    }

    // 检查是否在范围内执行（子类可覆盖）
    requiresInRange() {
        return false;
    }

    // 设置目标位置
    setTarget(target) {
        this.target = target;
    }

    // 检查是否满足前置条件
    checkProceduralPrecondition(agent, worldState) {
        return true;
    }

    // 检查状态是否满足前置条件
    preconditionsMet(state) {
        for (const [key, value] of this.preconditions.state) {
            if (state.get(key) !== value) return false;
        }
        return true;
    }

    // 应用效果到状态
    applyEffects(state) {
        for (const [key, value] of this.effects.state) {
            state.set(key, value);
        }
    }

    // 执行行动（子类重写）
    perform(agent, deltaTime, gameplay) {
        return true; // true = 完成
    }

    // 是否在范围内
    isInRange(agent) {
        if (!this.requiresInRange() || !this.target) return true;
        const dx = agent.x - this.target.x;
        const dy = agent.y - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 10;
    }

    // 移动到目标
    moveToTarget(agent, map) {
        if (!this.target) {
            agent.vx = 0;
            agent.vy = 0;
            return false;
        }

        const dx = this.target.x - agent.x;
        const dy = this.target.y - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            agent.vx = 0;
            agent.vy = 0;
            return true; // 到达目标
        }

        // 使用A*寻路
        if (!this.path || this.pathIndex >= this.path.length) {
            this.path = map.findPath(agent.x, agent.y, this.target.x, this.target.y);
            this.pathIndex = 0;
        }

        if (this.path && this.path.length > 0) {
            const currentTarget = this.path[this.pathIndex];
            const tdx = currentTarget.x - agent.x;
            const tdy = currentTarget.y - agent.y;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

            if (tdist < 5) {
                this.pathIndex++;
                if (this.pathIndex >= this.path.length) {
                    agent.vx = 0;
                    agent.vy = 0;
                    return true;
                }
            } else {
                const speed = 1.5;
                agent.vx = (tdx / tdist) * speed;
                agent.vy = (tdy / tdist) * speed;
            }
        } else {
            // 直接移动（备用）
            const speed = 1.5;
            agent.vx = (dx / distance) * speed;
            agent.vy = (dy / distance) * speed;
        }

        return false;
    }

    reset() {
        this.inRange = false;
        this.target = null;
        this.path = null;
        this.pathIndex = 0;
    }
}

/**
 * GOAP节点 - 用于规划的节点
 */
class Node {
    constructor(parent, runningCost, worldState, action) {
        this.parent = parent;
        this.runningCost = runningCost;
        this.worldState = worldState;
        this.action = action;
    }
}

/**
 * GOAP规划器 - 使用反向规划找到行动序列
 */
class GOAPPlanner {
    plan(agent, availableActions, worldState, goal) {
        // 重置所有行动
        availableActions.forEach(a => a.reset());

        // 过滤可用的行动
        const usableActions = availableActions.filter(a =>
            a.checkProceduralPrecondition(agent, worldState)
        );

        // 目标状态
        const goalState = goal.desiredState;

        // 使用反向规划：从目标状态倒推
        const openList = [];
        const closedList = new Set();

        // 起始节点是目标状态
        const startNode = new Node(null, 0, goalState.clone(), null);
        openList.push(startNode);

        let iterations = 0;
        const MAX_ITERATIONS = 100;

        while (openList.length > 0 && iterations < MAX_ITERATIONS) {
            iterations++;

            // 找成本最低的节点
            openList.sort((a, b) => a.runningCost - b.runningCost);
            const currentNode = openList.shift();

            // 检查是否达到当前世界状态
            if (this.worldStateMatches(currentNode.worldState, worldState)) {
                // 找到路径，重建行动序列
                return this.buildActionSequence(currentNode);
            }

            const stateKey = currentNode.worldState.toString();
            if (closedList.has(stateKey)) continue;
            closedList.add(stateKey);

            // 反向扩展：找能产生当前状态的行动
            for (const action of usableActions) {
                // 检查行动的效果是否能满足当前节点的状态
                if (this.actionEffectsSatisfyState(action, currentNode.worldState)) {
                    const newState = this.applyActionEffectsBackward(action, currentNode.worldState);
                    const newCost = currentNode.runningCost + action.cost;

                    const newNode = new Node(currentNode, newCost, newState, action);
                    openList.push(newNode);
                }
            }
        }

        return null; // 找不到路径
    }

    // 检查行动效果是否能满足状态
    actionEffectsSatisfyState(action, state) {
        for (const [key, value] of state.state) {
            if (action.effects.has(key)) {
                if (action.effects.get(key) === value) {
                    return true;
                }
            }
        }
        return false;
    }

    // 反向应用行动效果（用于反向规划）
    applyActionEffectsBackward(action, state) {
        const newState = state.clone();
        // 移除被行动设置的状态（反向）
        for (const key of action.effects.state.keys()) {
            newState.state.delete(key);
        }
        // 添加前置条件到状态
        for (const [key, value] of action.preconditions.state) {
            newState.set(key, value);
        }
        return newState;
    }

    // 检查世界状态是否匹配
    worldStateMatches(state1, state2) {
        for (const [key, value] of state1.state) {
            if (state2.get(key) !== value) return false;
        }
        return true;
    }

    // 重建行动序列
    buildActionSequence(node) {
        const actions = [];
        let current = node;

        while (current && current.action) {
            actions.unshift(current.action);
            current = current.parent;
        }

        return actions;
    }
}

// ==================== 具体行动定义 ====================

// 移动到家行动
class GoHomeAction extends GOAPAction {
    constructor() {
        super('GoHome', 1);
        this.addPrecondition('atHome', false);
        this.addEffect('atHome', true);
    }

    requiresInRange() {
        return true;
    }

    checkProceduralPrecondition(agent, worldState) {
        return !!agent.homeBuilding;
    }

    setTargetFromAgent(agent, map) {
        const pos = getBuildingPosition(map, agent.homeBuilding);
        if (pos) this.setTarget(pos);
    }

    perform(agent, deltaTime, gameplay) {
        if (!this.target) return true;
        return this.moveToTarget(agent, gameplay.game.map);
    }
}

// 移动去工作行动
class GoToWorkAction extends GOAPAction {
    constructor() {
        super('GoToWork', 1);
        this.addPrecondition('atWork', false);
        this.addEffect('atWork', true);
    }

    requiresInRange() {
        return true;
    }

    checkProceduralPrecondition(agent, worldState) {
        return !!agent.workBuilding;
    }

    setTargetFromAgent(agent, map) {
        const pos = getBuildingPosition(map, agent.workBuilding);
        if (pos) this.setTarget(pos);
    }

    perform(agent, deltaTime, gameplay) {
        if (!this.target) return true;
        return this.moveToTarget(agent, gameplay.game.map);
    }
}

// 移动去饭店行动
class GoToRestaurantAction extends GOAPAction {
    constructor() {
        super('GoToRestaurant', 1);
        this.addPrecondition('atRestaurant', false);
        this.addEffect('atRestaurant', true);
    }

    requiresInRange() {
        return true;
    }

    setTargetFromAgent(agent, map) {
        const pos = getBuildingPosition(map, 'restaurant');
        if (pos) this.setTarget(pos);
    }

    perform(agent, deltaTime, gameplay) {
        if (!this.target) return true;
        return this.moveToTarget(agent, gameplay.game.map);
    }
}

// 休息行动
class RestAction extends GOAPAction {
    constructor() {
        super('Rest', 1);
        this.addPrecondition('atHome', true);
        this.addPrecondition('isTired', true);
        this.addEffect('isTired', false);
        this.addEffect('energy', 100);
        this.restTime = 0;
    }

    perform(agent, deltaTime, gameplay) {
        this.restTime += deltaTime;
        agent.vx = 0;
        agent.vy = 0;

        // 恢复能量
        if (this.restTime > 100) {
            agent.energy = Math.min(100, (agent.energy || 100) + 1);
            this.restTime = 0;
        }

        // 休息5秒
        if (this.restTime >= 5000) {
            this.restTime = 0;
            return true;
        }
        return false;
    }

    reset() {
        super.reset();
        this.restTime = 0;
    }
}

// 工作行动（通用）
class WorkAction extends GOAPAction {
    constructor() {
        super('Work', 1);
        this.addPrecondition('atWork', true);
        this.addEffect('hasWorked', true);
        this.workTime = 0;
    }

    perform(agent, deltaTime, gameplay) {
        this.workTime += deltaTime;
        agent.vx = 0;
        agent.vy = 0;

        // 消耗能量
        if (this.workTime > 200) {
            agent.energy = Math.max(0, (agent.energy || 100) - 0.5);
            this.workTime = 0;
        }

        // 工作3秒
        if (this.workTime >= 3000) {
            this.workTime = 0;
            return true;
        }
        return false;
    }

    reset() {
        super.reset();
        this.workTime = 0;
    }
}

// 吃饭行动
class EatAction extends GOAPAction {
    constructor() {
        super('Eat', 1);
        this.addPrecondition('atRestaurant', true);
        this.addPrecondition('isHungry', true);
        this.addEffect('isHungry', false);
        this.addEffect('energy', 80);
        this.eatTime = 0;
    }

    perform(agent, deltaTime, gameplay) {
        this.eatTime += deltaTime;
        agent.vx = 0;
        agent.vy = 0;

        // 恢复能量
        if (this.eatTime > 100) {
            agent.energy = Math.min(100, (agent.energy || 100) + 2);
            this.eatTime = 0;
        }

        // 吃饭3秒
        if (this.eatTime >= 3000) {
            this.eatTime = 0;
            return true;
        }
        return false;
    }

    reset() {
        super.reset();
        this.eatTime = 0;
    }
}

// ==================== GOAP Agent ====================

class GOAPAgent {
    constructor(npc, role) {
        this.npc = npc;
        this.role = role;
        this.planner = new GOAPPlanner();
        this.goals = [];
        this.actions = [];
        this.currentGoal = null;
        this.currentPlan = [];
        this.currentActionIndex = 0;
        this.worldState = new WorldState();

        this.setupGoals();
        this.setupActions();
    }

    setupGoals() {
        // 休息目标
        const restGoal = new GOAPGoal('Rest', 10);
        restGoal.addDesiredState('isTired', false);
        restGoal.addDesiredState('energy', 100);
        this.goals.push(restGoal);

        // 吃饭目标
        const eatGoal = new GOAPGoal('Eat', 8);
        eatGoal.addDesiredState('isHungry', false);
        this.goals.push(eatGoal);

        // 工作目标
        const workGoal = new GOAPGoal('Work', 5);
        workGoal.addDesiredState('hasWorked', true);
        workGoal.addDesiredState('atWork', true);
        this.goals.push(workGoal);
    }

    setupActions() {
        this.actions.push(new GoHomeAction());
        this.actions.push(new GoToWorkAction());
        this.actions.push(new GoToRestaurantAction());
        this.actions.push(new RestAction());
        this.actions.push(new WorkAction());
        this.actions.push(new EatAction());
    }

    update(deltaTime, gameplay, gameTime) {
        // 更新世界状态
        this.updateWorldState(gameplay, gameTime);

        // 选择最高优先级的目标
        const newGoal = this.selectGoal();

        // 如果目标改变或没有计划，重新规划
        if (newGoal !== this.currentGoal || this.currentPlan.length === 0) {
            this.currentGoal = newGoal;
            this.plan();
        }

        // 执行当前计划
        this.executePlan(deltaTime, gameplay);
    }

    updateWorldState(gameplay, gameTime) {
        const hours = Math.floor((gameTime || 360) / 60);

        // 能量状态
        this.worldState.set('energy', this.npc.energy || 100);
        this.worldState.set('isTired', (this.npc.energy || 100) < 30);

        // 饥饿状态（简化：固定时间点饥饿）
        const isMealTime = (hours >= 7 && hours < 9) ||
            (hours >= 12 && hours < 14) ||
            (hours >= 18 && hours < 20);
        const wasHungry = this.worldState.get('isHungry') || false;
        if (isMealTime && !wasHungry) {
            this.worldState.set('isHungry', true);
        }

        // 位置状态
        const map = gameplay.game.map;
        if (map && this.npc.homeBuilding) {
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

            this.worldState.set('atHome', distToHome < 20);
            this.worldState.set('atWork', distToWork < 20);
        }
    }

    selectGoal() {
        // 根据当前状态选择最高优先级的目标
        if (this.worldState.get('isTired')) {
            return this.goals.find(g => g.name === 'Rest');
        }
        if (this.worldState.get('isHungry')) {
            return this.goals.find(g => g.name === 'Eat');
        }
        return this.goals.find(g => g.name === 'Work');
    }

    plan() {
        if (!this.currentGoal) return;

        console.log(`[${this.npc.name}] Planning for goal: ${this.currentGoal.name}`);

        const plan = this.planner.plan(
            this.npc,
            this.actions,
            this.worldState,
            this.currentGoal
        );

        if (plan && plan.length > 0) {
            this.currentPlan = plan;
            this.currentActionIndex = 0;

            // 为移动行动设置目标
            for (const action of plan) {
                if (action.setTargetFromAgent) {
                    action.setTargetFromAgent(this.npc, this.npc.map);
                }
            }

            console.log(`[${this.npc.name}] Plan: ${plan.map(a => a.name).join(' -> ')}`);
        } else {
            console.warn(`[${this.npc.name}] No plan found`);
            this.currentPlan = [];
        }
    }

    executePlan(deltaTime, gameplay) {
        if (this.currentPlan.length === 0 || this.currentActionIndex >= this.currentPlan.length) {
            this.npc.vx = 0;
            this.npc.vy = 0;
            this.npc.isMoving = false;
            return;
        }

        const action = this.currentPlan[this.currentActionIndex];

        // 如果需要移动到目标位置
        if (action.requiresInRange() && !action.isInRange(this.npc)) {
            action.moveToTarget(this.npc, gameplay.game.map);
            this.npc.isMoving = true;
            return;
        }

        // 执行行动
        const finished = action.perform(this.npc, deltaTime, gameplay);

        if (finished) {
            // 应用效果到世界状态
            action.applyEffects(this.worldState);
            action.reset();
            this.currentActionIndex++;

            // 为下一个移动行动设置目标
            if (this.currentActionIndex < this.currentPlan.length) {
                const nextAction = this.currentPlan[this.currentActionIndex];
                if (nextAction.setTargetFromAgent) {
                    nextAction.setTargetFromAgent(this.npc, gameplay.game.map);
                }
            }
        }
    }
}

// ==================== NPC配置 ====================

const NPC_ROLES = {
    '阿狸': { role: 'gardener', homeBuilding: 'npc1House', workBuilding: 'flowerShop', color: '#FF6B6B', icon: '🌸' },
    '小橘': { role: 'fisherman', homeBuilding: 'npc2House', workBuilding: 'dock', color: '#4ECDC4', icon: '🎣' },
    '小白': { role: 'miner', homeBuilding: 'npc3House', workBuilding: 'toolShop', color: '#FFE66D', icon: '⛏️' }
};

// 获取建筑位置
function getBuildingPosition(map, buildingKey) {
    if (!map || !map.BUILDINGS) return { x: 500, y: 500 };
    const building = map.BUILDINGS[buildingKey];
    if (!building) return { x: 500, y: 500 };

    return {
        x: (building.x + building.w / 2) * map.tileSize,
        y: (building.y + building.h) * map.tileSize
    };
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorldState,
        GOAPGoal,
        GOAPAction,
        GOAPPlanner,
        GOAPAgent,
        NPC_ROLES,
        getBuildingPosition
    };
}