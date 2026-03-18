/**
 * GameMap 类单元测试
 */

describe('GameMap', () => {
  let GameMap;
  let map;

  beforeEach(() => {
    GameMap = require('../js/map.js');
    map = new GameMap(32);
  });

  describe('初始化', () => {
    test('应该正确设置瓦片大小', () => {
      expect(map.tileSize).toBe(32);
    });

    test('应该有正确的地图尺寸', () => {
      expect(map.width).toBe(100);
      expect(map.height).toBe(100);
    });

    test('像素尺寸应该正确计算', () => {
      expect(map.pixelWidth).toBe(3200);
      expect(map.pixelHeight).toBe(3200);
    });

    test('应该生成瓦片数据', () => {
      expect(map.tiles).toHaveLength(100);
      expect(map.tiles[0]).toHaveLength(100);
    });

    test('应该生成物体', () => {
      expect(map.objects.length).toBeGreaterThan(0);
    });
  });

  describe('瓦片类型', () => {
    test('应该定义所有瓦片类型', () => {
      expect(map.TILE_TYPES.GRASS).toBe(0);
      expect(map.TILE_TYPES.WATER).toBe(3);
      expect(map.TILE_TYPES.TREE).toBe(8);
    });

    test('getTile 应该返回正确的瓦片类型', () => {
      const tile = map.getTile(10, 10);
      expect(Object.values(map.TILE_TYPES)).toContain(tile);
    });

    test('getTile 应该处理越界坐标', () => {
      const tile = map.getTile(-1, -1);
      expect(tile).toBe(map.TILE_TYPES.WATER);
    });

    test('getTile 应该处理超出地图的坐标', () => {
      const tile = map.getTile(200, 200);
      expect(tile).toBe(map.TILE_TYPES.WATER);
    });
  });

  describe('碰撞检测', () => {
    test('空草地不应该有碰撞', () => {
      // 找到一个草地瓦片
      let grassX = -1, grassY = -1;
      for (let y = 0; y < map.height && grassX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.GRASS) {
            grassX = x;
            grassY = y;
            break;
          }
        }
      }
      
      if (grassX !== -1) {
        const collides = map.checkCollision(
          grassX * map.tileSize + 5,
          grassY * map.tileSize + 5,
          20, 20
        );
        expect(collides).toBe(false);
      }
    });

    test('水域应该有碰撞', () => {
      // 找到一个水域瓦片
      let waterX = -1, waterY = -1;
      for (let y = 0; y < map.height && waterX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.WATER) {
            waterX = x;
            waterY = y;
            break;
          }
        }
      }
      
      if (waterX !== -1) {
        const collides = map.checkCollision(
          waterX * map.tileSize,
          waterY * map.tileSize,
          32, 32
        );
        expect(collides).toBe(true);
      }
    });
  });

  describe('物体', () => {
    test('应该有树木', () => {
      const trees = map.objects.filter(obj => obj.type === 'tree');
      expect(trees.length).toBeGreaterThan(0);
    });

    test('应该有石头', () => {
      const rocks = map.objects.filter(obj => obj.type === 'rock');
      expect(rocks.length).toBeGreaterThan(0);
    });

    test('应该有花朵', () => {
      const flowers = map.objects.filter(obj => obj.type === 'flower');
      expect(flowers.length).toBeGreaterThan(0);
    });

    test('物体应该有正确的位置', () => {
      const tree = map.objects.find(obj => obj.type === 'tree');
      expect(tree.x).toBeDefined();
      expect(tree.y).toBeDefined();
      expect(tree.tileX).toBeDefined();
      expect(tree.tileY).toBeDefined();
    });

    test('可交互物体应该有 interactive 标记', () => {
      const tree = map.objects.find(obj => obj.type === 'tree');
      expect(tree.interactive).toBe(true);
    });
  });

  describe('getObjectsInView', () => {
    test('应该返回视窗内的物体', () => {
      const objects = map.getObjectsInView(0, 0, 200, 200);
      
      // 检查返回的物体都在视窗内
      objects.forEach(obj => {
        expect(obj.x).toBeLessThan(200);
        expect(obj.y).toBeLessThan(200);
      });
    });

    test('视窗外的物体不应该被返回', () => {
      const objects = map.getObjectsInView(1000, 1000, 200, 200);
      
      objects.forEach(obj => {
        expect(obj.x).toBeGreaterThanOrEqual(1000);
        expect(obj.y).toBeGreaterThanOrEqual(1000);
      });
    });
  });

  describe('interact', () => {
    test('与树木交互应该返回 shake 类型', () => {
      // 找到一个树木
      const tree = map.objects.find(obj => obj.type === 'tree');
      if (tree) {
        const result = map.interact(tree.x, tree.y);
        expect(result).not.toBeNull();
        expect(result.type).toBe('tree_shake');
      }
    });

    test('与石头交互应该返回 hit 类型', () => {
      // 找到一个石头
      const rock = map.objects.find(obj => obj.type === 'rock');
      if (rock) {
        const result = map.interact(rock.x, rock.y);
        expect(result).not.toBeNull();
        expect(result.type).toBe('rock_hit');
      }
    });

    test('没有物体的地方应该返回 null', () => {
      const result = map.interact(-1000, -1000);
      expect(result).toBeNull();
    });
  });

  describe('噪声生成', () => {
    test('simpleNoise 应该返回 0-1 之间的值', () => {
      const noise1 = map.simpleNoise(1, 1);
      const noise2 = map.simpleNoise(5, 5);
      
      expect(noise1).toBeGreaterThanOrEqual(0);
      expect(noise1).toBeLessThan(1);
      expect(noise2).toBeGreaterThanOrEqual(0);
      expect(noise2).toBeLessThan(1);
    });

    test('相同的输入应该产生相同的输出', () => {
      const noise1 = map.simpleNoise(3, 3);
      const noise2 = map.simpleNoise(3, 3);
      
      expect(noise1).toBe(noise2);
    });

    test('不同的输入应该产生不同的输出（大概率）', () => {
      const noise1 = map.simpleNoise(1, 1);
      const noise2 = map.simpleNoise(2, 2);
      
      // 不是绝对相等，但大概率不同
      expect(noise1 === noise2).toBe(false);
    });
  });
});
