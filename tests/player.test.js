/**
 * Player 类单元测试
 */

describe('Player', () => {
  let Player;
  let player;
  let mockInput;
  let mockMap;

  beforeEach(() => {
    // 加载 Player 类
    Player = require('../js/player.js');
    
    // 创建测试实例
    player = new Player(100, 100);
    
    // 模拟输入
    mockInput = {
      getMovementVector: jest.fn(() => ({ x: 0, y: 0 }))
    };
    
    // 模拟地图
    mockMap = {
      pixelWidth: 3200,
      pixelHeight: 3200,
      checkCollision: jest.fn(() => false)
    };
  });

  describe('初始化', () => {
    test('应该正确设置初始位置', () => {
      expect(player.x).toBe(100);
      expect(player.y).toBe(100);
    });

    test('应该有正确的尺寸', () => {
      expect(player.width).toBe(24);
      expect(player.height).toBe(24);
    });

    test('初始方向应该为 down', () => {
      expect(player.direction).toBe('down');
    });

    test('初始状态不应该在移动', () => {
      expect(player.isMoving).toBe(false);
    });
  });

  describe('移动', () => {
    test('向右移动应该增加 x 坐标', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      const initialX = player.x;
      
      player.update(mockInput, mockMap);
      
      expect(player.x).toBeGreaterThan(initialX);
      expect(player.direction).toBe('right');
    });

    test('向左移动应该减少 x 坐标', () => {
      mockInput.getMovementVector.mockReturnValue({ x: -1, y: 0 });
      const initialX = player.x;
      
      player.update(mockInput, mockMap);
      
      expect(player.x).toBeLessThan(initialX);
      expect(player.direction).toBe('left');
    });

    test('向下移动应该增加 y 坐标', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: 1 });
      const initialY = player.y;
      
      player.update(mockInput, mockMap);
      
      expect(player.y).toBeGreaterThan(initialY);
      expect(player.direction).toBe('down');
    });

    test('向上移动应该减少 y 坐标', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: -1 });
      const initialY = player.y;
      
      player.update(mockInput, mockMap);
      
      expect(player.y).toBeLessThan(initialY);
      expect(player.direction).toBe('up');
    });

    test('对角线移动应该归一化向量', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 0.707, y: 0.707 });
      const initialX = player.x;
      const initialY = player.y;
      
      player.update(mockInput, mockMap);
      
      expect(player.x).not.toBe(initialX);
      expect(player.y).not.toBe(initialY);
      expect(player.isMoving).toBe(true);
    });
  });

  describe('碰撞检测', () => {
    test('碰撞时 X 轴不应该移动', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      mockMap.checkCollision.mockImplementation((x, y) => x !== player.x);
      const initialX = player.x;
      
      player.update(mockInput, mockMap);
      
      expect(player.x).toBe(initialX);
    });

    test('碰撞时 Y 轴不应该移动', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: 1 });
      mockMap.checkCollision.mockImplementation((x, y) => y !== player.y);
      const initialY = player.y;
      
      player.update(mockInput, mockMap);
      
      expect(player.y).toBe(initialY);
    });
  });

  describe('边界限制', () => {
    test('不应该移出左边界', () => {
      player.x = 2;
      mockInput.getMovementVector.mockReturnValue({ x: -1, y: 0 });
      
      player.update(mockInput, mockMap);
      
      expect(player.x).toBeGreaterThanOrEqual(0);
    });

    test('不应该移出上边界', () => {
      player.y = 2;
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: -1 });
      
      player.update(mockInput, mockMap);
      
      expect(player.y).toBeGreaterThanOrEqual(0);
    });

    test('不应该移出右边界', () => {
      player.x = mockMap.pixelWidth - player.width - 2;
      mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      
      player.update(mockInput, mockMap);
      
      expect(player.x).toBeLessThanOrEqual(mockMap.pixelWidth - player.width);
    });

    test('不应该移出下边界', () => {
      player.y = mockMap.pixelHeight - player.height - 2;
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: 1 });
      
      player.update(mockInput, mockMap);
      
      expect(player.y).toBeLessThanOrEqual(mockMap.pixelHeight - player.height);
    });
  });

  describe('动画', () => {
    test('移动时应该更新动画帧', () => {
      mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      
      player.update(mockInput, mockMap);
      
      expect(player.isMoving).toBe(true);
      expect(player.animationTimer).toBeGreaterThan(0);
    });

    test('停止移动时应该重置动画', () => {
      // 先移动
      mockInput.getMovementVector.mockReturnValue({ x: 1, y: 0 });
      player.update(mockInput, mockMap);
      
      // 然后停止
      mockInput.getMovementVector.mockReturnValue({ x: 0, y: 0 });
      player.update(mockInput, mockMap);
      
      expect(player.isMoving).toBe(false);
      expect(player.animationFrame).toBe(0);
    });
  });

  describe('getBobOffset', () => {
    test('不移动时应该返回 0', () => {
      expect(player.getBobOffset()).toBe(0);
    });

    test('移动时应该返回非零值', () => {
      player.isMoving = true;
      player.animationFrame = 1;
      expect(player.getBobOffset()).not.toBe(0);
    });
  });

  describe('getBounds', () => {
    test('应该返回正确的边界框', () => {
      const bounds = player.getBounds();
      expect(bounds.x).toBe(player.x);
      expect(bounds.y).toBe(player.y);
      expect(bounds.width).toBe(player.width);
      expect(bounds.height).toBe(player.height);
    });
  });

  describe('setColors', () => {
    test('应该能设置颜色', () => {
      player.setColors({ shirt: '#FF0000', hair: '#00FF00' });
      expect(player.colors.shirt).toBe('#FF0000');
      expect(player.colors.hair).toBe('#00FF00');
    });
  });
});
