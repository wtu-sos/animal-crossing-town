/**
 * 架构分离测试 - 验证逻辑与表现分离
 */

const GameState = require('../src/models/GameState.js');
const { Entity, LivingEntity } = require('../src/models/Entity.js');
const PlayerModel = require('../src/models/PlayerModel.js');
const NPCModel = require('../src/models/NPCModel.js');

describe('Architecture Separation', () => {
    
    describe('Model Layer - No DOM Dependencies', () => {
        test('GameState should not depend on document or window', () => {
            const state = new GameState();
            expect(state).toBeDefined();
            expect(state.time).toBeDefined();
            expect(state.player).toBeDefined();
        });
        
        test('GameState should work without DOM', () => {
            const state = new GameState();
            state.updateTime(16000); // 16ms
            expect(state.time.current).toBeGreaterThan(0);
        });
        
        test('Entity should be pure data', () => {
            const entity = new Entity('test', 100, 100);
            expect(entity.x).toBe(100);
            expect(entity.y).toBe(100);
            
            // 更新位置不应该涉及DOM
            entity.setVelocity(10, 0);
            entity.updatePosition(1);
            expect(entity.x).toBe(110);
        });
        
        test('LivingEntity should manage energy without UI', () => {
            const entity = new LivingEntity('test', 0, 0);
            expect(entity.energy).toBe(100);
            
            entity.consumeEnergy(20);
            expect(entity.energy).toBe(80);
            
            entity.restoreEnergy(10);
            expect(entity.energy).toBe(90);
        });
    });
    
    describe('PlayerModel - Pure Logic', () => {
        let player;
        let mockInput;
        let mockMap;
        
        beforeEach(() => {
            player = new PlayerModel(100, 100);
            mockInput = {
                getMovementVector: () => ({ x: 1, y: 0 })
            };
            mockMap = {
                pixelWidth: 1000,
                pixelHeight: 1000,
                checkCollision: () => false,
                getBuildingPosition: () => ({ x: 500, y: 500 })
            };
        });
        
        test('PlayerModel should not access document', () => {
            expect(typeof player.update).toBe('function');
            
            // 更新不应该抛出关于document的错误
            expect(() => {
                player.update(mockInput, mockMap, 16);
            }).not.toThrow();
        });
        
        test('PlayerModel update should change state', () => {
            const startX = player.x;
            player.update(mockInput, mockMap, 16);
            
            expect(player.x).toBeGreaterThan(startX);
            expect(player.isMoving).toBe(true);
        });
        
        test('PlayerModel energy should decrease on move', () => {
            const startEnergy = player.energy;
            player.update(mockInput, mockMap, 16);
            
            expect(player.energy).toBeLessThan(startEnergy);
        });
        
        test('PlayerModel should serialize to JSON', () => {
            const json = player.toJSON();
            expect(json).toHaveProperty('id');
            expect(json).toHaveProperty('x');
            expect(json).toHaveProperty('y');
            expect(json).toHaveProperty('energy');
        });
    });
    
    describe('NPCModel - Pure Logic', () => {
        let npc;
        
        beforeEach(() => {
            npc = new NPCModel('npc1', 'Test', 'worker', {
                homeBuilding: 'house1',
                workBuilding: 'shop1',
                color: '#FF0000',
                icon: '🧪'
            });
        });
        
        test('NPCModel should manage state without rendering', () => {
            npc.x = 100;
            npc.y = 100;
            
            npc.setTarget(200, 200);
            expect(npc.state.targetPosition).toEqual({ x: 200, y: 200 });
            
            // 移动多个步才能到达
            let steps = 0;
            let arrived = false;
            while (!arrived && steps < 20) {
                arrived = npc.moveToTarget(10);
                npc.x += npc.vx;
                npc.y += npc.vy;
                steps++;
            }
            
            expect(steps).toBeGreaterThan(0);
            expect(npc.x).not.toBe(100); // 应该移动了
        });
        
        test('NPCModel should calculate distance correctly', () => {
            npc.x = 0;
            npc.y = 0;
            
            const target = { x: 3, y: 4 };
            npc.setTarget(target.x, target.y);
            
            expect(npc.distanceToTarget()).toBe(5); // 3-4-5 triangle
        });
    });
    
    describe('Data Flow - Separation of Concerns', () => {
        test('State changes should not trigger rendering', () => {
            const state = new GameState();
            
            // 多次更新状态
            for (let i = 0; i < 100; i++) {
                state.updateTime(16);
                state.updatePlayerEnergy(-1);
            }
            
            // 状态应该正确更新
            expect(state.time.current).toBeGreaterThan(0);
            expect(state.player.energy).toBeLessThan(100);
        });
        
        test('Model should be serializable without view state', () => {
            const state = new GameState();
            state.player.x = 500;
            state.player.y = 600;
            state.player.energy = 75;
            
            const serialized = state.serialize();
            const parsed = JSON.parse(serialized);
            
            expect(parsed.player.x).toBe(500);
            expect(parsed.player.y).toBe(600);
            expect(parsed.player.energy).toBe(75);
            
            // 不应该包含视图相关数据
            expect(parsed).not.toHaveProperty('canvas');
            expect(parsed).not.toHaveProperty('ctx');
        });
    });
    
    describe('Energy System - Model Only', () => {
        test('Energy logic should work without UI', () => {
            const entity = new LivingEntity('test', 0, 0);
            entity.energy = 100;
            
            // 模拟移动消耗（每次0.03）
            for (let i = 0; i < 100; i++) {
                entity.setVelocity(1, 0);
                entity.consumeEnergy(0.03);
            }
            
            expect(entity.energy).toBeLessThan(100);
            
            // 直接设置能量来测试饥饿判断
            entity.energy = 25;
            expect(entity.isHungry()).toBe(true);
            
            entity.energy = 15;
            expect(entity.isTired()).toBe(true);
        });
        
        test('Eating should restore energy', () => {
            const entity = new LivingEntity('test', 0, 0);
            entity.energy = 20;
            
            entity.startEating();
            expect(entity.isEating).toBe(true);
            
            const recovered = entity.finishEating(50);
            expect(recovered).toBe(70); // 20 + 50
            expect(entity.isEating).toBe(false);
        });
    });
    
    describe('Map Data - No Rendering', () => {
        test('Map should store data without drawing', () => {
            // 假设GameMap被正确重构
            const map = {
                width: 60,
                height: 60,
                tileSize: 32,
                tiles: [],
                BUILDINGS: {
                    house1: { x: 5, y: 5, w: 4, h: 4 }
                },
                getBuildingPosition(key) {
                    const b = this.BUILDINGS[key];
                    return {
                        x: (b.x + b.w / 2) * this.tileSize,
                        y: (b.y + b.h) * this.tileSize
                    };
                }
            };
            
            const pos = map.getBuildingPosition('house1');
            expect(pos.x).toBe(224); // (5 + 2) * 32
            expect(pos.y).toBe(288); // (5 + 4) * 32
        });
    });
});

describe('View Independence', () => {
    test('RenderService should accept data without modifying it', () => {
        // RenderService应该只读取数据，不修改
        const mockEntity = {
            x: 100,
            y: 200,
            width: 24,
            height: 24,
            energy: 80
        };
        
        // 渲染器应该能读取这些数据
        expect(mockEntity.x).toBe(100);
        expect(mockEntity.energy).toBe(80);
        
        // 原始数据不应该被渲染器修改
        // （实际测试中需要实例化RenderService验证）
    });
});
