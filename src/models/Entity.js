/**
 * 实体基类 - 游戏对象的基础模型
 */
class Entity {
    constructor(id, x, y, width = 24, height = 24) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.direction = 'down';
        this.isMoving = false;
        this.animationFrame = 0;
    }
    
    // 获取边界
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // 计算与其他实体的距离
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 检查碰撞
    collidesWith(other, padding = 0) {
        return this.x < other.x + other.width + padding &&
               this.x + this.width + padding > other.x &&
               this.y < other.y + other.height + padding &&
               this.y + this.height + padding > other.y;
    }
    
    // 更新位置
    updatePosition(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
    
    // 设置速度
    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isMoving = (vx !== 0 || vy !== 0);
        
        // 更新方向
        if (this.isMoving) {
            if (Math.abs(vx) > Math.abs(vy)) {
                this.direction = vx > 0 ? 'right' : 'left';
            } else {
                this.direction = vy > 0 ? 'down' : 'up';
            }
        }
    }
    
    // 停止移动
    stop() {
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
    }
    
    // 更新动画帧
    updateAnimation(deltaTime, frameDuration = 100) {
        this.animationFrame += deltaTime / frameDuration;
    }
    
    // 获取当前动画帧索引
    getCurrentFrameIndex(totalFrames = 4) {
        return Math.floor(this.animationFrame) % totalFrames;
    }
}

/**
 * 可携带能量的实体
 */
class LivingEntity extends Entity {
    constructor(id, x, y, width, height) {
        super(id, x, y, width, height);
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDecayRate = 0.03;
        this.isEating = false;
    }
    
    // 消耗能量
    consumeEnergy(amount = null) {
        const decay = amount || this.energyDecayRate;
        this.energy = Math.max(0, this.energy - decay);
        return this.energy;
    }
    
    // 恢复能量
    restoreEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
        return this.energy;
    }
    
    // 检查是否饿了
    isHungry(threshold = 30) {
        return this.energy < threshold;
    }
    
    // 检查是否疲劳
    isTired(threshold = 20) {
        return this.energy < threshold;
    }
    
    // 获取能量百分比
    getEnergyPercent() {
        return (this.energy / this.maxEnergy) * 100;
    }
    
    // 开始吃饭
    startEating() {
        if (this.isEating) return false;
        this.isEating = true;
        this.stop();
        return true;
    }
    
    // 结束吃饭
    finishEating(recoverAmount = 50) {
        this.isEating = false;
        return this.restoreEnergy(recoverAmount);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Entity, LivingEntity };
}
