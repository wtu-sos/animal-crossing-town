/**
 * 地图系统 - 瓦片地图生成和管理
 */
class GameMap {
    constructor(tileSize = 32) {
        this.tileSize = tileSize;
        this.width = 100;  // 地图宽度（瓦片数）
        this.height = 100; // 地图高度（瓦片数）
        this.pixelWidth = this.width * tileSize;
        this.pixelHeight = this.height * tileSize;
        
        // 瓦片类型
        this.TILE_TYPES = {
            GRASS: 0,
            GRASS_DARK: 1,
            DIRT: 2,
            WATER: 3,
            SAND: 4,
            STONE: 5,
            WOOD: 6,
            FLOWER: 7,
            TREE: 8,
            ROCK: 9
        };
        
        // 地图数据
        this.tiles = [];
        this.objects = []; // 可交互物体（树木、石头等）
        
        this.generateMap();
    }
    
    // 生成地图
    generateMap() {
        // 初始化基础地形
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // 使用噪声生成自然地形
                const noise = this.simpleNoise(x * 0.1, y * 0.1);
                
                if (noise < 0.2) {
                    this.tiles[y][x] = this.TILE_TYPES.WATER;
                } else if (noise < 0.3) {
                    this.tiles[y][x] = this.TILE_TYPES.SAND;
                } else if (noise < 0.7) {
                    this.tiles[y][x] = Math.random() > 0.8 ? this.TILE_TYPES.GRASS_DARK : this.TILE_TYPES.GRASS;
                } else {
                    this.tiles[y][x] = this.TILE_TYPES.DIRT;
                }
            }
        }
        
        // 添加装饰物和可交互物体
        this.generateObjects();
    }
    
    // 简单噪声函数
    simpleNoise(x, y) {
        const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        // 使用小数部分，确保结果在 0-1 之间
        return value - Math.floor(value);
    }
    
    // 生成物体
    generateObjects() {
        // 添加树木
        for (let i = 0; i < 150; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            if (this.tiles[y][x] === this.TILE_TYPES.GRASS || 
                this.tiles[y][x] === this.TILE_TYPES.GRASS_DARK) {
                this.objects.push({
                    type: 'tree',
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    tileX: x,
                    tileY: y,
                    variant: Math.floor(Math.random() * 3),
                    interactive: true
                });
            }
        }
        
        // 添加石头
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            if (this.tiles[y][x] !== this.TILE_TYPES.WATER) {
                this.objects.push({
                    type: 'rock',
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    tileX: x,
                    tileY: y,
                    variant: Math.floor(Math.random() * 2),
                    interactive: true
                });
            }
        }
        
        // 添加花朵
        for (let i = 0; i < 100; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            if (this.tiles[y][x] === this.TILE_TYPES.GRASS) {
                this.objects.push({
                    type: 'flower',
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    tileX: x,
                    tileY: y,
                    variant: Math.floor(Math.random() * 4),
                    interactive: false
                });
            }
        }
    }
    
    // 获取瓦片类型
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return this.TILE_TYPES.WATER;
        }
        return this.tiles[y][x];
    }
    
    // 检查碰撞
    checkCollision(x, y, width, height) {
        const left = Math.floor(x / this.tileSize);
        const right = Math.floor((x + width) / this.tileSize);
        const top = Math.floor(y / this.tileSize);
        const bottom = Math.floor((y + height) / this.tileSize);
        
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const tile = this.getTile(tx, ty);
                if (tile === this.TILE_TYPES.WATER || tile === this.TILE_TYPES.TREE) {
                    return true;
                }
            }
        }
        
        // 检查物体碰撞
        for (const obj of this.objects) {
            if (obj.type === 'tree' || obj.type === 'rock') {
                const dx = (x + width/2) - (obj.x + this.tileSize/2);
                const dy = (y + height/2) - (obj.y + this.tileSize/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.tileSize * 0.6) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 获取视窗内的物体
    getObjectsInView(cameraX, cameraY, viewWidth, viewHeight) {
        return this.objects.filter(obj => {
            return obj.x + this.tileSize > cameraX &&
                   obj.x < cameraX + viewWidth &&
                   obj.y + this.tileSize > cameraY &&
                   obj.y < cameraY + viewHeight;
        });
    }
    
    // 交互物体
    interact(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.tileX === tileX && obj.tileY === tileY && obj.interactive) {
                if (obj.type === 'tree') {
                    // 摇树动画
                    obj.shaking = true;
                    setTimeout(() => { obj.shaking = false; }, 500);
                    return { type: 'tree_shake', object: obj };
                } else if (obj.type === 'rock') {
                    return { type: 'rock_hit', object: obj };
                }
            }
        }
        return null;
    }
}

// 为了测试，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameMap;
}
