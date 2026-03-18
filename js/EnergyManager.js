/**
 * 能量消耗管理系统
 * 定义不同动作的能量消耗值
 */
class EnergyConsumptionManager {
    constructor() {
        // 基础消耗配置（每帧/每秒）
        this.consumptionRates = {
            // 静止状态
            IDLE: {
                rate: 0,
                description: '静止不动'
            },
            
            // 移动状态（按速度档次）
            WALK_SLOW: {
                rate: 0.01,
                description: '慢走（低能量时）',
                maxSpeed: 2
            },
            WALK_NORMAL: {
                rate: 0.02,
                description: '正常行走',
                maxSpeed: 4
            },
            WALK_FAST: {
                rate: 0.03,
                description: '快速行走/奔跑',
                maxSpeed: 6
            },
            
            // 工作动作
            WORK_LIGHT: {
                rate: 0.015,
                description: '轻度工作（浇花、整理）'
            },
            WORK_MODERATE: {
                rate: 0.03,
                description: '中度工作（种花、砍树）'
            },
            WORK_HEAVY: {
                rate: 0.05,
                description: '重度工作（挖矿、搬运）'
            },
            
            // 特殊动作
            FISHING: {
                rate: 0.01,
                description: '钓鱼（等待时消耗低）'
            },
            EATING: {
                rate: 0,
                description: '进食（不消耗）'
            },
            SLEEPING: {
                rate: -0.1,
                description: '睡觉（恢复能量）'
            },
            TALKING: {
                rate: 0.005,
                description: '对话'
            }
        };
        
        // 瞬时消耗（一次性）
        this.instantCosts = {
            JUMP: 2,
            ACTION: 1,
            TOOL_USE: 3,
            START_WORKING: 5
        };
        
        // 消耗倍率（根据时间/状态调整）
        this.multipliers = {
            NIGHT: 1.2,      // 夜间消耗更多
            RAIN: 1.3,       // 雨天消耗更多
            HUNGRY: 1.5,     // 饥饿时消耗更多
            TIRED: 2.0       // 疲劳时消耗更多
        };
        
        // 当前状态
        this.currentState = 'IDLE';
        this.accumulatedCost = 0;
    }
    
    /**
     * 获取当前消耗率
     */
    getCurrentRate() {
        const config = this.consumptionRates[this.currentState];
        return config ? config.rate : 0;
    }
    
    /**
     * 设置当前状态
     */
    setState(stateName) {
        if (this.consumptionRates[stateName]) {
            this.currentState = stateName;
            return true;
        }
        console.warn(`未知状态: ${stateName}`);
        return false;
    }
    
    /**
     * 根据移动速度自动选择状态
     */
    setStateBySpeed(speed) {
        if (speed === 0) {
            this.currentState = 'IDLE';
        } else if (speed <= 2) {
            this.currentState = 'WALK_SLOW';
        } else if (speed <= 4) {
            this.currentState = 'WALK_NORMAL';
        } else {
            this.currentState = 'WALK_FAST';
        }
    }
    
    /**
     * 计算本次更新应消耗的能量
     */
    calculateConsumption(deltaTime, multipliers = []) {
        let baseRate = this.getCurrentRate();
        
        // 应用倍率
        let finalRate = baseRate;
        for (const mult of multipliers) {
            if (this.multipliers[mult]) {
                finalRate *= this.multipliers[mult];
            }
        }
        
        // 根据时间增量计算消耗
        // deltaTime 是毫秒，转换为秒
        const seconds = deltaTime / 1000;
        const consumption = finalRate * seconds;
        
        this.accumulatedCost += consumption;
        
        return consumption;
    }
    
    /**
     * 获取瞬时消耗
     */
    getInstantCost(actionName) {
        return this.instantCosts[actionName] || 0;
    }
    
    /**
     * 消耗瞬时能量
     */
    consumeInstant(actionName) {
        const cost = this.getInstantCost(actionName);
        this.accumulatedCost += cost;
        return cost;
    }
    
    /**
     * 获取状态描述
     */
    getCurrentStateDescription() {
        const config = this.consumptionRates[this.currentState];
        return config ? config.description : '未知状态';
    }
    
    /**
     * 获取所有消耗统计
     */
    getStats() {
        return {
            currentState: this.currentState,
            currentRate: this.getCurrentRate(),
            totalAccumulated: this.accumulatedCost,
            description: this.getCurrentStateDescription()
        };
    }
    
    /**
     * 重置累计消耗（用于定期保存或显示）
     */
    resetAccumulated() {
        const total = this.accumulatedCost;
        this.accumulatedCost = 0;
        return total;
    }
    
    /**
     * 调整消耗率（用于难度设置）
     */
    adjustRate(stateName, newRate) {
        if (this.consumptionRates[stateName]) {
            this.consumptionRates[stateName].rate = newRate;
            return true;
        }
        return false;
    }
    
    /**
     * 设置全局倍率
     */
    setGlobalMultiplier(multiplierName, value) {
        this.multipliers[multiplierName] = value;
    }
}

// 导出单例
const energyManager = new EnergyConsumptionManager();

// 为兼容旧代码，也导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnergyConsumptionManager, energyManager };
}