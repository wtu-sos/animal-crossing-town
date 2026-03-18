/**
 * 玩家系统 - 角色控制和动画（带能量系统）
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 4;
        
        // 动画状态
        this.direction = 'down';
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        
        // 外观
        this.colors = {
            skin: '#FFDBAC',
            shirt: '#FF6B6B',
            pants: '#4ECDC4',
            hair: '#8B4513'
        };
        
        // 能量系统
        this.energy = 100;
        this.maxEnergy = 100;
        this.energyDecayRate = 0.02; // 降低基础消耗率
        this.isEating = false;
        this.eatTimer = 0;
        
        // 能量消耗记录（用于调试）
        this.energyLog = [];
        this.lastEnergyUpdate = Date.now();
        
        this.debugLog = '';
    }
    
    update(input, map) {
        // 如果正在吃饭，不能移动
        if (this.isEating) {
            this.updateEating();
            return;
        }
        
        const movement = input.getMovementVector();
        
        // 如果没有输入，直接返回
        if (movement.x === 0 && movement.y === 0) {
            this.isMoving = false;
            this.animationFrame = 0;
            this.animationTimer = 0;
            return;
        }
        
        // 计算实际移动速度（考虑能量状态）
        let currentSpeed = this.speed;
        let consumptionRate = this.energyDecayRate;
        
        // 能量状态影响
        if (this.energy < 10) {
            currentSpeed = this.speed * 0.3; // 极低能量时速度大幅降低
            consumptionRate = this.energyDecayRate * 0.5; // 但消耗也降低（疲惫）
        } else if (this.energy < 30) {
            currentSpeed = this.speed * 0.6;
            consumptionRate = this.energyDecayRate * 0.8;
        } else if (this.energy > 80) {
            currentSpeed = this.speed * 1.1; // 能量充足时稍微加速
            consumptionRate = this.energyDecayRate * 1.2;
        }
        
        // 计算新位置
        const moveX = movement.x * currentSpeed;
        const moveY = movement.y * currentSpeed;
        let newX = this.x + moveX;
        let newY = this.y + moveY;
        
        // 记录调试信息
        this.debugLog = `move: ${moveX.toFixed(1)}, ${moveY.toFixed(1)} | energy: ${Math.floor(this.energy)} | rate: ${consumptionRate.toFixed(3)}`;
        
        // 边界限制
        newX = Math.max(0, Math.min(newX, map.pixelWidth - this.width));
        newY = Math.max(0, Math.min(newY, map.pixelHeight - this.height));
        
        // 碰撞检测 - X轴
        const collidesX = map.checkCollision(newX, this.y, this.width, this.height);
        if (!collidesX) {
            this.x = newX;
        } else {
            this.debugLog += ' | X collision';
        }
        
        // 碰撞检测 - Y轴
        const collidesY = map.checkCollision(this.x, newY, this.width, this.height);
        if (!collidesY) {
            this.y = newY;
        } else {
            this.debugLog += ' | Y collision';
        }
        
        // 更新方向和动画
        this.isMoving = true;
        
        if (Math.abs(movement.x) > Math.abs(movement.y)) {
            this.direction = movement.x > 0 ? 'right' : 'left';
        } else {
            this.direction = movement.y > 0 ? 'down' : 'up';
        }
        
        // 更新动画帧
        this.animationTimer++;
        if (this.animationTimer > 6) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // 移动消耗能量（根据实际移动距离计算）
        if (this.isMoving) {
            const distance = Math.sqrt(moveX * moveX + moveY * moveY);
            const actualConsumption = consumptionRate * (distance / currentSpeed);
            this.energy = Math.max(0, this.energy - actualConsumption);
            
            // 记录能量日志（每5秒记录一次）
            const now = Date.now();
            if (now - this.lastEnergyUpdate > 5000) {
                this.energyLog.push({
                    time: now,
                    energy: this.energy,
                    action: 'move',
                    consumption: actualConsumption
                });
                // 只保留最近20条记录
                if (this.energyLog.length > 20) {
                    this.energyLog.shift();
                }
                this.lastEnergyUpdate = now;
            }
        }
    }
    
    // 更新吃饭状态
    updateEating() {
        this.isMoving = false;
        this.eatTimer += 16; // 假设每帧16ms
        
        // 吃饭动画 - 显示3秒
        if (this.eatTimer >= 3000) {
            this.finishEating();
        }
    }
    
    // 开始吃饭
    startEating() {
        if (this.isEating) return false;
        
        this.isEating = true;
        this.eatTimer = 0;
        this.isMoving = false;
        
        // 显示吃饭提示
        this.showEatNotification();
        
        return true;
    }
    
    // 完成吃饭
    finishEating() {
        this.isEating = false;
        this.eatTimer = 0;
        
        // 恢复能量
        const oldEnergy = this.energy;
        this.energy = Math.min(this.maxEnergy, this.energy + 50);
        const recovered = this.energy - oldEnergy;
        
        // 显示恢复提示
        this.showEnergyRecoveredNotification(recovered);
    }
    
    // 显示吃饭提示
    showEatNotification() {
        if (typeof document === 'undefined') return;
        
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 99, 71, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 24px;
            font-weight: bold;
            z-index: 200;
            animation: fadeInOut 3s ease;
            pointer-events: none;
        `;
        notification.textContent = '🍜 用餐中...';
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
    
    // 显示能量恢复提示
    showEnergyRecoveredNotification(amount) {
        if (typeof document === 'undefined') return;
        
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 20px;
            font-weight: bold;
            z-index: 200;
            animation: popIn 0.5s ease;
            pointer-events: none;
        `;
        notification.textContent = `⚡ 能量恢复 +${Math.floor(amount)}!`;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    // 检查是否在饭店附近
    isNearRestaurant(map) {
        const restaurantPos = map.getBuildingPosition('restaurant');
        if (!restaurantPos) return false;
        
        const dx = this.x - restaurantPos.x;
        const dy = this.y - restaurantPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 40;
    }
    
    // 检查是否需要进食（能量低）
    isHungry() {
        return this.energy < 30;
    }
    
    // 获取能量百分比
    getEnergyPercent() {
        return (this.energy / this.maxEnergy) * 100;
    }
    
    // 获取能量消耗统计
    getEnergyStats() {
        const totalConsumed = this.energyLog.reduce((sum, log) => sum + log.consumption, 0);
        const avgConsumption = this.energyLog.length > 0 ? totalConsumed / this.energyLog.length : 0;
        
        return {
            current: this.energy,
            max: this.maxEnergy,
            percent: this.getEnergyPercent(),
            recentLogs: this.energyLog.slice(-5),
            totalConsumed: totalConsumed.toFixed(2),
            avgConsumption: avgConsumption.toFixed(3)
        };
    }
    
    // 获取当前能量状态描述
    getEnergyStatus() {
        const percent = this.getEnergyPercent();
        if (percent >= 80) return { text: '精力充沛', color: '#4CAF50' };
        if (percent >= 50) return { text: '状态良好', color: '#8BC34A' };
        if (percent >= 30) return { text: '略有疲惫', color: '#FFC107' };
        if (percent >= 10) return { text: '需要休息', color: '#FF9800' };
        return { text: '极度疲劳', color: '#F44336' };
    }
    
    getBobOffset() {
        if (!this.isMoving) return 0;
        return Math.sin(this.animationFrame * Math.PI / 2) * 2;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    setColors(colors) {
        Object.assign(this.colors, colors);
    }
}

// 为了测试，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
