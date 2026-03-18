# 🌲 小镇漫游 - Animal Crossing Style

一个动森风格的像素风小镇漫游 H5 游戏。

## ✨ 特性

- 🎮 **双端控制**：虚拟摇杆（移动端）+ WASD/方向键（键盘）
- 🗺️ **大型地图**：100x100 瓦片，自由漫游，视差滚动
- 🎨 **像素风格**：16x16 / 32x32 瓦片，程序生成地形
- ⚡ **Canvas 渲染**：高性能渲染，支持大量物体

## 🎮 游戏内容

### 控制系统
- **PC**: WASD 或方向键移动
- **手机**: 左下角虚拟摇杆拖动移动

### 世界特性
- 🌿 **程序生成地形**：草地、泥土、水域、沙滩
- 🌳 **可交互物体**：树木（会摇晃）、石头、花朵
- ⏰ **时间系统**：昼夜循环（影响天空颜色）
- 📍 **坐标显示**：实时显示玩家位置

### 视觉效果
- 视差滚动（多层背景）
- 行走动画（身体晃动、腿部交替）
- 水波纹效果
- 深度排序（物体按 Y 轴排序）

## 🚀 运行方式

直接在浏览器中打开 `index.html`：

```bash
# 使用本地服务器（推荐）
cd animal-crossing-town
python -m http.server 8080

# 然后在浏览器打开 http://localhost:8080
```

或使用 VS Code 的 Live Server 插件。

## 📁 项目结构

```
animal-crossing-town/
├── index.html           # 主页面
├── css/
│   └── style.css       # 样式（虚拟摇杆、UI）
├── js/
│   ├── game.js         # 游戏主类
│   ├── input.js        # 输入控制（键盘+摇杆）
│   ├── camera.js       # 相机系统（视差滚动）
│   ├── map.js          # 地图系统（瓦片+物体）
│   ├── player.js       # 玩家控制
│   └── renderer.js     # 渲染器
└── README.md
```

## 🛠️ 技术栈

- **Canvas API**：2D 渲染
- **纯原生 JS**：无外部依赖
- **响应式设计**：适配移动端和桌面端
- **Jest**：单元测试

## 🧪 测试

项目包含完整的单元测试覆盖：

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage
```

| 模块 | 测试文件 | 覆盖功能 |
|------|----------|----------|
| Player | `player.test.js` | 移动、碰撞、动画、边界限制 |
| Camera | `camera.test.js` | 跟随、视差滚动、坐标转换 |
| GameMap | `map.test.js` | 地图生成、碰撞检测、物体管理 |
| InputManager | `input.test.js` | 键盘输入、摇杆控制 |

### 测试结果

运行测试会生成详细的覆盖率报告，保存在 `coverage/` 目录下。打开 `coverage/lcov-report/index.html` 查看可视化报告。

![CI](https://github.com/wtu-sos/animal-crossing-town/workflows/Tests/badge.svg)

## 🔮 可扩展功能

- [ ] 物品收集系统
- [ ] 背包界面
- [ ] NPC 对话
- [ ] 建筑系统
- [ ] 存档功能
- [ ] 音效和背景音乐
- [ ] 天气系统
- [ ] 更多地形类型

## 📝 License

MIT
