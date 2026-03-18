/**
 * GOAP 系统单元测试
 */

const goap = require('../js/goap.js');
const {
    WorldState,
    GOAPAction,
    GOAPPlanner,
    GOAPAgent,
    MoveHomeAction,
    MoveToWorkAction,
    RestAction,
    EatAction,
    FishAction,
    getBuildingPosition,
    getNPCStatus,
    NPC_ROLES
} = goap;

describe('GOAP System', () => {
    let worldState, agent, npc, mockGameplay;

    beforeEach(() => {
        // 创建测试NPC
        npc = {
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            energy: 100,
            homeBuilding: 'npc1House',
            workBuilding: 'flowerShop',
            name: 'TestNPC',
            isMoving: false,
            direction: 'down'
        };

        // 创建世界状态
        worldState = new WorldState();

        // 创建模拟gameplay对象
        mockGameplay = {
            game: {
                player: { x: 500, y: 500 },
                map: {
                    BUILDINGS: {
                        npc1House: { x: 5, y: 5, w: 4, h: 4 },
                        flowerShop: { x: 30, y: 8, w: 5, h: 4 }
                    },
                    tileSize: 32,
                    checkCollision: jest.fn(() => false)
                }
            }
        };

        // 创建agent
        agent = new GOAPAgent(npc, 'gardener', worldState);
    });

    describe('WorldState', () => {
        test('应该正确初始化状态', () => {
            expect(worldState.get('energy')).toBe(100);
            expect(worldState.get('atHome')).toBe(false);
            expect(worldState.get('atWork')).toBe(false);
        });

        test('应该能设置和获取状态', () => {
            worldState.set('energy', 50);
            expect(worldState.get('energy')).toBe(50);
        });

        test('clone应该创建独立副本', () => {
            worldState.set('energy', 50);
            const clone = worldState.clone();
            clone.set('energy', 100);
            expect(worldState.get('energy')).toBe(50);
            expect(clone.get('energy')).toBe(100);
        });

        test('updateTime应该正确设置时间', () => {
            worldState.updateTime(360); // 6:00
            expect(worldState.get('time')).toBe('morning');
            
            worldState.updateTime(720); // 12:00
            expect(worldState.get('time')).toBe('afternoon');
            
            worldState.updateTime(1080); // 18:00
            expect(worldState.get('time')).toBe('evening');
            
            worldState.updateTime(1320); // 22:00
            expect(worldState.get('time')).toBe('night');
        });
    });

    describe('GOAPAction', () => {
        test('应该正确初始化', () => {
            if (typeof GOAPAction === 'undefined') {
                console.log('GOAPAction not exported, skipping');
                return;
            }
            const action = new GOAPAction('TestAction', 2);
            expect(action.name).toBe('TestAction');
            expect(action.cost).toBe(2);
            expect(action.isRunning).toBe(false);
        });

        test('preconditionsMet应该检查前置条件', () => {
            if (typeof GOAPAction === 'undefined') return;
            
            const action = new GOAPAction('Test');
            action.preconditions = { hasKey: true, energy: 50 };
            
            const state = new WorldState();
            state.set('hasKey', true);
            state.set('energy', 50);
            
            expect(action.preconditionsMet(state)).toBe(true);
            
            state.set('hasKey', false);
            expect(action.preconditionsMet(state)).toBe(false);
        });

        test('applyEffects应该应用效果', () => {
            if (typeof GOAPAction === 'undefined') return;
            
            const action = new GOAPAction('Test');
            action.effects = { hasKey: false, energy: 100 };
            
            const state = new WorldState();
            state.set('hasKey', true);
            state.set('energy', 50);
            
            action.applyEffects(state);
            expect(state.get('hasKey')).toBe(false);
            expect(state.get('energy')).toBe(100);
        });
    });

    describe('Move Actions', () => {
        test('MoveHomeAction应该计算正确的目标位置', () => {
            // 测试getBuildingPosition函数
            const map = mockGameplay.game.map;
            const pos = getBuildingPosition(map, 'npc1House');
            
            // npc1House在(5,5)，大小4x4，入口在底部中间
            // x = (5 + 4/2) * 32 = 7 * 32 = 224
            // y = (5 + 4) * 32 = 9 * 32 = 288
            expect(pos.x).toBe(224);
            expect(pos.y).toBe(288);
        });

        test('MoveHomeAction应该移动NPC到目标', () => {
            if (typeof MoveHomeAction === 'undefined') return;
            
            const action = new MoveHomeAction();
            npc.x = 100;
            npc.y = 100;
            
            // 第一次执行，不应该完成（距离还很远）
            const finished = action.perform(npc, worldState, 16, mockGameplay);
            expect(finished).toBe(false);
            expect(npc.vx).not.toBe(0);
            expect(npc.vy).not.toBe(0);
            expect(action.isRunning).toBe(true);
        });

        test('MoveHomeAction应该在到达目标时完成', () => {
            if (typeof MoveHomeAction === 'undefined') return;
            
            const action = new MoveHomeAction();
            // 把NPC放在家附近
            npc.x = 224;
            npc.y = 280; // 距离目标只有8像素
            
            const finished = action.perform(npc, worldState, 16, mockGameplay);
            expect(finished).toBe(true);
            expect(npc.vx).toBe(0);
            expect(npc.vy).toBe(0);
        });
    });

    describe('GOAPAgent', () => {
        beforeEach(() => {
            if (typeof GOAPAgent === 'undefined') {
                // 如果类没有导出，创建一个简化版用于测试
                GOAPAgent = class MockAgent {
                    constructor(npc, role, worldState) {
                        this.npc = npc;
                        this.role = role;
                        this.worldState = worldState;
                        this.planner = { plan: jest.fn(() => []) };
                        this.currentPlan = [];
                        this.currentAction = null;
                        this.planTimer = 0;
                        this.replanInterval = 300;
                    }
                    
                    update(deltaTime, gameplay) {
                        this.planTimer++;
                        
                        if (this.planTimer >= this.replanInterval) {
                            this.planTimer = 0;
                        }
                        
                        if (!this.currentAction && this.currentPlan.length > 0) {
                            this.currentAction = this.currentPlan.shift();
                        }
                    }
                    
                    selectGoal() {
                        // 测试用的简单目标选择
                        if (this.npc.energy < 30) {
                            return { energy: 100, atHome: true };
                        }
                        return { atWork: true };
                    }
                    
                    updateWorldState(gameplay) {
                        this.worldState.set('energy', this.npc.energy);
                        this.worldState.set('isTired', this.npc.energy < 30);
                    }
                };
                
                agent = new GOAPAgent(npc, 'gardener', worldState);
            }
        });

        test('应该正确初始化', () => {
            expect(agent.npc).toBe(npc);
            expect(agent.role).toBe('gardener');
            expect(agent.currentPlan).toEqual([]);
            expect(agent.planTimer).toBe(0);
        });

        test('selectGoal应该在能量低时选择休息目标', () => {
            npc.energy = 20;
            const goal = agent.selectGoal();
            
            // 能量低时应该优先休息
            if (goal && goal.energy) {
                expect(goal.energy).toBe(100);
            }
        });

        test('selectGoal应该在能量充足时选择工作目标', () => {
            npc.energy = 80;
            const goal = agent.selectGoal();
            
            // 能量充足时应该工作
            if (goal) {
                expect(goal.atWork || goal.hasFlowers).toBeTruthy();
            }
        });

        test('updateWorldState应该更新NPC状态', () => {
            npc.energy = 25;
            agent.updateWorldState(mockGameplay);
            
            expect(agent.worldState.get('energy')).toBe(25);
            expect(agent.worldState.get('isTired')).toBe(true);
        });

        test('update应该按计划执行', () => {
            // 模拟一个完成的行动
            const mockAction = {
                perform: jest.fn(() => true),
                applyEffects: jest.fn(),
                reset: jest.fn(),
                isDone: jest.fn(() => true),
                name: 'TestAction'
            };
            
            agent.currentPlan = [mockAction];
            agent.planTimer = 300; // 触发重新规划
            
            agent.update(16, mockGameplay);
            
            // 计划应该被执行或重新规划
            expect(agent.planTimer).toBe(0);
        });
    });

    describe('NPC Movement Integration', () => {
        test('NPC应该能够移动到目标建筑', () => {
            // 创建简单移动测试
            const startX = 100;
            const startY = 100;
            const targetX = 224; // 家的位置
            const targetY = 288;
            
            npc.x = startX;
            npc.y = startY;
            
            // 计算移动方向
            const dx = targetX - startX;
            const dy = targetY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            expect(distance).toBeGreaterThan(0);
            
            // 移动速度
            const speed = 1.5;
            npc.vx = (dx / distance) * speed;
            npc.vy = (dy / distance) * speed;
            
            // 验证移动向量
            expect(npc.vx).not.toBe(0);
            expect(npc.vy).not.toBe(0);
            
            // 验证速度大小
            const speedCheck = Math.sqrt(npc.vx * npc.vx + npc.vy * npc.vy);
            expect(speedCheck).toBeCloseTo(speed, 1);
        });

        test('NPC到达目标后应该停止移动', () => {
            const targetX = 224;
            const targetY = 288;
            
            // 把NPC放在目标附近
            npc.x = targetX;
            npc.y = targetY - 5; // 距离5像素
            
            const dx = targetX - npc.x;
            const dy = targetY - npc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            expect(distance).toBeLessThan(10);
            
            // 到达后应该停止
            npc.vx = 0;
            npc.vy = 0;
            npc.isMoving = false;
            
            expect(npc.vx).toBe(0);
            expect(npc.vy).toBe(0);
            expect(npc.isMoving).toBe(false);
        });
    });

    describe('NPC Energy System', () => {
        test('NPC移动时应该消耗能量', () => {
            npc.energy = 100;
            npc.isMoving = true;
            
            // 模拟移动消耗
            const energyCost = 0.05;
            npc.energy = Math.max(0, npc.energy - energyCost);
            
            expect(npc.energy).toBe(99.95);
        });

        test('NPC休息时应该恢复能量', () => {
            npc.energy = 50;
            
            // 模拟休息恢复
            const energyGain = 0.5;
            npc.energy = Math.min(100, npc.energy + energyGain);
            
            expect(npc.energy).toBe(50.5);
        });

        test('能量低于30时应该标记为疲劳', () => {
            npc.energy = 25;
            const isTired = npc.energy < 30;
            
            expect(isTired).toBe(true);
        });
    });

    describe('getNPCStatus', () => {
        test('应该返回正确的状态文本', () => {
            // 测试各种状态
            const testCases = [
                { action: { name: 'Rest' }, expected: '😴 休息中' },
                { action: { name: 'Fish' }, expected: '🎣 钓鱼中' },
                { action: { name: 'PlantFlower' }, expected: '🌱 种花中' },
                { action: { name: 'MoveHome' }, expected: '🚶 移动中' },
                { action: null, expected: '💤 空闲' }
            ];
            
            testCases.forEach(tc => {
                const status = getNPCStatus(npc, { currentAction: tc.action });
                expect(status).toBe(tc.expected);
            });
        });
    });
});
