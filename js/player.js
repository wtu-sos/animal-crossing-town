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
        this.energyDecayRate = 0.03; // 移动时能量消耗
        this.isEating = false;
        this.eatTimer = 0;
        
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
        
        // 能量不足时减速
        let currentSpeed = this.speed;
        if (this.energy < 20) {
            currentSpeed = this.speed * 0.5; // 能量低时速度减半
        }
        
        // 计算新位置
        const moveX = movement.x * currentSpeed;
        const moveY = movement.y * currentSpeed;
        let newX = this.x + moveX;
        let newY = this.y + moveY;
        
        // 记录调试信息
        this.debugLog = `move: ${moveX.toFixed(1)}, ${moveY.toFixed(1)} | energy: ${Math.floor(this.energy)}`;
        
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
        
        // 移动消耗能量
        if (this.isMoving) {
            this.energy = Math.max(0, this.energy - this.energyDecayRate);
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
        
        document.getElementById('game-container').appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 2500);
    }
    
    // 显示能量恢复提示
    showEnergyRecoveredNotification(amount) {
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
        
        document.getElementById('game-container').appendChild(notification);
        
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
