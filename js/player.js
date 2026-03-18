/**
 * 玩家系统 - 角色控制和动画
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 4; // 增加速度
        
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
        
        this.debugLog = '';
    }
    
    update(input, map) {
        const movement = input.getMovementVector();
        
        // 如果没有输入，直接返回
        if (movement.x === 0 && movement.y === 0) {
            this.isMoving = false;
            this.animationFrame = 0;
            this.animationTimer = 0;
            return;
        }
        
        // 计算新位置
        const moveX = movement.x * this.speed;
        const moveY = movement.y * this.speed;
        let newX = this.x + moveX;
        let newY = this.y + moveY;
        
        // 记录调试信息
        this.debugLog = `move: ${moveX.toFixed(1)}, ${moveY.toFixed(1)}`;
        
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
