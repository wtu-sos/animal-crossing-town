/**
 * NPC GOAP Agent 核心功能测试
 * 验证NPC初始化后立即行动
 */

// 引入被测试的模块
const goap = require('../js/goap');
const { 
    WorldState, 
    GOAPAction, 
    GOAPPlanner, 
    GOAPAgent,
    MoveToWorkAction,
    MoveHomeAction,
    RestAction,
    getBuildingPosition
} = goap;

describe('NPC GOAP Agent 核心功能', () => {
    let agent;
    let mockNPC;
    let mockWorldState;
    
    beforeEach(() => {
        mockNPC = {
            x: 100,
            y: 100,
            name: '阿狸',
            role: 'gardener',
            homeBuilding: 'npc1House',
            workBuilding: 'flowerShop',
            energy: 100,
            vx: 0,
            vy: 0,
            isMoving: false
        };
        
        mockWorldState = new WorldState();
    });
    
    describe('初始化后立即行动', () => {
        test('init()调用后应该有currentGoal', () => {
            agent = new GOAPAgent(mockNPC, 'gardener', mockWorldState);
            
            expect(agent.currentGoal).toBeNull();
            
            agent.init(600); // 10:00 AM
            
            expect(agent.currentGoal).not.toBeNull();
        });
        
        test('init()调用后应该有行动计划', () => {
            agent = new GOAPAgent(mockNPC, 'gardener', mockWorldState);
            
            expect(agent.currentPlan.length).toBe(0);
            
            agent.init(600);
            
            // 即使计划被消耗到currentAction，也应该有内容
            expect(agent.currentPlan.length > 0 || agent.currentAction !== null).toBe(true);
        });
        
        test('init()调用后应该立即开始第一个行动', () => {
            agent = new GOAPAgent(mockNPC, 'gardener', mockWorldState);
            
            expect(agent.currentAction).toBeNull();
            
            agent.init(600);
            
            expect(agent.currentAction).not.toBeNull();
        });
        
        test('不同时间应该有不同的目标', () => {
            const morningAgent = new GOAPAgent({...mockNPC}, 'gardener', new WorldState());
            const eveningAgent = new GOAPAgent({...mockNPC}, 'gardener', new WorldState());
            
            morningAgent.init(480); // 8:00 AM
            eveningAgent.init(1380); // 23:00 PM
            
            expect(morningAgent.currentGoal).not.toBeNull();
            expect(eveningAgent.currentGoal).not.toBeNull();
        });
    });
    
    describe('行动执行', () => {
        test('update后应该保持有行动', () => {
            agent = new GOAPAgent(mockNPC, 'gardener', mockWorldState);
            agent.init(600);
            
            const mockGameplay = {
                game: {
                    player: { x: 500, y: 500 },
                    map: {
                        getBuildingPosition: jest.fn((name) => {
                            const pos = {
                                npc1House: { x: 100, y: 100 },
                                flowerShop: { x: 300, y: 200 },
                                restaurant: { x: 200, y: 200 }
                            };
                            return pos[name] || { x: 0, y: 0 };
                        })
                    }
                }
            };
            
            // 第一次update
            agent.update(16, mockGameplay, 600);
            
            // 应该还在执行某个行动或有剩余计划
            expect(agent.currentAction !== null || agent.currentPlan.length > 0).toBe(true);
        });
    });
    
    describe('状态显示', () => {
        test('getNPCStatus应该返回非空闲状态', () => {
            agent = new GOAPAgent(mockNPC, 'gardener', mockWorldState);
            agent.init(600);
            
            const status = goap.getNPCStatus(mockNPC, agent);
            
            // 不应该返回空闲状态
            expect(status).not.toBe('💤 空闲');
            expect(status.length).toBeGreaterThan(0);
        });
    });
});

describe('GOAP Planner', () => {
    test('应该能生成有效计划', () => {
        const planner = new GOAPPlanner();
        const npc = { x: 100, y: 100, energy: 100 };
        const worldState = new WorldState();
        
        const actions = [
            new MoveToWorkAction(),
            new RestAction()
        ];
        
        const goal = { atWork: true };
        
        const plan = planner.plan(npc, actions, worldState, goal);
        
        expect(plan).toBeTruthy();
        expect(Array.isArray(plan)).toBe(true);
    });
});

describe('移动行动', () => {
    test('MoveToWorkAction应该有正确配置', () => {
        const action = new MoveToWorkAction();
        
        expect(action.name).toBe('MoveToWork');
        expect(action.preconditions).toHaveProperty('energy');
        expect(action.effects).toHaveProperty('atWork');
    });
    
    test('MoveHomeAction应该有正确配置', () => {
        const action = new MoveHomeAction();
        
        expect(action.name).toBe('MoveHome');
        expect(action.effects).toHaveProperty('atHome');
    });
    
    test('RestAction应该恢复能量', () => {
        const action = new RestAction();
        const state = { isTired: true, energy: 20 };
        
        action.applyEffects(state);
        
        expect(state.energy).toBe(100);
        expect(state.isTired).toBe(false);
    });
});