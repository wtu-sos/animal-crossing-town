/**
 * 渲染系统 - Canvas 绘制
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 禁用平滑缩放以保持像素风格
        this.ctx.imageSmoothingEnabled = false;
        
        // 颜色调色板 - 大富翁小镇风格
        this.colors = {
            [0]: '#7CB342',  // GRASS - 草地绿
            [1]: '#757575',  // ROAD - 道路灰
            [2]: '#BDBDBD',  // ROAD_SIDEWALK - 人行道浅灰
            [3]: '#42A5F5',  // WATER - 湖水蓝
            [4]: '#FFE082',  // SAND - 沙滩黄
            [5]: '#FFB6C1',  // BUILDING_HOUSE - 住宅粉色
            [6]: '#81C784',  // BUILDING_SHOP - 商店绿
            [7]: '#CE93D8',  // BUILDING_INN - 旅馆紫
            [8]: '#FFD54F',  // BUILDING_TOWNHALL - 市政厅金
            [9]: '#66BB6A',  // PARK - 公园深绿
            [10]: '#8D6E63', // FENCE - 围栏棕
            [11]: '#A1887F'  // BRIDGE - 桥木色
        };
        
        // 建筑颜色映射
        this.buildingColors = {};
    }
    
    // 调整画布大小
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    // 清空画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制地图
    drawMap(map, camera) {
        const tileSize = map.tileSize;
        
        // 计算可见区域
        const startCol = Math.floor(camera.x / tileSize);
        const endCol = startCol + Math.ceil(camera.width / tileSize) + 1;
        const startRow = Math.floor(camera.y / tileSize);
        const endRow = startRow + Math.ceil(camera.height / tileSize) + 1;
        
        // 绘制地面层
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = map.getTile(col, row);
                const screenX = col * tileSize - camera.x;
                const screenY = row * tileSize - camera.y;
                
                // 绘制基础瓦片
                this.drawTile(tile, screenX, screenY, tileSize, col, row, map);
            }
        }
        
        // 绘制建筑细节
        this.drawBuildingDetails(map, camera);
    }
    
    // 绘制单个瓦片
    drawTile(tileType, x, y, size, col, row, map) {
        switch(tileType) {
            case 0: // GRASS 草地
                this.ctx.fillStyle = this.colors[0];
                this.ctx.fillRect(x, y, size, size);
                // 随机草点
                if ((col * 7 + row * 13) % 5 === 0) {
                    this.ctx.fillStyle = '#689F38';
                    this.ctx.fillRect(x + 8, y + 8, 4, 4);
                }
                break;
                
            case 1: // ROAD 道路
                this.ctx.fillStyle = this.colors[1];
                this.ctx.fillRect(x, y, size, size);
                // 道路标线
                this.ctx.fillStyle = '#9E9E9E';
                this.ctx.fillRect(x + 12, y + 12, 8, 8);
                break;
                
            case 2: // ROAD_SIDEWALK 人行道
                this.ctx.fillStyle = this.colors[2];
                this.ctx.fillRect(x, y, size, size);
                // 人行道砖块纹理
                this.ctx.strokeStyle = '#9E9E9E';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
                break;
                
            case 3: // WATER 水域
                this.ctx.fillStyle = this.colors[3];
                this.ctx.fillRect(x, y, size, size);
                // 水波纹
                const waveOffset = (Date.now() / 500 + col * 0.5 + row * 0.3) % Math.PI;
                this.ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(waveOffset) * 0.05})`;
                this.ctx.fillRect(x + 4, y + 8 + Math.sin(waveOffset) * 4, size - 8, 2);
                break;
                
            case 4: // SAND 沙滩
                this.ctx.fillStyle = this.colors[4];
                this.ctx.fillRect(x, y, size, size);
                // 沙粒
                if ((col + row) % 3 === 0) {
                    this.ctx.fillStyle = '#FFCA28';
                    this.ctx.fillRect(x + 10, y + 10, 2, 2);
                }
                break;
                
            case 5: // BUILDING_HOUSE 住宅
                this.drawBuilding(x, y, size, map, col, row, 'house');
                break;
                
            case 6: // BUILDING_SHOP 商店
                this.drawBuilding(x, y, size, map, col, row, 'shop');
                break;
                
            case 7: // BUILDING_INN 旅馆
                this.drawBuilding(x, y, size, map, col, row, 'inn');
                break;
                
            case 8: // BUILDING_TOWNHALL 市政厅
                this.drawBuilding(x, y, size, map, col, row, 'townhall');
                break;
                
            case 9: // PARK 公园
                this.ctx.fillStyle = this.colors[9];
                this.ctx.fillRect(x, y, size, size);
                // 小径
                if ((col + row) % 7 === 0) {
                    this.ctx.fillStyle = '#D7CCC8';
                    this.ctx.fillRect(x, y, size, size);
                }
                break;
                
            case 10: // FENCE 围栏
                this.ctx.fillStyle = this.colors[0]; // 草地背景
                this.ctx.fillRect(x, y, size, size);
                // 木栅栏
                this.ctx.fillStyle = this.colors[10];
                this.ctx.fillRect(x + 4, y + 4, 4, 24);
                this.ctx.fillRect(x + 24, y + 4, 4, 24);
                this.ctx.fillRect(x + 4, y + 10, 24, 4);
                this.ctx.fillRect(x + 4, y + 20, 24, 4);
                break;
                
            case 11: // BRIDGE 桥
                this.ctx.fillStyle = this.colors[11];
                this.ctx.fillRect(x, y, size, size);
                // 桥栏杆
                this.ctx.fillStyle = '#6D4C41';
                this.ctx.fillRect(x, y + 4, size, 4);
                this.ctx.fillRect(x, y + 24, size, 4);
                break;
        }
    }
    
    // 绘制建筑
    drawBuilding(x, y, size, map, col, row, type) {
        // 找到这个瓦片属于哪个建筑
        let building = null;
        for (const [key, b] of Object.entries(map.BUILDINGS)) {
            if (col >= b.x && col < b.x + b.w &&
                row >= b.y && row < b.y + b.h) {
                building = b;
                break;
            }
        }

        // 特殊绘制饭店
        if (building && building.shopType === 'restaurant') {
            this.drawRestaurant(x, y, size, building, col, row);
            return;
        }

        if (!building) {
            this.ctx.fillStyle = this.colors[type === 'house' ? 5 : type === 'shop' ? 6 : type === 'inn' ? 7 : 8];
            this.ctx.fillRect(x, y, size, size);
            return;
        }
        
        const color = building.color || this.colors[5];
        
        // 建筑主体
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size, size);
        
        // 屋顶（建筑的顶部一排）
        if (row === building.y) {
            this.ctx.fillStyle = '#5D4037'; // 深棕色屋顶
            this.ctx.fillRect(x, y, size, 8);
        }
        
        // 门（建筑入口）
        const doorX = building.x + Math.floor(building.w / 2);
        if (col === doorX && row === building.y + building.h - 1) {
            this.ctx.fillStyle = '#3E2723';
            this.ctx.fillRect(x + 8, y, 16, size);
            // 门把手
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x + 20, y + 16, 3, 3);
        }
        
        // 窗户
        if ((col - building.x) % 2 === 1 && (row - building.y) % 2 === 1 && row > building.y) {
            this.ctx.fillStyle = '#FFF9C4';
            this.ctx.fillRect(x + 8, y + 8, 16, 16);
            this.ctx.strokeStyle = '#5D4037';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 8, y + 8, 16, 16);
        }
    }
    
    // 绘制饭店（特殊样式）
    drawRestaurant(x, y, size, building, col, row) {
        const color = building.color || '#FF6347';
        
        // 建筑主体 - 红色系
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, size, size);
        
        // 屋顶（中国传统风格）
        if (row === building.y) {
            this.ctx.fillStyle = '#8B0000'; // 深红色屋顶
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 8);
            this.ctx.lineTo(x + size / 2, y);
            this.ctx.lineTo(x + size, y + 8);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // 门（建筑底部中间）
        const doorX = building.x + Math.floor(building.w / 2);
        if (col === doorX && row === building.y + building.h - 1) {
            this.ctx.fillStyle = '#4A0000';
            this.ctx.fillRect(x + 8, y, 16, size);
            // 门帘
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x + 10, y + 5, 12, 8);
        }
        
        // 窗户 - 灯笼样式
        if ((col - building.x) % 2 === 1 && (row - building.y) % 2 === 1 && row > building.y) {
            this.ctx.fillStyle = '#FFE4B5'; // 暖黄色
            this.ctx.beginPath();
            this.ctx.arc(x + size / 2, y + size / 2, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#8B0000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // 招牌（建筑顶部）
        if (row === building.y + 1 && col === building.x + Math.floor(building.w / 2)) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x - 4, y - 4, size + 8, 10);
            this.ctx.fillStyle = '#8B0000';
            this.ctx.font = '8px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('食', x + size / 2, y + 4);
        }
    }

    // 绘制建筑详情（招牌等）
    drawBuildingDetails(map, camera) {
        const ctx = this.ctx;
        
        for (const [key, building] of Object.entries(map.BUILDINGS)) {
            const screenX = building.x * map.tileSize - camera.x;
            const screenY = building.y * map.tileSize - camera.y;
            
            // 跳过屏幕外的建筑
            if (screenX < -200 || screenX > camera.width ||
                screenY < -100 || screenY > camera.height) {
                continue;
            }
            
            // 绘制建筑名称牌
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            const textWidth = ctx.measureText(building.name).width;
            
            // 名牌背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                screenX + building.w * map.tileSize / 2 - textWidth / 2 - 5,
                screenY - 20,
                textWidth + 10,
                18
            );
            
            // 名牌文字
            ctx.fillStyle = '#FFF';
            ctx.fillText(
                building.name,
                screenX + building.w * map.tileSize / 2,
                screenY - 8
            );
            
            // 绘制身份图标（针对NPC房子）
            if (building.owner) {
                ctx.font = '16px sans-serif';
                ctx.fillText(
                    building.owner === '阿狸' ? '🌸' : 
                    building.owner === '小橘' ? '🎣' : '⛏️',
                    screenX + building.w * map.tileSize / 2,
                    screenY + 20
                );
            }
        }
    }
    
    // 绘制物体
    drawObjects(objects, camera, tileSize) {
        // 按 Y 坐标排序（实现深度排序）
        const sortedObjects = [...objects].sort((a, b) => a.y - b.y);
        
        for (const obj of sortedObjects) {
            const screenX = obj.x - camera.x;
            const screenY = obj.y - camera.y;
            
            // 跳过屏幕外的物体
            if (screenX + tileSize < 0 || screenX > camera.width ||
                screenY + tileSize < 0 || screenY > camera.height) {
                continue;
            }
            
            switch(obj.type) {
                case 'tree':
                    this.drawTree(screenX, screenY, tileSize, obj.variant);
                    break;
                case 'flower':
                    this.drawFlower(screenX, screenY, tileSize, obj.variant);
                    break;
            }
        }
    }
    
    // 绘制树木
    drawTree(x, y, size, variant) {
        const centerX = x + size / 2;
        const groundY = y + size;
        
        // 树干
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(centerX - 3, groundY - 20, 6, 20);
        
        // 树冠
        const colors = ['#228B22', '#32CD32', '#2E8B57'];
        this.ctx.fillStyle = colors[variant % colors.length];
        
        // 绘制圆形树冠
        this.ctx.beginPath();
        this.ctx.arc(centerX, groundY - 25, 14, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 高光
        this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 4, groundY - 28, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 绘制花朵
    drawFlower(x, y, size, variant) {
        const centerX = x + size / 2;
        const centerY = y + size - 2;
        
        // 花茎
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(centerX - 1, centerY - 8, 2, 8);
        
        // 花瓣颜色
        const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB'];
        this.ctx.fillStyle = colors[variant % colors.length];
        
        // 绘制花瓣
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const px = centerX + Math.cos(angle) * 4;
            const py = centerY - 10 + Math.sin(angle) * 4;
            
            this.ctx.beginPath();
            this.ctx.arc(px, py, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 花心
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 10, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 绘制玩家
    drawPlayer(player, camera) {
        const screenX = player.x - camera.x;
        const screenY = player.y - camera.y + player.getBobOffset();
        
        const centerX = screenX + player.width / 2;
        const centerY = screenY + player.height / 2;
        
        // 如果正在吃饭，显示吃饭图标
        if (player.isEating) {
            this.ctx.font = '20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🍜', centerX, screenY - 10);
        }
        
        // 绘制玩家能量条
        const energyPercent = player.getEnergyPercent();
        const barWidth = 28;
        const barHeight = 4;
        
        // 能量条背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(centerX - barWidth/2, screenY - 12, barWidth, barHeight);
        
        // 能量条颜色（根据能量值）
        if (energyPercent > 50) {
            this.ctx.fillStyle = '#4CAF50'; // 绿色
        } else if (energyPercent > 25) {
            this.ctx.fillStyle = '#FFC107'; // 黄色
        } else {
            this.ctx.fillStyle = '#F44336'; // 红色
        }
        this.ctx.fillRect(centerX - barWidth/2, screenY - 12, barWidth * (energyPercent/100), barHeight);
        
        // 能量低时显示警告
        if (energyPercent < 20) {
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#F44336';
            this.ctx.fillText('😫', centerX, screenY - 18);
        }
        
        // 阴影
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, screenY + player.height - 2, 10, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 身体
        this.ctx.fillStyle = player.colors.shirt;
        this.ctx.fillRect(centerX - 8, centerY - 4, 16, 14);
        
        // 头部
        this.ctx.fillStyle = player.colors.skin;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头发
        this.ctx.fillStyle = player.colors.hair;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 12, 8, Math.PI, 0);
        this.ctx.fill();
        
        // 眼睛（根据方向绘制）
        this.ctx.fillStyle = '#000';
        switch(player.direction) {
            case 'down':
                this.ctx.fillRect(centerX - 4, centerY - 10, 2, 2);
                this.ctx.fillRect(centerX + 2, centerY - 10, 2, 2);
                break;
            case 'up':
                // 不绘制眼睛（背对）
                break;
            case 'left':
                this.ctx.fillRect(centerX - 4, centerY - 10, 2, 2);
                break;
            case 'right':
                this.ctx.fillRect(centerX + 2, centerY - 10, 2, 2);
                break;
        }
        
        // 腿部（根据动画）
        this.ctx.fillStyle = player.colors.pants;
        if (player.isMoving) {
            const legOffset = Math.sin(player.animationFrame * Math.PI / 2) * 3;
            this.ctx.fillRect(centerX - 6 + legOffset, centerY + 8, 5, 6);
            this.ctx.fillRect(centerX + 1 - legOffset, centerY + 8, 5, 6);
        } else {
            this.ctx.fillRect(centerX - 6, centerY + 8, 5, 6);
            this.ctx.fillRect(centerX + 1, centerY + 8, 5, 6);
        }
    }
    
    // 绘制 UI
    drawUI(time, playerX, playerY, player, playerAgent) {
        // 更新 DOM 元素
        const timeDisplay = document.getElementById('time-display');
        const coords = document.getElementById('coords');
        const energyDisplay = document.getElementById('player-energy');
        const playerStatus = document.getElementById('player-status');

        if (timeDisplay) {
            const hours = Math.floor(time / 60);
            const minutes = Math.floor(time % 60);
            const icon = hours < 6 || hours > 18 ? '🌙' : hours < 12 ? '🌅' : '☀️';
            // 固定格式，避免宽度变化
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            timeDisplay.innerHTML = `<span class="time-icon">${icon}</span><span class="time-text">2025-03-19 ${timeStr}</span>`;
        }

        if (coords) {
            coords.textContent = `X: ${Math.floor(playerX)}, Y: ${Math.floor(playerY)}`;
        }

        // 更新玩家能量显示
        if (energyDisplay && player) {
            const energyPercent = Math.floor(player.getEnergyPercent ? player.getEnergyPercent() : 100);
            energyDisplay.textContent = `⚡ ${energyPercent}%`;

            // 能量低时添加警告样式
            if (energyPercent < 30) {
                energyDisplay.classList.add('low');
                energyDisplay.style.color = '#F44336';
            } else if (energyPercent < 50) {
                energyDisplay.classList.remove('low');
                energyDisplay.style.color = '#FFC107';
            } else {
                energyDisplay.classList.remove('low');
                energyDisplay.style.color = '#4CAF50';
            }
        }

        // 更新玩家状态显示
        if (playerStatus && playerAgent) {
            const status = playerAgent.getCurrentStatus();
            if (status) {
                playerStatus.textContent = status.text || '🤔 思考中...';
                playerStatus.style.display = 'block';
            }
        }
    }
}

// 为了测试，导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
