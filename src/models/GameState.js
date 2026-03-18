/**
 * 游戏状态模型 - 纯数据，无渲染逻辑
 */
class GameState {
    constructor() {
        // 时间系统
        this.time = {
            current: 360, // 6:00 AM (minutes from midnight)
            day: 1,
            speed: 1 // time multiplier
        };
        
        // 玩家状态
        this.player = {
            x: 0,
            y: 0,
            energy: 100,
            maxEnergy: 100,
            isEating: false,
            inventory: {
                flowers: [],
                fish: [],
                fruits: []
            }
        };
        
        // NPC状态
        this.npcs = [];
        
        // 世界状态
        this.world = {
            weather: 'sunny',
            season: 'spring'
        };
        
        // 建筑交互状态
        this.buildings = {
            restaurant: { occupied: [], queue: [] }
        };
    }
    
    // 更新时间
    updateTime(deltaTime) {
        this.time.current += deltaTime * this.time.speed / 1000 / 6; // game time moves faster
        if (this.time.current >= 1440) {
            this.time.current = 0;
            this.time.day++;
        }
    }
    
    // 获取小时数
    getHours() {
        return Math.floor(this.time.current / 60);
    }
    
    // 获取分钟数
    getMinutes() {
        return this.time.current % 60;
    }
    
    // 检查是否是餐时
    isMealTime() {
        const hours = this.getHours();
        return (hours >= 7 && hours < 9) ||   // breakfast
               (hours >= 11 && hours < 13) ||  // lunch
               (hours >= 17 && hours < 19);    // dinner
    }
    
    // 更新玩家位置
    updatePlayerPosition(x, y) {
        this.player.x = x;
        this.player.y = y;
    }
    
    // 更新玩家能量
    updatePlayerEnergy(delta) {
        this.player.energy = Math.max(0, Math.min(this.player.maxEnergy, this.player.energy + delta));
    }
    
    // 设置玩家吃饭状态
    setPlayerEating(isEating) {
        this.player.isEating = isEating;
    }
    
    // 添加物品到背包
    addToInventory(type, item) {
        if (this.player.inventory[type]) {
            this.player.inventory[type].push(item);
        }
    }
    
    // 获取NPC状态
    getNPCState(npcId) {
        return this.npcs.find(n => n.id === npcId);
    }
    
    // 更新NPC状态
    updateNPCState(npcId, updates) {
        const npc = this.getNPCState(npcId);
        if (npc) {
            Object.assign(npc, updates);
        }
    }
    
    // 序列化状态（用于保存）
    serialize() {
        return JSON.stringify({
            time: this.time,
            player: this.player,
            npcs: this.npcs,
            world: this.world
        });
    }
    
    // 加载状态
    deserialize(data) {
        const parsed = JSON.parse(data);
        this.time = parsed.time;
        this.player = parsed.player;
        this.npcs = parsed.npcs;
        this.world = parsed.world;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
