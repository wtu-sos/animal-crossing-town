/**
 * 玩家系统 - 角色控制和动画
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 3;
        
        // 动画状态
        this.direction = 'down'; // up, down, left, right
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
    }
    
    // 更新玩家状态
    update(input, map) {
        const movement = input.getMovementVector();
        
        // 计算新位置
        let newX = this.x + movement.x * this.speed;
        let newY = this.y + movement.y * this.speed;
        
        // 碰撞检测
        if (!map.checkCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!map.checkCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }
        
        // 更新方向和动画
        this.isMoving = movement.x !== 0 || movement.y !== 0;
        
        if (this.isMoving) {
            // 确定朝向
            if (Math.abs(movement.x) > Math.abs(movement.y)) {
                this.direction = movement.x > 0 ? 'right' : 'left';
            } else {
                this.direction = movement.y > 0 ? 'down' : 'up';
            }
            
            // 更新动画帧
            this.animationTimer++;
            if (this.animationTimer > 8) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }
    
    // 获取绘制时的偏移（行走动画晃动）
    getBobOffset() {
        if (!this.isMoving) return 0;
        return Math.sin(this.animationFrame * Math.PI / 2) * 2;
    }
    
    // 获取碰撞箱
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    // 设置外观颜色
    setColors(colors) {
        Object.assign(this.colors, colors);
    }
}
