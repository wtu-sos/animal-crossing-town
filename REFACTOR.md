# 代码重构说明

## 架构变更

### 新架构（MVC分层）

```
src/
├── models/           # 数据模型层（纯逻辑，无渲染）
│   ├── GameState.js      # 游戏状态管理
│   ├── Entity.js         # 实体基类
│   ├── PlayerModel.js    # 玩家模型
│   ├── NPCModel.js       # NPC模型
│   └── GameMap.js        # 地图数据
│
├── views/            # 视图层（渲染，无逻辑）
│   └── RenderService.js  # 统一渲染服务
│
├── controllers/      # 控制层（协调M和V）
│   ├── GameController.js # 主控制器
│   ├── InputController.js # 输入处理
│   └── Camera.js         # 相机控制
│
├── services/         # 业务服务层
│   └── GOAPService.js    # GOAP AI服务
│
└── utils/            # 工具函数
    └── helpers.js
```

### 旧架构

```
js/
├── game.js          # 混合了逻辑和渲染
├── player.js        # 混合了模型和UI
├── gameplay.js      # 过于庞大，职责不清
├── goap.js          # 逻辑+部分渲染
├── renderer.js      # 纯渲染（保留）
├── map.js           # 数据和渲染混合
├── input.js         # 输入（保留）
├── camera.js        # 相机（保留）
```

## 重构原则

### 1. 单一职责原则
- **Model**: 只关心数据状态和纯逻辑计算
- **View**: 只关心如何渲染，不修改数据
- **Controller**: 协调Model和View，处理输入

### 2. 依赖方向
```
Controller → Model
Controller → View
View → (只读取) Model
Model → (无依赖) 
```

### 3. 数据流
```
Input → Controller → Model (更新状态)
                    ↓
                  View (读取状态渲染)
```

## 迁移指南

### 旧代码 → 新代码

| 旧文件 | 新位置 | 说明 |
|--------|--------|------|
| `js/player.js` | `src/models/PlayerModel.js` | 移除DOM操作，纯逻辑 |
| `js/goap.js` | `src/services/GOAPService.js` | 移除渲染相关代码 |
| `js/game.js` | `src/controllers/GameController.js` | 拆分逻辑和渲染 |
| `js/gameplay.js` | 拆分到多个文件 | 按职责分离 |
| `js/renderer.js` | `src/views/RenderService.js` | 统一渲染接口 |
| `js/map.js` | `src/models/GameMap.js` | 移除绘制代码 |

## 单元测试改进

重构后的代码更容易测试：

```javascript
// 旧代码 - 难以测试（依赖DOM）
player.update(input, map); // 内部操作DOM

// 新代码 - 易于测试
player.update(inputState, mapModel, deltaTime); // 纯数据操作
renderService.drawEntity(player, camera, options); // 纯渲染
```

## 运行方式

开发环境使用新架构：
```html
<script type="module" src="src/main.js"></script>
```

生产构建会打包为单一文件。

## 回滚计划

如果重构出现问题，可以回滚到 `js/` 目录下的旧代码。
旧代码仍然保持功能完整。
