/**
 * NPC模型 - 纯数据逻辑
 */
const { LivingEntity } = require('./Entity.js') || { LivingEntity: class {} };

class NPCModel extends LivingEntity {
    constructor(id, name, role, config) {
        super(id, 0, 0, 24, 24);
        
        this.name = name;
        this.role = role;
        
        // 配置
        this.config = {
            homeBuilding: config.homeBuilding,
            workBuilding: config.workBuilding,
            color: config.color,
            icon: config.icon,
            dialogues: config.dialogues || []
        };
        
        // 状态
        this.state = {
            currentDialogue: 0,
            isWorking: false,
            isResting: false,
            currentAction: null,
            targetPosition: null
        };
        
        // 路径规划
        this.path = {
            current: [],
            index: 0
        };
    }
    
    // 获取下一个对话
    getNextDialogue() {
        const dialogue = this.config.dialogues[this.state.currentDialogue];
        this.state.currentDialogue = (this.state.currentDialogue + 1) % this.config.dialogues.length;
        return dialogue;
    }
    
    // 设置目标位置（用于移动）
    setTarget(x, y) {
        this.state.targetPosition = { x, y };
    }
    
    // 清除目标
    clearTarget() {
        this.state.targetPosition = null;
    }
    
    // 计算到目标的距离
    distanceToTarget() {
        if (!this.state.targetPosition) return Infinity;
        
        const dx = this.x - this.state.targetPosition.x;
        const dy = this.y - this.state.targetPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 向目标移动
    moveToTarget(speed = 1.5) {
        if (!this.state.targetPosition) {
            this.stop();
            return false;
        }
        
        const target = this.state.targetPosition;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            // 到达目标
            this.stop();
            this.clearTarget();
            return true;
        }
        
        // 设置速度
        this.setVelocity(
            (dx / distance) * speed,
            (dy / distance) * speed
        );
        
        return false;
    }
    
    // 更新（纯逻辑）
    update(deltaTime, gameState) {
        // 如果正在吃饭，不移动
        if (this.isEating) {
            this.stop();
            return;
        }
        
        // 如果有目标，向目标移动
        if (this.state.targetPosition) {
            const arrived = this.moveToTarget();
            
            if (!arrived && this.isMoving) {
                // 应用移动
                this.x += this.vx;
                this.y += this.vy;
                
                // 消耗能量
                this.consumeEnergy(0.05);
            }
        }
        
        // 更新动画
        this.updateAnimation(deltaTime);
    }
    
    // 检查是否在家
    isAtHome(map) {
        const homePos = map.getBuildingPosition(this.config.homeBuilding);
        const dx = this.x - homePos.x;
        const dy = this.y - homePos.y;
        return Math.sqrt(dx * dx + dy * dy) < 50;
    }
    
    // 检查是否在工作地点
    isAtWork(map) {
        const workPos = map.getBuildingPosition(this.config.workBuilding);
        const dx = this.x - workPos.x;
        const dy = this.y - workPos.y;
        return Math.sqrt(dx * dx + dy * dy) < 50;
    }
    
    // 序列化
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            x: this.x,
            y: this.y,
            energy: this.energy,
            direction: this.direction,
            state: this.state
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NPCModel;
}
