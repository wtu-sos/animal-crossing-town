/**
 * 固定小镇地图系统 - 大富翁风格城市规划
 */
class GameMap {
    constructor(tileSize = 32) {
        this.tileSize = tileSize;
        this.width = 60;  // 地图宽度（瓦片数）
        this.height = 60; // 地图高度（瓦片数）
        this.pixelWidth = this.width * tileSize;
        this.pixelHeight = this.height * tileSize;
        
        // 瓦片类型
        this.TILE_TYPES = {
            GRASS: 0,      // 草地
            ROAD: 1,       // 道路
            ROAD_SIDEWALK: 2, // 人行道
            WATER: 3,      // 水域
            SAND: 4,       // 沙滩
            BUILDING_HOUSE: 5,    // 住宅
            BUILDING_SHOP: 6,     // 商店
            BUILDING_INN: 7,      // 旅馆
            BUILDING_TOWNHALL: 8, // 市政厅
            PARK: 9,       // 公园
            FENCE: 10,     // 围栏
            BRIDGE: 11     // 桥
        };
        
        // 建筑定义
        this.BUILDINGS = {
            playerHouse: { x: 5, y: 5, w: 4, h: 4, type: 'house', name: '玩家家', color: '#FFB6C1' },
            npc1House: { x: 10, y: 5, w: 4, h: 4, type: 'house', name: '阿狸家', color: '#FF6B6B', owner: '阿狸' },
            npc2House: { x: 15, y: 5, w: 4, h: 4, type: 'house', name: '小橘家', color: '#4ECDC4', owner: '小橘' },
            npc3House: { x: 20, y: 5, w: 4, h: 4, type: 'house', name: '小白家', color: '#FFE66D', owner: '小白' },
            
            flowerShop: { x: 30, y: 8, w: 5, h: 4, type: 'shop', name: '🌸花店', color: '#FF69B4', shopType: 'flower' },
            fishShop: { x: 38, y: 8, w: 5, h: 4, type: 'shop', name: '🎣渔具店', color: '#4682B4', shopType: 'fishing' },
            toolShop: { x: 46, y: 8, w: 5, h: 4, type: 'shop', name: '⛏️工具店', color: '#8B4513', shopType: 'tools' },
            
            inn: { x: 30, y: 20, w: 6, h: 5, type: 'inn', name: '🏨温泉旅馆', color: '#DDA0DD' },
            cafe: { x: 40, y: 20, w: 5, h: 4, type: 'shop', name: '☕咖啡馆', color: '#8B4513', shopType: 'cafe' },
            
            townHall: { x: 25, y: 30, w: 8, h: 6, type: 'townhall', name: '🏛️市政厅', color: '#DAA520' },
            museum: { x: 40, y: 30, w: 6, h: 5, type: 'shop', name: '🏛️博物馆', color: '#708090', shopType: 'museum' },
            
            park: { x: 10, y: 25, w: 10, h: 10, type: 'park', name: '🌳中央公园', color: '#228B22' },
            
            dock: { x: 52, y: 25, w: 6, h: 8, type: 'dock', name: '⚓码头', color: '#8B4513' }
        };
        
        // 地图数据
        this.tiles = [];
        this.objects = []; // 装饰物
        this.interactiveObjects = []; // 可交互建筑
        
        this.generateTownMap();
    }
    
    // 生成固定小镇地图
    generateTownMap() {
        // 初始化全草地
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        // 绘制道路系统
        this.drawRoadSystem();
        
        // 绘制建筑
        this.drawBuildings();
        
        // 添加水域和沙滩
        this.drawWaterAndBeach();
        
        // 添加公园细节
        this.drawParkDetails();
        
        // 添加装饰物
        this.generateDecorations();
        
        // 创建可交互对象
        this.createInteractiveObjects();
    }
    
    // 绘制道路系统
    drawRoadSystem() {
        // 主要道路（横向）
        const mainRoadY = [12, 28, 45];
        for (const y of mainRoadY) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = this.TILE_TYPES.ROAD;
                // 人行道
                if (y > 0) this.tiles[y-1][x] = this.TILE_TYPES.ROAD_SIDEWALK;
                if (y < this.height - 1) this.tiles[y+1][x] = this.TILE_TYPES.ROAD_SIDEWALK;
            }
        }
        
        // 主要道路（纵向）
        const mainRoadX = [8, 25, 42, 55];
        for (const x of mainRoadX) {
            for (let y = 0; y < this.height; y++) {
                this.tiles[y][x] = this.TILE_TYPES.ROAD;
                // 人行道
                if (x > 0) this.tiles[y][x-1] = this.TILE_TYPES.ROAD_SIDEWALK;
                if (x < this.width - 1) this.tiles[y][x+1] = this.TILE_TYPES.ROAD_SIDEWALK;
            }
        }
        
        // 交叉路口修正
        for (const ry of mainRoadY) {
            for (const rx of mainRoadX) {
                this.tiles[ry][rx] = this.TILE_TYPES.ROAD;
            }
        }
    }
    
    // 绘制建筑
    drawBuildings() {
        for (const [key, building] of Object.entries(this.BUILDINGS)) {
            for (let dy = 0; dy < building.h; dy++) {
                for (let dx = 0; dx < building.w; dx++) {
                    const x = building.x + dx;
                    const y = building.y + dy;
                    if (x < this.width && y < this.height) {
                        if (building.type === 'park') {
                            this.tiles[y][x] = this.TILE_TYPES.PARK;
                        } else if (building.type === 'house') {
                            this.tiles[y][x] = this.TILE_TYPES.BUILDING_HOUSE;
                        } else if (building.type === 'shop') {
                            this.tiles[y][x] = this.TILE_TYPES.BUILDING_SHOP;
                        } else if (building.type === 'inn') {
                            this.tiles[y][x] = this.TILE_TYPES.BUILDING_INN;
                        } else if (building.type === 'townhall') {
                            this.tiles[y][x] = this.TILE_TYPES.BUILDING_TOWNHALL;
                        }
                    }
                }
            }
            
            // 建筑周围添加围栏
            this.addFenceAroundBuilding(building);
        }
    }
    
    // 为建筑添加围栏
    addFenceAroundBuilding(building) {
        for (let x = building.x - 1; x <= building.x + building.w; x++) {
            if (x >= 0 && x < this.width) {
                if (building.y > 0) this.tiles[building.y - 1][x] = this.TILE_TYPES.FENCE;
                if (building.y + building.h < this.height) 
                    this.tiles[building.y + building.h][x] = this.TILE_TYPES.FENCE;
            }
        }
        for (let y = building.y - 1; y <= building.y + building.h; y++) {
            if (y >= 0 && y < this.height) {
                if (building.x > 0) this.tiles[y][building.x - 1] = this.TILE_TYPES.FENCE;
                if (building.x + building.w < this.width) 
                    this.tiles[y][building.x + building.w] = this.TILE_TYPES.FENCE;
            }
        }
        
        // 在围栏上开个门（朝向道路）
        const doorX = Math.floor(building.x + building.w / 2);
        const doorY = building.y + building.h;
        if (doorY < this.height) {
            this.tiles[doorY][doorX] = this.TILE_TYPES.ROAD_SIDEWALK;
        }
    }
    
    // 绘制水域和沙滩
    drawWaterAndBeach() {
        // 右下角湖泊
        for (let y = 40; y < this.height; y++) {
            for (let x = 50; x < this.width; x++) {
                // 湖边沙滩
                if (y === 40 || x === 50 || y === this.height - 1 || x === this.width - 1) {
                    this.tiles[y][x] = this.TILE_TYPES.SAND;
                } else {
                    this.tiles[y][x] = this.TILE_TYPES.WATER;
                }
            }
        }
        
        // 添加桥
        for (let x = 50; x < 56; x++) {
            this.tiles[28][x] = this.TILE_TYPES.BRIDGE;
        }
    }
    
    // 绘制公园细节
    drawParkDetails() {
        const park = this.BUILDINGS.park;
        
        // 公园内的道路
        for (let x = park.x + 2; x < park.x + park.w - 2; x++) {
            this.tiles[park.y + 5][x] = this.TILE_TYPES.ROAD;
        }
        for (let y = park.y + 2; y < park.y + park.h - 2; y++) {
            this.tiles[y][park.x + 5] = this.TILE_TYPES.ROAD;
        }
        
        // 公园入口
        this.tiles[park.y + park.h][park.x + 5] = this.TILE_TYPES.ROAD_SIDEWALK;
    }
    
    // 生成装饰物
    generateDecorations() {
        // 在公园添加树木和花朵
        const park = this.BUILDINGS.park;
        for (let i = 0; i < 15; i++) {
            const x = park.x + 1 + Math.floor(Math.random() * (park.w - 2));
            const y = park.y + 1 + Math.floor(Math.random() * (park.h - 2));
            if (this.tiles[y][x] === this.TILE_TYPES.PARK) {
                this.objects.push({
                    type: 'tree',
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    variant: Math.floor(Math.random() * 3),
                    interactive: false
                });
            }
        }
        
        // 在草地上添加装饰树
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.tiles[y][x] === this.TILE_TYPES.GRASS) {
                this.objects.push({
                    type: 'tree',
                    x: x * this.tileSize,
                    y: y * this.tileSize,
                    variant: Math.floor(Math.random() * 3),
                    interactive: true
                });
            }
        }
        
        // 在道路旁添加花朵
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === this.TILE_TYPES.ROAD_SIDEWALK) {
                    if (Math.random() > 0.7) {
                        this.objects.push({
                            type: 'flower',
                            x: x * this.tileSize,
                            y: y * this.tileSize,
                            variant: Math.floor(Math.random() * 4),
                            interactive: true
                        });
                    }
                }
            }
        }
    }
    
    // 创建可交互对象
    createInteractiveObjects() {
        for (const [key, building] of Object.entries(this.BUILDINGS)) {
            // 建筑的入口位置
            const doorX = (building.x + Math.floor(building.w / 2)) * this.tileSize;
            const doorY = (building.y + building.h) * this.tileSize;
            
            this.interactiveObjects.push({
                type: 'building',
                subtype: building.type,
                name: building.name,
                x: doorX,
                y: doorY,
                width: this.tileSize,
                height: this.tileSize,
                buildingKey: key,
                shopType: building.shopType || null,
                owner: building.owner || null,
                interactive: true
            });
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
                // 建筑、水域、围栏不能通过
                if (tile === this.TILE_TYPES.WATER ||
                    tile === this.TILE_TYPES.BUILDING_HOUSE ||
                    tile === this.TILE_TYPES.BUILDING_SHOP ||
                    tile === this.TILE_TYPES.BUILDING_INN ||
                    tile === this.TILE_TYPES.BUILDING_TOWNHALL ||
                    tile === this.TILE_TYPES.FENCE) {
                    return true;
                }
            }
        }
        
        // 检查物体碰撞
        for (const obj of this.objects) {
            if (obj.type === 'tree') {
                const dx = (x + width/2) - (obj.x + this.tileSize/2);
                const dy = (y + height/2) - (obj.y + this.tileSize/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.tileSize * 0.5) {
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
    
    // 获取附近的可交互建筑
    getNearbyBuilding(x, y, range = 40) {
        for (const obj of this.interactiveObjects) {
            const dx = x - obj.x;
            const dy = y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < range) {
                return obj;
            }
        }
        return null;
    }
    
    // 交互物体
    interact(x, y) {
        const building = this.getNearbyBuilding(x, y);
        if (building) {
            return { type: 'enter_building', building: building };
        }
        return null;
    }
    
    // 获取建筑位置（用于GOAP）
    getBuildingPosition(buildingKey) {
        const building = this.BUILDINGS[buildingKey];
        if (building) {
            return {
                x: (building.x + building.w / 2) * this.tileSize,
                y: (building.y + building.h) * this.tileSize
            };
        }
        return null;
    }
}

// 为了测试，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameMap;
}
