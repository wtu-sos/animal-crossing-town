/**
 * InputManager 类单元测试
 */

describe('InputManager', () => {
  let InputManager;
  let input;

  beforeEach(() => {
    InputManager = require('../js/input.js');
    input = new InputManager();
  });

  describe('初始化', () => {
    test('应该初始化按键状态', () => {
      expect(input.keys).toEqual({});
    });

    test('应该初始化摇杆状态', () => {
      expect(input.joystick.active).toBe(false);
      expect(input.joystick.dx).toBe(0);
      expect(input.joystick.dy).toBe(0);
    });
  });

  describe('键盘输入', () => {
    test('isKeyPressed 应该返回按键状态', () => {
      input.keys['a'] = true;
      expect(input.isKeyPressed('a')).toBe(true);
      expect(input.isKeyPressed('b')).toBe(false);
    });

    test('isKeyPressed 应该不区分大小写', () => {
      input.keys['w'] = true;
      expect(input.isKeyPressed('W')).toBe(true);
      expect(input.isKeyPressed('w')).toBe(true);
    });
  });

  describe('getMovementVector', () => {
    test('无输入时应该返回零向量', () => {
      const vector = input.getMovementVector();
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(0);
    });

    test('W 键应该产生向上的向量', () => {
      input.keys['w'] = true;
      const vector = input.getMovementVector();
      expect(vector.y).toBeLessThan(0);
    });

    test('S 键应该产生向下的向量', () => {
      input.keys['s'] = true;
      const vector = input.getMovementVector();
      expect(vector.y).toBeGreaterThan(0);
    });

    test('A 键应该产生向左的向量', () => {
      input.keys['a'] = true;
      const vector = input.getMovementVector();
      expect(vector.x).toBeLessThan(0);
    });

    test('D 键应该产生向右的向量', () => {
      input.keys['d'] = true;
      const vector = input.getMovementVector();
      expect(vector.x).toBeGreaterThan(0);
    });

    test('方向键应该工作', () => {
      input.keys['arrowup'] = true;
      const vector = input.getMovementVector();
      expect(vector.y).toBeLessThan(0);
    });

    test('向量长度应该归一化', () => {
      input.keys['w'] = true;
      input.keys['d'] = true;
      const vector = input.getMovementVector();
      const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      expect(length).toBeCloseTo(1, 5);
    });
  });

  describe('摇杆输入', () => {
    test('摇杆激活时应该优先使用摇杆', () => {
      // 设置键盘输入
      input.keys['w'] = true;
      
      // 设置摇杆输入
      input.joystick.active = true;
      input.joystick.dx = 0.5;
      input.joystick.dy = 0.5;
      
      const vector = input.getMovementVector();
      
      // 应该使用摇杆值而不是键盘值
      expect(vector.x).toBe(0.5);
      expect(vector.y).toBe(0.5);
    });

    test('摇杆未激活时不应影响输入', () => {
      input.joystick.active = false;
      input.joystick.dx = 0.5;
      input.joystick.dy = 0.5;
      
      const vector = input.getMovementVector();
      
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(0);
    });
  });

  describe('对角移动', () => {
    test('同时按 W 和 D 应该产生对角线向量', () => {
      input.keys['w'] = true;
      input.keys['d'] = true;
      
      const vector = input.getMovementVector();
      
      expect(vector.x).not.toBe(0);
      expect(vector.y).not.toBe(0);
      expect(vector.x).toBeGreaterThan(0);
      expect(vector.y).toBeLessThan(0);
    });

    test('对角线向量应该归一化', () => {
      input.keys['w'] = true;
      input.keys['a'] = true;
      
      const vector = input.getMovementVector();
      const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      
      expect(length).toBeCloseTo(1, 5);
    });
  });

  describe('updateJoystick', () => {
    beforeEach(() => {
      input.startX = 100;
      input.startY = 100;
    });

    test('应该计算正确的方向向量', () => {
      input.updateJoystick(140, 100, 40); // 向右移动 40 像素
      
      expect(input.joystick.dx).toBe(1);
      expect(input.joystick.dy).toBe(0);
      expect(input.joystick.force).toBe(1);
    });

    test('应该限制最大距离', () => {
      input.updateJoystick(200, 100, 40); // 向右移动 100 像素，超过最大距离
      
      // dx 应该被限制在 1
      expect(input.joystick.dx).toBeLessThanOrEqual(1);
      expect(input.joystick.force).toBe(1);
    });

    test('应该计算正确的角度', () => {
      input.updateJoystick(100, 60, 40); // 向上移动 40 像素
      
      expect(input.joystick.dx).toBe(0);
      expect(input.joystick.dy).toBe(-1);
    });

    test('力的大小应该与距离成正比', () => {
      input.updateJoystick(120, 100, 40); // 向右移动 20 像素（一半距离）
      
      expect(input.joystick.force).toBe(0.5);
    });
  });
});
