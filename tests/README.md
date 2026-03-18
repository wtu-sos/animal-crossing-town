# 🧪 单元测试

本项目使用 Jest 进行单元测试。

## 📋 测试覆盖范围

| 模块 | 测试文件 | 覆盖功能 |
|------|----------|----------|
| Player | `player.test.js` | 移动、碰撞、动画、边界限制 |
| Camera | `camera.test.js` | 跟随、视差滚动、坐标转换 |
| GameMap | `map.test.js` | 地图生成、碰撞检测、物体管理 |
| InputManager | `input.test.js` | 键盘输入、摇杆控制 |

## 🚀 运行测试

```bash
# 运行所有测试
npm test

# 监视模式（文件变化自动重跑）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 模式
npm run test:ci
```

## 📊 测试统计

运行 `npm run test:coverage` 后会生成覆盖率报告：

- **Statements**: 语句覆盖率
- **Branches**: 分支覆盖率
- **Functions**: 函数覆盖率
- **Lines**: 行覆盖率

报告保存在 `coverage/` 目录，可以打开 `coverage/lcov-report/index.html` 查看详细信息。

## 📝 添加新测试

1. 在 `tests/` 目录创建新的测试文件，命名规范：`*.test.js`
2. 使用 Jest 的 `describe` 和 `test` 函数组织测试
3. 使用 `expect` 进行断言

示例：

```javascript
describe('我的模块', () => {
  test('应该正确工作', () => {
    const result = myFunction();
    expect(result).toBe(expectedValue);
  });
});
```

## 🔧 常用断言

```javascript
expect(value).toBe(expected);           // 严格相等
expect(value).toEqual(expected);        // 深度相等
expect(value).toBeTruthy();             // 真值
expect(value).toBeFalsy();              // 假值
expect(value).toBeGreaterThan(10);      // 大于
expect(value).toBeLessThan(10);         // 小于
expect(array).toContain(item);          // 包含元素
expect(fn).toThrow();                   // 抛出异常
```

## 🎯 测试最佳实践

1. **独立性**: 每个测试应该独立运行，不依赖其他测试
2. **可重复性**: 测试结果应该可重复，不依赖外部环境
3. **快速**: 测试应该快速执行
4. **可读性**: 测试描述应该清晰说明测试目的

## 📁 文件结构

```
tests/
├── setup.js           # 测试环境设置
├── player.test.js     # Player 类测试
├── camera.test.js     # Camera 类测试
├── map.test.js        # GameMap 类测试
└── input.test.js      # InputManager 类测试
```
