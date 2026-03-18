/**
 * 相机系统 - 处理视差滚动和相机跟随
 */
class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // 视差滚动层
        this.parallaxLayers = [
            { speed: 0.1, offset: 0 },   // 远景（天空、山脉）
            { speed: 0.3, offset: 0 },   // 中景（树木、建筑）
            { speed: 0.6, offset: 0 },   // 近景（草丛、装饰）
            { speed: 1.0, offset: 0 }    // 主层（地面、玩家）
        ];
        
        // 平滑跟随参数
        this.smoothness = 0.1;
        this.targetX = 0;
        this.targetY = 0;
        
        // 震动效果
        this.shake = 0;
        this.shakeDecay = 0.9;
    }
    
    // 设置跟随目标
    follow(targetX, targetY) {
        this.targetX = targetX - this.width / 2;
        this.targetY = targetY - this.height / 2;
    }
    
    // 更新相机位置
    update() {
        // 平滑跟随
        this.x += (this.targetX - this.x) * this.smoothness;
        this.y += (this.targetY - this.y) * this.smoothness;
        
        // 应用震动
        if (this.shake > 0) {
            this.x += (Math.random() - 0.5) * this.shake;
            this.y += (Math.random() - 0.5) * this.shake;
            this.shake *= this.shakeDecay;
            if (this.shake < 0.5) this.shake = 0;
        }
        
        // 更新视差层偏移
        this.parallaxLayers.forEach(layer => {
            layer.offset = this.x * layer.speed;
        });
    }
    
    // 添加震动效果
    addShake(amount) {
        this.shake = amount;
    }
    
    // 世界坐标转屏幕坐标
    worldToScreen(worldX, worldY, layer = 3) {
        const layerOffset = this.parallaxLayers[layer].offset - this.x * this.parallaxLayers[layer].speed;
        return {
            x: worldX - this.x - layerOffset,
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
    
    // 获取视差偏移
    getParallaxOffset(layer) {
        return this.parallaxLayers[layer].offset;
    }
    
    // 设置地图边界
    setBounds(mapWidth, mapHeight) {
        this.bounds = { width: mapWidth, height: mapHeight };
    }
    
    // 限制相机在边界内
    clampToBounds() {
        if (!this.bounds) return;
        
        this.x = Math.max(0, Math.min(this.x, this.bounds.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.bounds.height - this.height));
        
        this.targetX = Math.max(0, Math.min(this.targetX, this.bounds.width - this.width));
        this.targetY = Math.max(0, Math.min(this.targetY, this.bounds.height - this.height));
    }
}
