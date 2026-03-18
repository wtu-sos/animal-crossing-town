/**
 * 相机控制器 - 管理视角
 */
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        
        // 平滑跟随参数
        this.targetX = 0;
        this.targetY = 0;
        this.smoothness = 0.1;
        
        // 边界
        this.bounds = null;
        
        // 视差层
        this.parallaxLayers = [
            { speed: 0.1 },
            { speed: 0.3 },
            { speed: 0.6 },
            { speed: 1.0 }
        ];
    }
    
    // 设置跟随目标
    follow(targetX, targetY) {
        this.targetX = targetX - this.width / 2;
        this.targetY = targetY - this.height / 2;
    }
    
    // 更新位置
    update() {
        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
    }
    
    // 限制在边界内
    clampToBounds() {
        if (!this.bounds) return;
        
        this.x = Math.max(0, Math.min(this.x, this.bounds.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.bounds.height - this.height));
        
        this.targetX = Math.max(0, Math.min(this.targetX, this.bounds.width - this.width));
        this.targetY = Math.max(0, Math.min(this.targetY, this.bounds.height - this.height));
    }
    
    // 设置边界
    setBounds(width, height) {
        this.bounds = { width, height };
    }
    
    // 世界坐标转屏幕坐标
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }
    
    // 屏幕坐标转世界坐标
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Camera;
}
