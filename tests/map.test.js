/**
 * GameMap 类单元测试 - 适配重构后的固定小镇地图
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

    test('应该有正确的地图尺寸 (80x80)', () => {
      expect(map.width).toBe(80);
      expect(map.height).toBe(80);
    });

    test('像素尺寸应该正确计算', () => {
      expect(map.pixelWidth).toBe(2560); // 80 * 32
      expect(map.pixelHeight).toBe(2560);
    });

    test('应该生成瓦片数据', () => {
      expect(map.tiles).toHaveLength(80);
      expect(map.tiles[0]).toHaveLength(80);
    });

    test('应该生成可交互对象', () => {
      expect(map.interactiveObjects.length).toBeGreaterThan(0);
    });
  });

  describe('瓦片类型', () => {
    test('应该定义所有瓦片类型', () => {
      expect(map.TILE_TYPES.GRASS).toBe(0);
      expect(map.TILE_TYPES.ROAD).toBe(1);
      expect(map.TILE_TYPES.ROAD_SIDEWALK).toBe(2);
      expect(map.TILE_TYPES.WATER).toBe(3);
      expect(map.TILE_TYPES.SAND).toBe(4);
      expect(map.TILE_TYPES.BUILDING_HOUSE).toBe(5);
      expect(map.TILE_TYPES.BUILDING_SHOP).toBe(6);
      expect(map.TILE_TYPES.BUILDING_INN).toBe(7);
      expect(map.TILE_TYPES.BUILDING_TOWNHALL).toBe(8);
      expect(map.TILE_TYPES.PARK).toBe(9);
      expect(map.TILE_TYPES.FENCE).toBe(10);
      expect(map.TILE_TYPES.BRIDGE).toBe(11);
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
    test('草地不应该有碰撞', () => {
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

    test('建筑应该有碰撞', () => {
      // 找到一个建筑瓦片
      let buildingX = -1, buildingY = -1;
      for (let y = 0; y < map.height && buildingX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.BUILDING_HOUSE ||
              map.tiles[y][x] === map.TILE_TYPES.BUILDING_SHOP) {
            buildingX = x;
            buildingY = y;
            break;
          }
        }
      }
      
      if (buildingX !== -1) {
        const collides = map.checkCollision(
          buildingX * map.tileSize,
          buildingY * map.tileSize,
          32, 32
        );
        expect(collides).toBe(true);
      }
    });
  });

  describe('建筑', () => {
    test('应该定义所有建筑', () => {
      expect(map.BUILDINGS.playerHouse).toBeDefined();
      expect(map.BUILDINGS.npc1House).toBeDefined();
      expect(map.BUILDINGS.restaurant).toBeDefined();
      expect(map.BUILDINGS.townHall).toBeDefined();
    });

    test('getBuildingPosition 应该返回正确的位置', () => {
      const pos = map.getBuildingPosition('playerHouse');
      expect(pos).toBeDefined();
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    });

    test('getBuildingPosition 应该处理不存在的建筑', () => {
      const pos = map.getBuildingPosition('nonexistent');
      expect(pos).toBeNull();
    });
  });

  describe('可交互对象', () => {
    test('应该有建筑入口', () => {
      const buildings = map.interactiveObjects.filter(obj => obj.type === 'building');
      expect(buildings.length).toBeGreaterThan(0);
    });

    test('可交互对象应该有正确的属性', () => {
      const obj = map.interactiveObjects[0];
      expect(obj.x).toBeDefined();
      expect(obj.y).toBeDefined();
      expect(obj.type).toBeDefined();
      expect(obj.interactive).toBe(true);
    });
  });

  describe('装饰物', () => {
    test('应该有装饰物', () => {
      // 新版地图有装饰物
      expect(map.objects).toBeDefined();
    });

    test('物体应该有正确的位置', () => {
      if (map.objects.length > 0) {
        const obj = map.objects[0];
        expect(obj.x).toBeDefined();
        expect(obj.y).toBeDefined();
        expect(obj.type).toBeDefined();
      }
    });
  });

  describe('getObjectsInView', () => {
    test('应该返回视窗内的物体', () => {
      const objects = map.getObjectsInView(0, 0, 200, 200);
      
      // 检查返回的物体都在视窗内
      objects.forEach(obj => {
        expect(obj.x).toBeLessThan(200 + map.tileSize);
        expect(obj.y).toBeLessThan(200 + map.tileSize);
      });
    });
  });

  describe('道路系统', () => {
    test('应该有道路瓦片', () => {
      let hasRoad = false;
      for (let y = 0; y < map.height && !hasRoad; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.ROAD) {
            hasRoad = true;
            break;
          }
        }
      }
      expect(hasRoad).toBe(true);
    });

    test('道路不应该有碰撞', () => {
      let roadX = -1, roadY = -1;
      for (let y = 0; y < map.height && roadX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.ROAD) {
            roadX = x;
            roadY = y;
            break;
          }
        }
      }
      
      if (roadX !== -1) {
        const collides = map.checkCollision(
          roadX * map.tileSize,
          roadY * map.tileSize,
          32, 32
        );
        expect(collides).toBe(false);
      }
    });
  });

  describe('A*寻路系统', () => {
    test('应该生成可行走网格', () => {
      expect(map.walkableGrid).toBeDefined();
      expect(map.walkableGrid.length).toBe(80);
      expect(map.walkableGrid[0].length).toBe(80);
    });

    test('可行走网格应该正确标记可行走区域', () => {
      // 找到道路位置，应该是可行走的
      let roadX = -1, roadY = -1;
      for (let y = 0; y < map.height && roadX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.ROAD) {
            roadX = x;
            roadY = y;
            break;
          }
        }
      }
      
      if (roadX !== -1) {
        expect(map.walkableGrid[roadY][roadX]).toBe(1);
      }
    });

    test('可行走网格应该正确标记不可行走区域', () => {
      // 找到建筑位置，应该是不可行走的
      let buildingX = -1, buildingY = -1;
      for (let y = 0; y < map.height && buildingX === -1; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.tiles[y][x] === map.TILE_TYPES.BUILDING_HOUSE ||
              map.tiles[y][x] === map.TILE_TYPES.BUILDING_SHOP) {
            buildingX = x;
            buildingY = y;
            break;
          }
        }
      }
      
      if (buildingX !== -1) {
        expect(map.walkableGrid[buildingY][buildingX]).toBe(0);
      }
    });

    test('findPath应该能找到从家到工作的路径', () => {
      const startPos = map.getBuildingPosition('playerHouse');
      const endPos = map.getBuildingPosition('flowerShop');
      
      const path = map.findPath(startPos.x, startPos.y, endPos.x, endPos.y);
      
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(0);
      expect(path[path.length - 1].x).toBeCloseTo(endPos.x, -1);
      expect(path[path.length - 1].y).toBeCloseTo(endPos.y, -1);
    });

    test('findPath路径不应该穿过障碍物', () => {
      const startPos = map.getBuildingPosition('playerHouse');
      const endPos = map.getBuildingPosition('flowerShop');
      
      const path = map.findPath(startPos.x, startPos.y, endPos.x, endPos.y);
      
      // 检查路径上的每个点都是可行走的
      for (const point of path) {
        const tileX = Math.floor(point.x / map.tileSize);
        const tileY = Math.floor(point.y / map.tileSize);
        if (tileX >= 0 && tileX < map.width && tileY >= 0 && tileY < map.height) {
          expect(map.walkableGrid[tileY][tileX]).toBe(1);
        }
      }
    });

    test('findPath应该处理起点被阻挡的情况', () => {
      // 找一个建筑内部的点作为起点
      const building = map.BUILDINGS['playerHouse'];
      const blockedStartX = (building.x + 1) * map.tileSize;
      const blockedStartY = (building.y + 1) * map.tileSize;
      const endPos = map.getBuildingPosition('flowerShop');
      
      const path = map.findPath(blockedStartX, blockedStartY, endPos.x, endPos.y);
      
      // 应该能找到路径（自动找到最近的可用点）
      expect(path).not.toBeNull();
    });

    test('findPath应该处理终点被阻挡的情况', () => {
      const startPos = map.getBuildingPosition('playerHouse');
      
      // 找一个建筑内部的点作为终点
      const building = map.BUILDINGS['flowerShop'];
      const blockedEndX = (building.x + 1) * map.tileSize;
      const blockedEndY = (building.y + 1) * map.tileSize;
      
      const path = map.findPath(startPos.x, startPos.y, blockedEndX, blockedEndY);
      
      // 应该能找到路径（自动找到最近的可用点）
      expect(path).not.toBeNull();
    });

    test('findPath应该返回平滑的路径', () => {
      const startPos = map.getBuildingPosition('playerHouse');
      const endPos = map.getBuildingPosition('dock');
      
      const path = map.findPath(startPos.x, startPos.y, endPos.x, endPos.y);
      
      // 路径应该是连续的（相邻点之间的距离应该相近）
      for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i-1].x;
        const dy = path[i].y - path[i-1].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        // 相邻点之间的距离应该在合理范围内（不超过一个瓦片对角线）
        expect(dist).toBeLessThanOrEqual(map.tileSize * 1.5);
      }
    });

    test('heuristic应该计算正确的曼哈顿距离', () => {
      const h1 = map.heuristic(0, 0, 10, 10);
      expect(h1).toBe(20);
      
      const h2 = map.heuristic(5, 5, 5, 5);
      expect(h2).toBe(0);
      
      const h3 = map.heuristic(0, 0, 0, 15);
      expect(h3).toBe(15);
    });

    test('getNeighbors应该返回正确的邻居节点', () => {
      const neighbors = map.getNeighbors(10, 10);
      
      // 应该返回8个方向（如果都可行走）
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors.length).toBeLessThanOrEqual(8);
      
      // 检查邻居的坐标
      for (const neighbor of neighbors) {
        const dx = Math.abs(neighbor.x - 10);
        const dy = Math.abs(neighbor.y - 10);
        expect(dx).toBeLessThanOrEqual(1);
        expect(dy).toBeLessThanOrEqual(1);
      }
    });

    test('findNearestWalkable应该找到最近的可用点', () => {
      // 找一个建筑内部的点
      const building = map.BUILDINGS['playerHouse'];
      const blockedX = building.x + 1;
      const blockedY = building.y + 1;
      
      const nearest = map.findNearestWalkable(blockedX, blockedY);
      
      expect(nearest).not.toBeNull();
      expect(map.walkableGrid[nearest.y][nearest.x]).toBe(1);
    });
  });
});
