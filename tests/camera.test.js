/**
 * Camera 类单元测试
 */

describe('Camera', () => {
  let Camera;
  let camera;

  beforeEach(() => {
    Camera = require('../js/camera.js');
    camera = new Camera(800, 600);
  });

  describe('初始化', () => {
    test('应该正确设置画布尺寸', () => {
      expect(camera.width).toBe(800);
      expect(camera.height).toBe(600);
    });

    test('初始位置应该在原点', () => {
      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
    });

    test('应该有 4 个视差层', () => {
      expect(camera.parallaxLayers).toHaveLength(4);
    });
  });

  describe('跟随目标', () => {
    test('follow 应该设置目标位置', () => {
      camera.follow(500, 400);
      
      // 目标应该是目标位置减去画布中心
      expect(camera.targetX).toBe(500 - 800 / 2);
      expect(camera.targetY).toBe(400 - 600 / 2);
    });

    test('update 应该平滑移动到目标位置', () => {
      camera.follow(500, 400);
      const initialX = camera.x;
      
      camera.update();
      
      // 应该向目标位置移动一部分（由 smoothness 控制）
      expect(camera.x).not.toBe(initialX);
      expect(camera.x).toBeLessThan(camera.targetX);
    });
  });

  describe('视差滚动', () => {
    test('视差层应该有正确的速度', () => {
      expect(camera.parallaxLayers[0].speed).toBe(0.1); // 远景
      expect(camera.parallaxLayers[1].speed).toBe(0.3); // 中景
      expect(camera.parallaxLayers[2].speed).toBe(0.6); // 近景
      expect(camera.parallaxLayers[3].speed).toBe(1.0); // 主层
    });

    test('getParallaxOffset 应该返回正确的偏移', () => {
      camera.x = 100;
      // 不调用 update()，直接测试计算
      
      const offset = camera.getParallaxOffset(0);
      expect(offset).toBeCloseTo(100 * 0.1, 5); // 0.1 是远景层速度
    });
  });

  describe('坐标转换', () => {
    beforeEach(() => {
      camera.x = 100;
      camera.y = 50;
    });

    test('worldToScreen 应该正确转换坐标', () => {
      const screen = camera.worldToScreen(200, 150);
      
      expect(screen.x).toBe(200 - 100);
      expect(screen.y).toBe(150 - 50);
    });

    test('screenToWorld 应该正确转换坐标', () => {
      const world = camera.screenToWorld(100, 100);
      
      expect(world.x).toBe(200);
      expect(world.y).toBe(150);
    });
  });

  describe('边界限制', () => {
    beforeEach(() => {
      camera.setBounds(2000, 1500);
    });

    test('clampToBounds 应该限制相机在地图内', () => {
      camera.targetX = 3000;
      camera.targetY = 2000;
      camera.x = 3000;
      camera.y = 2000;
      
      camera.clampToBounds();
      
      expect(camera.x).toBeLessThanOrEqual(2000 - 800);
      expect(camera.y).toBeLessThanOrEqual(1500 - 600);
    });

    test('不应该允许负坐标', () => {
      camera.targetX = -100;
      camera.targetY = -100;
      camera.x = -100;
      camera.y = -100;
      
      camera.clampToBounds();
      
      expect(camera.x).toBeGreaterThanOrEqual(0);
      expect(camera.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('震动效果', () => {
    test('addShake 应该添加震动', () => {
      camera.addShake(10);
      expect(camera.shake).toBe(10);
    });

    test('update 应该逐渐减弱震动', () => {
      camera.addShake(10);
      camera.follow(400, 300);
      
      camera.update();
      
      expect(camera.shake).toBeLessThan(10);
    });

    test('震动应该影响相机位置', () => {
      camera.addShake(10);
      camera.follow(400, 300);
      
      // 记录更新前的目标位置
      const targetX = camera.targetX;
      const targetY = camera.targetY;
      
      camera.update();
      
      // 相机位置应该偏离目标（因为震动）
      expect(camera.x).not.toBe(targetX);
      expect(camera.y).not.toBe(targetY);
    });
  });
});
