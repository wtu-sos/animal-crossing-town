/**
 * 玩家能量系统单元测试
 */

const Player = require('../js/player.js');

describe('Player Energy System', () => {
    let player;
    let mockInput;
    let mockMap;

    beforeEach(() => {
        // 创建测试玩家
        player = new Player(100, 100);
        
        // 模拟输入（静止）
        mockInput = {
            getMovementVector: jest.fn(() => ({ x: 0, y: 0 }))
        };
        
        // 模拟地图
        mockMap = {
            pixelWidth: 1920,
            pixelHeight: 1920,
            checkCollision: jest.fn(() => false)
        };
    });

    describe('能量初始化', () => {
        test('应该初始化为100能量', () => {
            expect(player.energy).toBe(100);
            expect(player.maxEnergy).toBe(100);
        });

        test('初始状态不应该在吃饭', () => {
            expect(player.isEating).toBe(false);
            expect(player.eatTimer).toBe(0);
        });
    });

    describe('能量消耗', () => {
        test('移动时应该消耗能量', () => {
            player.energy = 100;
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            player.update(mockInput, mockMap);
            
            expect(player.energy).toBeLessThan(100);
            expect(player.energy).toBeCloseTo(99.97, 2);
        });

        test('静止时不应该消耗能量', () => {
            player.energy = 100;
            mockInput.getMovementVector.mockReturnValue({ x: 0, y: 0 });
            
            player.update(mockInput, mockMap);
            
            expect(player.energy).toBe(100);
        });

        test('能量不应该低于0', () => {
            player.energy = 0.01;
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            // 多次移动
            for (let i = 0; i < 10; i++) {
                player.update(mockInput, mockMap);
            }
            
            expect(player.energy).toBe(0);
        });
    });

    describe('低能量效果', () => {
        test('能量低于20时速度应该减半', () => {
            player.energy = 15; // 低能量
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            const startX = player.x;
            player.update(mockInput, mockMap);
            const moveDistance = player.x - startX;
            
            // 正常速度是4，低能量时应该是2
            expect(moveDistance).toBe(2);
        });

        test('能量充足时应该全速移动', () => {
            player.energy = 100; // 满能量
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            const startX = player.x;
            player.update(mockInput, mockMap);
            const moveDistance = player.x - startX;
            
            // 正常速度是4
            expect(moveDistance).toBe(4);
        });

        test('isHungry应该在能量低于30时返回true', () => {
            player.energy = 30;
            expect(player.isHungry()).toBe(false);
            
            player.energy = 29;
            expect(player.isHungry()).toBe(true);
            
            player.energy = 10;
            expect(player.isHungry()).toBe(true);
        });
    });

    describe('吃饭功能', () => {
        test('startEating应该开始吃饭状态', () => {
            const result = player.startEating();
            
            expect(result).toBe(true);
            expect(player.isEating).toBe(true);
            expect(player.eatTimer).toBe(0);
        });

        test('吃饭时不应该能再次开始吃饭', () => {
            player.startEating();
            const result = player.startEating();
            
            expect(result).toBe(false);
        });

        test('吃饭时不应该能移动', () => {
            player.startEating();
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            const startX = player.x;
            player.update(mockInput, mockMap);
            
            expect(player.x).toBe(startX);
            expect(player.isMoving).toBe(false);
        });

        test('3秒后应该完成吃饭并恢复能量', () => {
            player.energy = 30;
            player.startEating();
            
            // 模拟3秒（每帧16ms）
            for (let i = 0; i < 188; i++) { // 3000ms / 16ms ≈ 188帧
                player.update(mockInput, mockMap);
            }
            
            expect(player.isEating).toBe(false);
            expect(player.energy).toBe(80); // 30 + 50
        });

        test('吃饭恢复的能量不应该超过最大值', () => {
            player.energy = 80;
            player.startEating();
            
            // 快速跳过吃饭时间
            player.eatTimer = 3000;
            player.update(mockInput, mockMap);
            
            expect(player.energy).toBe(100); // 不能超过100
        });

        test('finishEating应该正确恢复能量', () => {
            player.energy = 40;
            player.isEating = true;
            
            player.finishEating();
            
            expect(player.isEating).toBe(false);
            expect(player.energy).toBe(90); // 40 + 50
        });
    });

    describe('能量百分比', () => {
        test('getEnergyPercent应该返回正确百分比', () => {
            player.energy = 100;
            expect(player.getEnergyPercent()).toBe(100);
            
            player.energy = 50;
            expect(player.getEnergyPercent()).toBe(50);
            
            player.energy = 0;
            expect(player.getEnergyPercent()).toBe(0);
        });

        test('getEnergyPercent应该处理小数', () => {
            player.energy = 33.33;
            const percent = player.getEnergyPercent();
            expect(percent).toBeCloseTo(33.33, 1);
        });
    });

    describe('饭店检测', () => {
        test('isNearRestaurant应该在靠近饭店时返回true', () => {
            // 假设饭店在 (640, 640) 左右
            player.x = 640;
            player.y = 640;
            
            const map = {
                getBuildingPosition: jest.fn(() => ({ x: 640, y: 640 }))
            };
            
            expect(player.isNearRestaurant(map)).toBe(true);
        });

        test('isNearRestaurant应该在远离饭店时返回false', () => {
            player.x = 100;
            player.y = 100;
            
            const map = {
                getBuildingPosition: jest.fn(() => ({ x: 640, y: 640 }))
            };
            
            expect(player.isNearRestaurant(map)).toBe(false);
        });

        test('应该使用正确的阈值(40像素)', () => {
            const map = {
                getBuildingPosition: jest.fn(() => ({ x: 100, y: 100 }))
            };
            
            // 距离正好39像素
            player.x = 139;
            player.y = 100;
            expect(player.isNearRestaurant(map)).toBe(true);
            
            // 距离正好41像素
            player.x = 141;
            player.y = 100;
            expect(player.isNearRestaurant(map)).toBe(false);
        });
    });

    describe('吃饭动画', () => {
        test('吃饭期间isMoving应该为false', () => {
            player.startEating();
            expect(player.isMoving).toBe(false);
            
            // 尝试移动
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            player.update(mockInput, mockMap);
            
            expect(player.isMoving).toBe(false);
        });

        test('吃饭期间能量不应该变化', () => {
            player.energy = 50;
            player.startEating();
            
            // 模拟几帧
            for (let i = 0; i < 10; i++) {
                player.update(mockInput, mockMap);
            }
            
            expect(player.energy).toBe(50);
        });
    });

    describe('边界情况', () => {
        test('能量消耗不应该导致负数', () => {
            player.energy = 0.01;
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            player.update(mockInput, mockMap);
            
            expect(player.energy).toBeGreaterThanOrEqual(0);
        });

        test('恢复能量不应该超过最大值', () => {
            player.energy = 90;
            player.startEating();
            player.finishEating();
            
            expect(player.energy).toBe(100); // 不是140
        });

        test('持续移动应该逐渐降低能量', () => {
            player.energy = 100;
            mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
            
            // 移动100帧
            for (let i = 0; i < 100; i++) {
                player.update(mockInput, mockMap);
            }
            
            // 应该消耗约3点能量
            expect(player.energy).toBeCloseTo(97, 0);
        });
    });
});

/**
 * 能量系统集成测试
 */
describe('Energy System Integration', () => {
    test('完整的能量循环: 满能量 -> 移动消耗 -> 吃饭恢复', () => {
        const player = new Player(100, 100);
        const mockInput = {
            getMovementVector: jest.fn(() => ({ x: 1, y: 0 }))
        };
        const mockMap = {
            pixelWidth: 1920,
            pixelHeight: 1920,
            checkCollision: () => false
        };

        // 初始满能量
        expect(player.energy).toBe(100);

        // 移动消耗能量到30以下
        player.energy = 25;
        expect(player.isHungry()).toBe(true);

        // 去饭店吃饭
        player.startEating();
        expect(player.isEating).toBe(true);

        // 完成吃饭
        player.finishEating();
        expect(player.energy).toBe(75);
        expect(player.isEating).toBe(false);
        expect(player.isHungry()).toBe(false);
    });

    test('低能量状态应该影响移动速度', () => {
        const player = new Player(100, 100);
        const mockInput = {
            getMovementVector: jest.fn(() => ({ x: 1, y: 0 }))
        };
        const mockMap = {
            pixelWidth: 1920,
            pixelHeight: 1920,
            checkCollision: () => false
        };

        // 高能量移动
        player.energy = 100;
        const startX1 = player.x;
        player.update(mockInput, mockMap);
        const move1 = player.x - startX1;

        // 低能量移动
        player.energy = 10;
        const startX2 = player.x;
        player.update(mockInput, mockMap);
        const move2 = player.x - startX2;

        // 低能量时移动距离应该是高能量时的一半
        expect(move2).toBe(move1 / 2);
    });
});
