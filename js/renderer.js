/**
 * 渲染系统 - Canvas 绘制
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 禁用平滑缩放以保持像素风格
        this.ctx.imageSmoothingEnabled = false;
        
        // 颜色调色板
        this.colors = {
            [0]: '#7CBA3D',  // GRASS - 浅绿
            [1]: '#6BA832',  // GRASS_DARK - 深绿
            [2]: '#8B7355',  // DIRT - 土色
            [3]: '#4A90D9',  // WATER - 水蓝
            [4]: '#E6D5A7',  // SAND - 沙色
            [5]: '#808080',  // STONE - 灰色
            [6]: '#A0522D',  // WOOD - 棕色
            [7]: '#FF69B4',  // FLOWER - 粉色
            [8]: '#228B22',  // TREE - 森林绿
            [9]: '#696969'   // ROCK - 岩石灰
        };
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
                
                // 绘制瓦片
                this.ctx.fillStyle = this.colors[tile] || '#000';
                this.ctx.fillRect(screenX, screenY, tileSize, tileSize);
                
                // 添加纹理细节
                this.addTileDetail(tile, screenX, screenY, tileSize, col, row);
            }
        }
    }
    
    // 添加瓦片细节
    addTileDetail(tileType, x, y, size, col, row) {
        const seed = col * 73856093 ^ row * 19349663;
        
        switch(tileType) {
            case 0: // GRASS
            case 1: // GRASS_DARK
                // 随机草叶
                if ((seed % 7) === 0) {
                    this.ctx.fillStyle = tileType === 0 ? '#6BA832' : '#5A9628';
                    this.ctx.fillRect(x + (seed % size), y + ((seed >> 4) % size), 2, 3);
                }
                break;
                
            case 3: // WATER
                // 水波纹效果
                const waveOffset = (Date.now() / 500 + (col + row) * 0.5) % Math.PI * 2;
                this.ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(waveOffset) * 0.05})`;
                this.ctx.fillRect(x + 4, y + 4 + Math.sin(waveOffset) * 2, size - 8, 2);
                break;
                
            case 4: // SAND
                // 沙粒效果
                if ((seed % 5) === 0) {
                    this.ctx.fillStyle = '#D4C494';
                    this.ctx.fillRect(x + (seed % size), y + ((seed >> 3) % size), 1, 1);
                }
                break;
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
            
            // 摇树动画
            let shakeX = 0;
            if (obj.shaking) {
                shakeX = Math.sin(Date.now() / 50) * 3;
            }
            
            switch(obj.type) {
                case 'tree':
                    this.drawTree(screenX + shakeX, screenY, tileSize, obj.variant);
                    break;
                case 'rock':
                    this.drawRock(screenX, screenY, tileSize, obj.variant);
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
    
    // 绘制石头
    drawRock(x, y, size, variant) {
        const centerX = x + size / 2;
        const centerY = y + size / 2 + 4;
        
        // 石头主体
        this.ctx.fillStyle = variant === 0 ? '#808080' : '#696969';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, 10, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 高光
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - 3, centerY - 2, 4, 2, -0.3, 0, Math.PI * 2);
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
    drawUI(time, playerX, playerY) {
        // 更新 DOM 元素
        const timeDisplay = document.getElementById('time-display');
        const coords = document.getElementById('coords');
        
        if (timeDisplay) {
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            const icon = hours < 6 || hours > 18 ? '🌙' : hours < 12 ? '🌅' : '☀️';
            timeDisplay.textContent = `${icon} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        
        if (coords) {
            coords.textContent = `X: ${Math.floor(playerX)}, Y: ${Math.floor(playerY)}`;
        }
    }
}
