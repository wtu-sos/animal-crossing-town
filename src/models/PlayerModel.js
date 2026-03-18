/**
 * 玩家模型 - 纯数据逻辑
 */
const { LivingEntity } = require('./Entity.js') || { LivingEntity: class {} };

class PlayerModel extends LivingEntity {
    constructor(x = 100, y = 100) {
        super('player', x, y, 24, 24);
        
        // 外观配置
        this.appearance = {
            skin: '#FFDBAC',
            shirt: '#FF6B6B',
            pants: '#4ECDC4',
            hair: '#8B4513'
        };
        
        // 移动配置
        this.movement = {
            speed: 4,
            baseSpeed: 4,
            lowEnergySpeed: 2
        };
        
        // 工具
        this.currentTool = null;
        
        // 状态标志
        this.canMove = true;
    }
    
    // 更新（纯逻辑，无渲染）
    update(inputState, map, deltaTime = 16) {
        // 如果正在吃饭，不能移动
        if (this.isEating) {
            this.updateEating(deltaTime);
            return;
        }
        
        // 获取输入向量
        const movement = inputState.getMovementVector();
        
        // 如果没有输入，停止
        if (movement.x === 0 && movement.y === 0) {
            this.stop();
            return;
        }
        
        // 根据能量计算速度
        let currentSpeed = this.movement.speed;
        if (this.isTired()) {
            currentSpeed = this.movement.lowEnergySpeed;
        }
        
        // 计算新速度
        const vx = movement.x * currentSpeed;
        const vy = movement.y * currentSpeed;
        
        // 设置速度（会更新方向和isMoving）
        this.setVelocity(vx, vy);
        
        // 计算新位置
        const newX = this.x + vx;
        const newY = this.y + vy;
        
        // 边界限制
        const clampedX = Math.max(0, Math.min(newX, map.pixelWidth - this.width));
        const clampedY = Math.max(0, Math.min(newY, map.pixelHeight - this.height));
        
        // 碰撞检测
        let canMoveX = !map.checkCollision(clampedX, this.y, this.width, this.height);
        let canMoveY = !map.checkCollision(this.x, clampedY, this.width, this.height);
        
        // 应用移动
        if (canMoveX) {
            this.x = clampedX;
        }
        if (canMoveY) {
            this.y = clampedY;
        }
        
        // 移动消耗能量
        if (this.isMoving) {
            this.consumeEnergy();
        }
        
        // 更新动画
        this.updateAnimation(deltaTime);
    }
    
    // 更新吃饭状态
    updateEating(deltaTime) {
        // 吃饭时间累计在别处处理，这里只是阻止移动
        this.stop();
    }
    
    // 设置工具
    setTool(tool) {
        this.currentTool = tool;
    }
    
    // 更新外观
    setAppearance(appearance) {
        Object.assign(this.appearance, appearance);
    }
    
    // 检查是否在建筑附近
    isNearBuilding(map, buildingKey, threshold = 40) {
        const pos = map.getBuildingPosition(buildingKey);
        if (!pos) return false;
        
        const dx = this.x - pos.x;
        const dy = this.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < threshold;
    }
    
    // 序列化
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            energy: this.energy,
            direction: this.direction,
            appearance: this.appearance,
            currentTool: this.currentTool
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerModel;
}
