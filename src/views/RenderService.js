/**
 * 渲染服务 - 处理所有UI和绘制逻辑
 */
class RenderService {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // 资源缓存
        this.cache = new Map();
        
        // 颜色配置
        this.colors = {
            grass: '#7CB342',
            road: '#757575',
            sidewalk: '#BDBDBD',
            water: '#42A5F5',
            sand: '#FFE082',
            building: {
                house: '#FFB6C1',
                shop: '#81C784',
                inn: '#CE93D8',
                townhall: '#FFD54F',
                restaurant: '#FF6347'
            }
        };
    }
    
    // 调整大小
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    // 清空画布
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制天空背景
    drawSky(hours) {
        let topColor, bottomColor;
        
        if (hours >= 5 && hours < 7) {
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else if (hours >= 7 && hours < 17) {
            topColor = '#87CEEB';
            bottomColor = '#E0F6FF';
        } else if (hours >= 17 && hours < 19) {
            topColor = '#FF6B6B';
            bottomColor = '#FFE66D';
        } else {
            topColor = '#1a1a2e';
            bottomColor = '#16213e';
        }
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, topColor);
        gradient.addColorStop(1, bottomColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 绘制地图瓦片
    drawTile(tileType, x, y, size) {
        switch(tileType) {
            case 0: // grass
                this.ctx.fillStyle = this.colors.grass;
                this.ctx.fillRect(x, y, size, size);
                break;
            case 1: // road
                this.ctx.fillStyle = this.colors.road;
                this.ctx.fillRect(x, y, size, size);
                break;
            case 3: // water
                this.ctx.fillStyle = this.colors.water;
                this.ctx.fillRect(x, y, size, size);
                break;
            // ... 其他瓦片类型
        }
    }
    
    // 绘制实体（通用）
    drawEntity(entity, camera, options = {}) {
        const screenX = entity.x - camera.x;
        const screenY = entity.y - camera.y;
        
        // 检查是否在屏幕内
        if (screenX < -50 || screenX > this.canvas.width + 50 ||
            screenY < -50 || screenY > this.canvas.height + 50) {
            return;
        }
        
        const centerX = screenX + entity.width / 2;
        const centerY = screenY + entity.height / 2;
        
        // 绘制能量条（如果有）
        if (options.showEnergy && entity.energy !== undefined) {
            this.drawEnergyBar(centerX, screenY - 15, entity.getEnergyPercent?.() || 100);
        }
        
        // 绘制状态图标
        if (options.statusIcon) {
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(options.statusIcon, centerX, screenY - 20);
        }
        
        // 绘制身体
        if (options.color) {
            this.ctx.fillStyle = options.color;
            this.ctx.fillRect(centerX - 8, centerY - 4, 16, 14);
        }
        
        // 绘制头部
        this.ctx.fillStyle = options.skinColor || '#FFDBAC';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 10, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制眼睛
        this.ctx.fillStyle = '#000';
        if (entity.direction === 'down' || entity.direction === 'left') {
            this.ctx.fillRect(centerX - 4, centerY - 10, 2, 2);
        }
        if (entity.direction === 'down' || entity.direction === 'right') {
            this.ctx.fillRect(centerX + 2, centerY - 10, 2, 2);
        }
        
        // 绘制名字
        if (options.name) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(options.name, centerX, screenY - 25);
        }
    }
    
    // 绘制能量条
    drawEnergyBar(x, y, percent) {
        const width = 24;
        const height = 3;
        
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width / 2, y, width, height);
        
        // 能量
        const color = percent > 50 ? '#4CAF50' : percent > 25 ? '#FFC107' : '#F44336';
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y, width * (percent / 100), height);
    }
    
    // 绘制建筑
    drawBuilding(building, camera, map) {
        const screenX = building.x * map.tileSize - camera.x;
        const screenY = building.y * map.tileSize - camera.y;
        
        // 跳过屏幕外
        if (screenX < -200 || screenX > this.canvas.width ||
            screenY < -100 || screenY > this.canvas.height) {
            return;
        }
        
        // 绘制建筑主体（简化版）
        const width = building.w * map.tileSize;
        const height = building.h * map.tileSize;
        
        this.ctx.fillStyle = building.color || '#999';
        this.ctx.fillRect(screenX, screenY, width, height);
        
        // 绘制名称
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(screenX + width/2 - 40, screenY - 20, 80, 18);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(building.name, screenX + width/2, screenY - 8);
    }
    
    // 更新DOM UI
    updateDOMUI(gameState) {
        // 时间
        const timeDisplay = document.getElementById('time-display');
        if (timeDisplay) {
            const hours = gameState.getHours();
            const minutes = gameState.getMinutes();
            const icon = hours < 6 || hours > 18 ? '🌙' : hours < 12 ? '🌅' : '☀️';
            timeDisplay.textContent = `${icon} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        // 坐标
        const coords = document.getElementById('coords');
        if (coords) {
            coords.textContent = `X: ${Math.floor(gameState.player.x)}, Y: ${Math.floor(gameState.player.y)}`;
        }
        
        // 玩家能量
        const energyDisplay = document.getElementById('player-energy');
        if (energyDisplay) {
            const percent = Math.floor(gameState.player.energy);
            energyDisplay.textContent = `⚡ ${percent}%`;
            energyDisplay.style.color = percent < 30 ? '#F44336' : percent < 50 ? '#FFC107' : '#4CAF50';
        }
    }
    
    // 显示通知
    showNotification(text, color = '#fff', duration = 2000) {
        if (typeof document === 'undefined') return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: ${color};
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 200;
            animation: fadeInOut 2s ease;
            pointer-events: none;
        `;
        notification.textContent = text;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderService;
}
