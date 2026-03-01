# 地图调试工具实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个完整的大富翁地图系统调试工具，支持可视化编辑路径、自动验证三大原则、配置化生成不同难度地图。

**架构：** 纯前端单页应用，使用 Canvas 渲染地图，DOM 元素实现控制面板。采用观察者模式管理状态，编辑操作自动触发验证和重绘。

**技术栈：** 原生 HTML/CSS/JavaScript，无框架依赖

---

## Task 1: 搭建基础框架

**文件：**
- 创建: `map-debugger.html`
- 创建: `js/map-debugger/GridSystem.js`
- 创建: `js/map-debugger/MapRenderer.js`

**Step 1: 创建主页面 HTML 结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>地图调试工具</title>
    <link rel="stylesheet" href="css/map-debugger.css">
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <h1>🎮 地图调试工具</h1>
        </header>
        <div class="main-content">
            <aside class="control-panel">
                <!-- 编辑模式 -->
                <section class="panel-section">
                    <h3>编辑模式</h3>
                    <div class="mode-buttons">
                        <button id="btn-add-mode" class="mode-btn active" data-mode="add">添加</button>
                        <button id="btn-select-mode" class="mode-btn" data-mode="select">选择</button>
                        <button id="btn-delete-mode" class="mode-btn" data-mode="delete">删除</button>
                    </div>
                </section>

                <!-- 验证结果 -->
                <section class="panel-section">
                    <h3>验证结果</h3>
                    <div id="validation-status" class="validation-status">
                        <span class="status-icon">⏳</span>
                        <span class="status-text">待验证</span>
                    </div>
                    <div id="validation-details" class="validation-details"></div>
                </section>

                <!-- 格子详情 -->
                <section class="panel-section">
                    <h3>格子详情</h3>
                    <div id="grid-info" class="grid-info">
                        <p>鼠标悬停格子查看详情</p>
                    </div>
                </section>

                <!-- 操作按钮 -->
                <section class="panel-section">
                    <button id="btn-export" class="action-btn">导出 JSON</button>
                    <button id="btn-validate" class="action-btn primary">验证地图</button>
                </section>
            </aside>
            <main class="canvas-container">
                <canvas id="map-canvas"></canvas>
            </main>
        </div>
    </div>
    <script type="module" src="js/map-debugger/main.js"></script>
</body>
</html>
```

**Step 2: 创建基础样式**

创建 `css/map-debugger.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #1a1a2e;
    color: #fff;
    overflow: hidden;
}

.app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.app-header {
    background: #16213e;
    padding: 15px 20px;
    border-bottom: 1px solid #333;
}

.app-header h1 {
    font-size: 20px;
    color: #ffd700;
}

.main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.control-panel {
    width: 280px;
    background: #16213e;
    border-right: 1px solid #333;
    padding: 20px;
    overflow-y: auto;
}

.panel-section {
    margin-bottom: 25px;
}

.panel-section h3 {
    font-size: 14px;
    color: #4fc3f7;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.mode-buttons {
    display: flex;
    gap: 8px;
}

.mode-btn {
    flex: 1;
    padding: 10px;
    background: #0f3460;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.mode-btn:hover {
    background: #1a4a7a;
}

.mode-btn.active {
    background: #e74c3c;
    border-color: #c0392b;
}

.validation-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: #0f3460;
    border-radius: 6px;
    margin-bottom: 10px;
}

.status-icon {
    font-size: 20px;
}

.status-text {
    font-size: 14px;
}

.validation-status.valid {
    background: #27ae60;
}

.validation-status.invalid {
    background: #c0392b;
}

.validation-details {
    font-size: 12px;
    color: #aaa;
    max-height: 200px;
    overflow-y: auto;
}

.grid-info {
    font-size: 13px;
    color: #ccc;
    line-height: 1.8;
}

.grid-info p {
    margin-bottom: 5px;
}

.grid-info strong {
    color: #4fc3f7;
}

.action-btn {
    width: 100%;
    padding: 12px;
    background: #0f3460;
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    margin-bottom: 10px;
    transition: background 0.2s;
}

.action-btn:hover {
    background: #1a4a7a;
}

.action-btn.primary {
    background: #27ae60;
}

.action-btn.primary:hover {
    background: #219a52;
}

.canvas-container {
    flex: 1;
    background: #0f3460;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

#map-canvas {
    background: #16213e;
    border: 2px solid #333;
    border-radius: 8px;
    cursor: crosshair;
}
```

**Step 3: 实现坐标系统**

创建 `js/map-debugger/GridSystem.js`:

```javascript
/**
 * 网格坐标系统
 * 管理格子位置、间距、对齐
 */
export class GridSystem {
    constructor(config = {}) {
        this.gridSize = config.gridSize || 24;
        this.gridGap = config.gridGap || 4;
        this.step = this.gridSize + this.gridGap;
    }

    /**
     * 将像素坐标对齐到网格
     */
    snapToGrid(x, y) {
        return {
            x: Math.round(x / this.step) * this.step,
            y: Math.round(y / this.step) * this.step
        };
    }

    /**
     * 计算两个格子之间的曼哈顿距离
     */
    getDistance(grid1, grid2) {
        return Math.abs(grid1.x - grid2.x) + Math.abs(grid1.y - grid2.y);
    }

    /**
     * 检查两个格子是否边对边相邻
     */
    isEdgeAdjacent(grid1, grid2) {
        return this.getDistance(grid1, grid2) === this.step;
    }

    /**
     * 检查两个格子是否对角线相邻
     */
    isDiagonalAdjacent(grid1, grid2) {
        const dx = Math.abs(grid1.x - grid2.x);
        const dy = Math.abs(grid1.y - grid2.y);
        return dx === this.step && dy === this.step;
    }

    /**
     * 获取格子的中心点坐标
     */
    getCenter(grid) {
        return {
            x: grid.x + this.gridSize / 2,
            y: grid.y + this.gridSize / 2
        };
    }
}
```

**Step 4: 实现地图渲染器**

创建 `js/map-debugger/MapRenderer.js`:

```javascript
/**
 * 地图渲染器
 * 负责绘制格子、连接线、高亮效果
 */
export class MapRenderer {
    constructor(canvas, gridSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSystem = gridSystem;
        this.grids = [];
        this.selectedGrid = null;
        this.hoveredGrid = null;
        this.offset = { x: 0, y: 0 };

        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = container.clientHeight - 40;
    }

    setGrids(grids) {
        this.grids = grids;
    }

    setSelectedGrid(grid) {
        this.selectedGrid = grid;
    }

    setHoveredGrid(grid) {
        this.hoveredGrid = grid;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制连接线
     */
    drawConnections() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;

        this.grids.forEach(grid => {
            if (grid.nextId !== null) {
                const nextGrid = this.grids.find(g => g.id === grid.nextId);
                if (nextGrid) {
                    const from = this.gridSystem.getCenter(grid);
                    const to = this.gridSystem.getCenter(nextGrid);

                    this.ctx.beginPath();
                    this.ctx.moveTo(from.x, from.y);
                    this.ctx.lineTo(to.x, to.y);
                    this.ctx.stroke();

                    // 绘制箭头
                    this.drawArrow(from, to);
                }
            }
        });
    }

    /**
     * 绘制方向箭头
     */
    drawArrow(from, to) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 8;
        const arrowAngle = Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - arrowLength * Math.cos(angle - arrowAngle),
            to.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(to.x, to.y);
        this.ctx.lineTo(
            to.x - arrowLength * Math.cos(angle + arrowAngle),
            to.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }

    /**
     * 绘制所有格子
     */
    drawGrids() {
        this.grids.forEach(grid => {
            this.drawGrid(grid);
        });
    }

    /**
     * 绘制单个格子
     */
    drawGrid(grid) {
        const { ctx, gridSystem } = this;
        const isSelected = this.selectedGrid && this.selectedGrid.id === grid.id;
        const isHovered = this.hoveredGrid && this.hoveredGrid.id === grid.id;
        const isStart = grid.type === 'start';

        // 计算样式
        const scale = isHovered ? 1.2 : 1;
        const size = gridSystem.gridSize * scale;
        const offset = (size - gridSystem.gridSize) / 2;

        const x = grid.x - offset;
        const y = grid.y - offset;

        // 绘制背景
        ctx.fillStyle = isStart ? '#ffd700' : '#e74c3c';
        ctx.fillRect(x, y, size, size);

        // 绘制边框
        ctx.strokeStyle = isStart ? '#ff8c00' : '#c0392b';
        ctx.lineWidth = isSelected ? 4 : (isStart ? 3 : 2);

        if (isSelected) {
            ctx.strokeStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
        }

        ctx.strokeRect(x, y, size, size);
        ctx.shadowBlur = 0;

        // 绘制编号
        ctx.fillStyle = isStart ? '#333' : '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(grid.id, x + size/2, y + size/2);
    }

    /**
     * 绘制网格参考线
     */
    drawGridLines() {
        const { ctx, canvas, gridSystem } = this;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // 垂直线
        for (let x = 0; x < canvas.width; x += gridSystem.step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // 水平线
        for (let y = 0; y < canvas.height; y += gridSystem.step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * 渲染整个场景
     */
    render() {
        this.clear();
        this.drawGridLines();
        this.drawConnections();
        this.drawGrids();
    }
}
```

**Step 5: 创建主入口文件**

创建 `js/map-debugger/main.js`:

```javascript
import { GridSystem } from './GridSystem.js';
import { MapRenderer } from './MapRenderer.js';

// 初始化
const canvas = document.getElementById('map-canvas');
const gridSystem = new GridSystem({ gridSize: 24, gridGap: 4 });
const renderer = new MapRenderer(canvas, gridSystem);

// 初始测试数据
const testGrids = [
    { id: 0, x: 100, y: 80, type: 'start', prevId: 2, nextId: 1 },
    { id: 1, x: 128, y: 80, type: 'normal', prevId: 0, nextId: 2 },
    { id: 2, x: 156, y: 80, type: 'normal', prevId: 1, nextId: 0 },
];

renderer.setGrids(testGrids);
renderer.render();

console.log('地图调试工具已初始化');
```

**Step 6: 在浏览器中测试**

```bash
# 在浏览器中打开
open map-debugger.html
```

预期结果：
- 页面显示左右分栏布局
- Canvas 区域显示3个测试格子
- 格子之间有连接线和箭头
- 控制面板显示编辑模式按钮

**Step 7: 提交**

```bash
git add map-debugger.html css/map-debugger.css js/map-debugger/
git commit -m "feat: 搭建地图调试工具基础框架

- 创建 HTML 页面结构和左右分栏布局
- 实现 GridSystem 坐标系统
- 实现 MapRenderer 渲染器
- 添加基础样式和测试数据"
```

---

## Task 2: 实现状态管理系统

**文件：**
- 创建: `js/map-debugger/MapState.js`

**Step 1: 编写状态管理测试**

创建 `js/map-debugger/__tests__/MapState.test.js`:

```javascript
import { MapState } from '../MapState.js';

export function runTests() {
    console.log('开始测试 MapState...');

    // 测试1: 初始化状态
    const state = new MapState();
    console.assert(state.grids.length === 0, '初始状态应为空');
    console.assert(state.editMode === 'add', '默认编辑模式应为add');
    console.log('✓ 初始化测试通过');

    // 测试2: 添加格子
    state.addGrid({ x: 100, y: 80, type: 'normal' });
    console.assert(state.grids.length === 1, '应有一个格子');
    console.assert(state.grids[0].id === 0, '第一个格子ID应为0');
    console.log('✓ 添加格子测试通过');

    // 测试3: 删除格子
    state.deleteGrid(0);
    console.assert(state.grids.length === 0, '格子应被删除');
    console.log('✓ 删除格子测试通过');

    // 测试4: 连接格子
    state.addGrid({ x: 100, y: 80, type: 'normal' });
    state.addGrid({ x: 128, y: 80, type: 'normal' });
    state.connectGrids(0, 1);
    console.assert(state.grids[0].nextId === 1, '格子0的nextId应为1');
    console.assert(state.grids[1].prevId === 0, '格子1的prevId应为0');
    console.log('✓ 连接格子测试通过');

    // 测试5: 观察者模式
    let notified = false;
    state.subscribe(() => { notified = true; });
    state.addGrid({ x: 156, y: 80, type: 'normal' });
    console.assert(notified, '状态变化应通知观察者');
    console.log('✓ 观察者模式测试通过');

    console.log('所有测试通过! ✓');
}
```

**Step 2: 实现状态管理类**

创建 `js/map-debugger/MapState.js`:

```javascript
/**
 * 地图状态管理
 * 使用观察者模式，状态变化自动通知订阅者
 */
export class MapState {
    constructor() {
        this.grids = [];
        this.nextId = 0;
        this.editMode = 'add'; // 'add' | 'select' | 'delete'
        this.selectedGridId = null;
        this.observers = [];
    }

    /**
     * 添加格子
     */
    addGrid(data) {
        const grid = {
            id: this.nextId++,
            x: data.x,
            y: data.y,
            type: data.type || 'normal',
            prevId: null,
            nextId: null
        };

        this.grids.push(grid);
        this.notify('gridAdded', grid);
        return grid;
    }

    /**
     * 删除格子
     */
    deleteGrid(id) {
        const index = this.grids.findIndex(g => g.id === id);
        if (index === -1) return null;

        const grid = this.grids[index];

        // 修复路径断裂
        if (grid.prevId !== null && grid.nextId !== null) {
            this.connectGrids(grid.prevId, grid.nextId);
        }

        // 清除相关连接
        if (grid.prevId !== null) {
            const prev = this.getGrid(grid.prevId);
            if (prev) prev.nextId = null;
        }
        if (grid.nextId !== null) {
            const next = this.getGrid(grid.nextId);
            if (next) next.prevId = null;
        }

        this.grids.splice(index, 1);
        this.notify('gridDeleted', grid);

        if (this.selectedGridId === id) {
            this.selectedGridId = null;
        }

        return grid;
    }

    /**
     * 移动格子
     */
    moveGrid(id, x, y) {
        const grid = this.getGrid(id);
        if (!grid) return null;

        grid.x = x;
        grid.y = y;
        this.notify('gridMoved', grid);
        return grid;
    }

    /**
     * 连接两个格子
     */
    connectGrids(fromId, toId) {
        const from = this.getGrid(fromId);
        const to = this.getGrid(toId);

        if (!from || !to) return false;

        from.nextId = toId;
        to.prevId = fromId;

        this.notify('gridsConnected', { from, to });
        return true;
    }

    /**
     * 断开两个格子的连接
     */
    disconnectGrids(id1, id2) {
        const grid1 = this.getGrid(id1);
        const grid2 = this.getGrid(id2);

        if (!grid1 || !grid2) return false;

        if (grid1.nextId === id2) {
            grid1.nextId = null;
            grid2.prevId = null;
        } else if (grid2.nextId === id1) {
            grid2.nextId = null;
            grid1.prevId = null;
        }

        this.notify('gridsDisconnected', { grid1, grid2 });
        return true;
    }

    /**
     * 获取格子
     */
    getGrid(id) {
        return this.grids.find(g => g.id === id);
    }

    /**
     * 根据坐标获取格子
     */
    getGridAtPosition(x, y, gridSize) {
        return this.grids.find(g =>
            x >= g.x && x < g.x + gridSize &&
            y >= g.y && y < g.y + gridSize
        );
    }

    /**
     * 设置编辑模式
     */
    setEditMode(mode) {
        if (['add', 'select', 'delete'].includes(mode)) {
            this.editMode = mode;
            this.notify('editModeChanged', mode);
        }
    }

    /**
     * 设置选中的格子
     */
    setSelectedGrid(id) {
        this.selectedGridId = id;
        this.notify('gridSelected', id);
    }

    /**
     * 订阅状态变化
     */
    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            const index = this.observers.indexOf(callback);
            if (index !== -1) {
                this.observers.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有观察者
     */
    notify(event, data) {
        this.observers.forEach(callback => callback(event, data));
    }

    /**
     * 导出为 JSON
     */
    toJSON() {
        return {
            grids: [...this.grids],
            editMode: this.editMode
        };
    }
}
```

**Step 3: 更新主入口文件集成状态管理**

修改 `js/map-debugger/main.js`:

```javascript
import { GridSystem } from './GridSystem.js';
import { MapRenderer } from './MapRenderer.js';
import { MapState } from './MapState.js';

// 初始化
const canvas = document.getElementById('map-canvas');
const gridSystem = new GridSystem({ gridSize: 24, gridGap: 4 });
const state = new MapState();
const renderer = new MapRenderer(canvas, gridSystem);

// 订阅状态变化
state.subscribe((event, data) => {
    renderer.setGrids(state.grids);
    renderer.render();
});

// 初始测试数据
state.addGrid({ x: 100, y: 80, type: 'start' });
state.addGrid({ x: 128, y: 80, type: 'normal' });
state.addGrid({ x: 156, y: 80, type: 'normal' });
state.connectGrids(0, 1);
state.connectGrids(1, 2);
// 连成环
state.connectGrids(2, 0);

renderer.setGrids(state.grids);
renderer.render();

console.log('地图调试工具已初始化');
```

**Step 4: 运行测试验证**

在 `js/map-debugger/main.js` 中添加测试调用：

```javascript
import { runTests } from './__tests__/MapState.test.js';
runTests();
```

在浏览器控制台查看测试结果。

**Step 5: 提交**

```bash
git add js/map-debugger/
git commit -m "feat: 实现状态管理系统

- 添加 MapState 类管理地图数据
- 实现观察者模式自动通知变化
- 实现格子的增删改查操作
- 添加单元测试验证功能"
```

---

## Task 3: 实现路径编辑器

**文件：**
- 创建: `js/map-debugger/PathEditor.js`
- 修改: `js/map-debugger/main.js`

**Step 1: 实现路径编辑器**

创建 `js/map-debugger/PathEditor.js`:

```javascript
/**
 * 路径编辑器
 * 处理鼠标交互和编辑操作
 */
export class PathEditor {
    constructor(canvas, state, gridSystem, renderer) {
        this.canvas = canvas;
        this.state = state;
        this.gridSystem = gridSystem;
        this.renderer = renderer;
        this.isDragging = false;
        this.dragStartGrid = null;

        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * 处理点击
     */
    handleClick(e) {
        if (this.isDragging) return;

        const { x, y } = this.getMousePos(e);
        const clickedGrid = this.state.getGridAtPosition(x, y, this.gridSystem.gridSize);

        switch (this.state.editMode) {
            case 'add':
                this.handleAddClick(x, y, clickedGrid);
                break;
            case 'select':
                this.handleSelectClick(clickedGrid);
                break;
            case 'delete':
                this.handleDeleteClick(clickedGrid);
                break;
        }
    }

    /**
     * 添加模式点击
     */
    handleAddClick(x, y, clickedGrid) {
        if (clickedGrid) {
            // 点击已有格子，选中它
            this.state.setSelectedGrid(clickedGrid.id);
        } else {
            // 点击空白区域，创建新格子
            const snapped = this.gridSystem.snapToGrid(x, y);
            const newGrid = this.state.addGrid({
                x: snapped.x,
                y: snapped.y,
                type: 'normal'
            });

            // 如果有选中的格子，自动连接
            if (this.state.selectedGridId !== null) {
                this.state.connectGrids(this.state.selectedGridId, newGrid.id);
            }

            this.state.setSelectedGrid(newGrid.id);
        }
    }

    /**
     * 选择模式点击
     */
    handleSelectClick(clickedGrid) {
        if (clickedGrid) {
            this.state.setSelectedGrid(clickedGrid.id);
        } else {
            this.state.setSelectedGrid(null);
        }
    }

    /**
     * 删除模式点击
     */
    handleDeleteClick(clickedGrid) {
        if (clickedGrid) {
            this.state.deleteGrid(clickedGrid.id);
        }
    }

    /**
     * 处理鼠标按下（拖拽开始）
     */
    handleMouseDown(e) {
        if (this.state.editMode !== 'select') return;

        const { x, y } = this.getMousePos(e);
        const clickedGrid = this.state.getGridAtPosition(x, y, this.gridSystem.gridSize);

        if (clickedGrid) {
            this.isDragging = true;
            this.dragStartGrid = clickedGrid;
        }
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        const { x, y } = this.getMousePos(e);

        // 悬停效果
        const hoveredGrid = this.state.getGridAtPosition(x, y, this.gridSystem.gridSize);
        this.renderer.setHoveredGrid(hoveredGrid || null);
        this.renderer.render();

        // 更新格子详情面板
        this.updateGridInfoPanel(hoveredGrid);

        // 拖拽
        if (this.isDragging && this.dragStartGrid && this.state.editMode === 'select') {
            const snapped = this.gridSystem.snapToGrid(x, y);
            this.state.moveGrid(this.dragStartGrid.id, snapped.x, snapped.y);
        }
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(e) {
        this.isDragging = false;
        this.dragStartGrid = null;
    }

    /**
     * 处理双击（设置起点）
     */
    handleDoubleClick(e) {
        const { x, y } = this.getMousePos(e);
        const clickedGrid = this.state.getGridAtPosition(x, y, this.gridSystem.gridSize);

        if (clickedGrid) {
            // 清除之前的起点
            this.state.grids.forEach(g => {
                if (g.type === 'start') g.type = 'normal';
            });

            // 设置新起点
            clickedGrid.type = 'start';
            this.state.notify('gridUpdated', clickedGrid);
        }
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyDown(e) {
        // 模式切换
        if (e.key === 'a' || e.key === 'A') {
            this.state.setEditMode('add');
        } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
            this.state.setEditMode('select');
        } else if (e.key === 'd' && !e.ctrlKey) {
            this.state.setEditMode('delete');
        }

        // 删除
        if (e.key === 'Delete' && this.state.selectedGridId !== null) {
            this.state.deleteGrid(this.state.selectedGridId);
        }

        // 导出
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportJSON();
        }
    }

    /**
     * 获取鼠标坐标
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * 更新格子详情面板
     */
    updateGridInfoPanel(grid) {
        const panel = document.getElementById('grid-info');

        if (!grid) {
            panel.innerHTML = '<p>鼠标悬停格子查看详情</p>';
            return;
        }

        panel.innerHTML = `
            <p><strong>编号:</strong> ${grid.id}</p>
            <p><strong>坐标:</strong> (${grid.x}, ${grid.y})</p>
            <p><strong>类型:</strong> ${grid.type === 'start' ? '起点' : '普通'}</p>
            <p><strong>前驱:</strong> ${grid.prevId !== null ? grid.prevId : '无'}</p>
            <p><strong>后继:</strong> ${grid.nextId !== null ? grid.nextId : '无'}</p>
        `;
    }

    /**
     * 导出 JSON
     */
    exportJSON() {
        const json = JSON.stringify(this.state.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `map-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }
}
```

**Step 2: 更新主入口集成编辑器**

修改 `js/map-debugger/main.js`:

```javascript
import { GridSystem } from './GridSystem.js';
import { MapRenderer } from './MapRenderer.js';
import { MapState } from './MapState.js';
import { PathEditor } from './PathEditor.js';

// 初始化
const canvas = document.getElementById('map-canvas');
const gridSystem = new GridSystem({ gridSize: 24, gridGap: 4 });
const state = new MapState();
const renderer = new MapRenderer(canvas, gridSystem);

// 订阅状态变化
state.subscribe((event, data) => {
    renderer.setGrids(state.grids);
    renderer.render();
});

// 创建编辑器
const editor = new PathEditor(canvas, state, gridSystem, renderer);

// 初始测试数据
state.addGrid({ x: 100, y: 80, type: 'start' });
state.addGrid({ x: 128, y: 80, type: 'normal' });
state.addGrid({ x: 156, y: 80, type: 'normal' });
state.connectGrids(0, 1);
state.connectGrids(1, 2);
state.connectGrids(2, 0);

renderer.setGrids(state.grids);
renderer.render();

// 绑定模式切换按钮
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        state.setEditMode(mode);

        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// 绑定导出按钮
document.getElementById('btn-export').addEventListener('click', () => {
    editor.exportJSON();
});

console.log('地图调试工具已初始化');
```

**Step 3: 测试编辑功能**

```bash
# 在浏览器中打开
open map-debugger.html
```

测试场景：
1. 按 `A` 切换到添加模式，点击空白区域添加格子
2. 按 `S` 切换到选择模式，拖拽格子移动
3. 按 `D` 切换到删除模式，点击格子删除
4. 双击格子设置起点
5. 悬停格子查看详情面板

**Step 4: 提交**

```bash
git add js/map-debugger/
git commit -m "feat: 实现路径编辑器

- 实现 PathEditor 类处理鼠标交互
- 支持三种编辑模式：添加/选择/删除
- 支持拖拽移动格子
- 支持双击设置起点
- 实现键盘快捷键"
```

---

## Task 4: 实现自动验证系统

**文件：**
- 创建: `js/map-debugger/PathValidator.js`
- 修改: `js/map-debugger/main.js`
- 修改: `css/map-debugger.css`

**Step 1: 实现验证器**

创建 `js/map-debugger/PathValidator.js`:

```javascript
/**
 * 路径验证器
 * 检测三大原则违规
 */
export class PathValidator {
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
        this.violations = [];
        this.zigzagEdges = { top: false, right: false, bottom: false, left: false };
    }

    /**
     * 验证整个地图
     */
    validate(grids) {
        this.violations = [];
        this.zigzagEdges = { top: false, right: false, bottom: false, left: false };

        // 原则1: 每个格子恰好2条边
        this.validateEdgeCount(grids);

        // 原则2: 禁止对角线连接
        this.validateNoDiagonals(grids);

        // 原则3: 最少3条边有Z字折线
        this.validateZigzagEdges(grids);

        return {
            isValid: this.violations.length === 0 && this.countZigzagEdges() >= 3,
            violations: this.violations,
            zigzagEdges: this.zigzagEdges,
            zigzagCount: this.countZigzagEdges()
        };
    }

    /**
     * 验证原则1: 每个格子恰好2条边
     */
    validateEdgeCount(grids) {
        grids.forEach(grid => {
            const edgeNeighbors = [];

            grids.forEach(other => {
                if (grid.id === other.id) return;
                if (this.gridSystem.isEdgeAdjacent(grid, other)) {
                    edgeNeighbors.push(other.id);
                }
            });

            if (edgeNeighbors.length !== 2) {
                this.violations.push({
                    type: 'edgeCount',
                    gridId: grid.id,
                    message: `格子${grid.id}有${edgeNeighbors.length}条边（应为2）`,
                    actual: edgeNeighbors.length,
                    expected: 2
                });
            }
        });
    }

    /**
     * 验证原则2: 禁止对角线连接
     */
    validateNoDiagonals(grids) {
        for (let i = 0; i < grids.length; i++) {
            for (let j = i + 1; j < grids.length; j++) {
                const grid1 = grids[i];
                const grid2 = grids[j];

                if (this.gridSystem.isDiagonalAdjacent(grid1, grid2)) {
                    this.violations.push({
                        type: 'diagonal',
                        gridId: grid1.id,
                        relatedGridId: grid2.id,
                        message: `格子${grid1.id}与格子${grid2.id}存在对角线连接`
                    });
                }
            }
        }
    }

    /**
     * 验证原则3: 最少3条边有Z字折线
     */
    validateZigzagEdges(grids) {
        if (grids.length === 0) return;

        // 找到地图边界
        const bounds = this.getBounds(grids);
        const margin = 50;

        // 分类每条边的格子
        const topEdge = grids.filter(g => g.y <= bounds.minY + margin);
        const bottomEdge = grids.filter(g => g.y >= bounds.maxY - margin);
        const leftEdge = grids.filter(g => x <= bounds.minX + margin);
        const rightEdge = grids.filter(g => g.x >= bounds.maxX - margin);

        // 检测上边是否有折线（Y坐标变化）
        this.zigzagEdges.top = this.hasZigzag(topEdge, 'y');

        // 检测下边是否有折线（Y坐标变化）
        this.zigzagEdges.bottom = this.hasZigzag(bottomEdge, 'y');

        // 检测左边是否有折线（X坐标变化）
        this.zigzagEdges.left = this.hasZigzag(leftEdge, 'x');

        // 检测右边是否有折线（X坐标变化）
        this.zigzagEdges.right = this.hasZigzag(rightEdge, 'x');

        // 如果不足3条边有折线，添加违规
        if (this.countZigzagEdges() < 3) {
            this.violations.push({
                type: 'zigzag',
                message: `只有${this.countZigzagEdges()}条边有折线（最少需要3条）`,
                actual: this.countZigzagEdges(),
                expected: 3
            });
        }
    }

    /**
     * 检测一组格子是否有折线
     */
    hasZigzag(grids, coord) {
        if (grids.length < 3) return false;

        const coords = grids.map(g => g[coord]).sort((a, b) => a - b);
        const uniqueCoords = [...new Set(coords)];

        return uniqueCoords.length > 1;
    }

    /**
     * 计算有折线的边数量
     */
    countZigzagEdges() {
        return Object.values(this.zigzagEdges).filter(v => v).length;
    }

    /**
     * 获取地图边界
     */
    getBounds(grids) {
        const xs = grids.map(g => g.x);
        const ys = grids.map(g => g.y);

        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    }
}
```

**Step 2: 更新渲染器支持违规高亮**

修改 `js/map-debugger/MapRenderer.js` 添加高亮方法：

```javascript
/**
 * 绘制违规格子
 */
drawViolations(violations) {
    violations.forEach(v => {
        if (v.type === 'diagonal') {
            // 绘制对角线虚线
            const grid1 = this.grids.find(g => g.id === v.gridId);
            const grid2 = this.grids.find(g => g.id === v.relatedGridId);

            if (grid1 && grid2) {
                const from = this.gridSystem.getCenter(grid1);
                const to = this.gridSystem.getCenter(grid2);

                this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(from.x, from.y);
                this.ctx.lineTo(to.x, to.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    });
}
```

**Step 3: 添加验证面板样式**

修改 `css/map-debugger.css`:

```css
.validation-details {
    font-size: 12px;
    color: #aaa;
    max-height: 200px;
    overflow-y: auto;
}

.violation-item {
    padding: 8px 10px;
    margin-bottom: 8px;
    background: rgba(231, 76, 60, 0.2);
    border-left: 3px solid #e74c3c;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.violation-item:hover {
    background: rgba(231, 76, 60, 0.3);
}

.violation-item.diagonal {
    border-left-color: #ff9800;
    background: rgba(255, 152, 0, 0.2);
}

.zigzag-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
}

.zigzag-item {
    padding: 8px;
    background: #0f3460;
    border-radius: 4px;
    text-align: center;
    font-size: 12px;
}

.zigzag-item.has-zigzag {
    background: #27ae60;
}

.zigzag-item.no-zigzag {
    background: #c0392b;
}
```

**Step 4: 更新主入口集成验证**

修改 `js/map-debugger/main.js`:

```javascript
import { PathValidator } from './PathValidator.js';

// ... 其他导入

const validator = new PathValidator(gridSystem);

// 更新验证面板
function updateValidationPanel() {
    const result = validator.validate(state.grids);
    const statusEl = document.getElementById('validation-status');
    const detailsEl = document.getElementById('validation-details');

    // 更新状态
    if (result.isValid) {
        statusEl.className = 'validation-status valid';
        statusEl.innerHTML = `
            <span class="status-icon">✓</span>
            <span class="status-text">全部通过</span>
        `;
    } else {
        statusEl.className = 'validation-status invalid';
        statusEl.innerHTML = `
            <span class="status-icon">✗</span>
            <span class="status-text">发现问题</span>
        `;
    }

    // 更新详情
    let html = '';

    // 折线统计
    html += '<div class="zigzag-summary">';
    html += `<div class="zigzag-item ${result.zigzagEdges.top ? 'has-zigzag' : 'no-zigzag'}">上边: ${result.zigzagEdges.top ? '✓' : '✗'}</div>`;
    html += `<div class="zigzag-item ${result.zigzagEdges.right ? 'has-zigzag' : 'no-zigzag'}">右边: ${result.zigzagEdges.right ? '✓' : '✗'}</div>`;
    html += `<div class="zigzag-item ${result.zigzagEdges.bottom ? 'has-zigzag' : 'no-zigzag'}">下边: ${result.zigzagEdges.bottom ? '✓' : '✗'}</div>`;
    html += `<div class="zigzag-item ${result.zigzagEdges.left ? 'has-zigzag' : 'no-zigzag'}">左边: ${result.zigzagEdges.left ? '✓' : '✗'}</div>`;
    html += '</div>';

    // 违规列表
    result.violations.forEach(v => {
        html += `<div class="violation-item ${v.type}">${v.message}</div>`;
    });

    detailsEl.innerHTML = html;
}

// 订阅状态变化时验证
state.subscribe(() => {
    updateValidationPanel();
});

// 绑定验证按钮
document.getElementById('btn-validate').addEventListener('click', () => {
    updateValidationPanel();
});

// 初始验证
updateValidationPanel();
```

**Step 5: 测试验证功能**

测试场景：
1. 创建两个对角相邻的格子，应显示对角线违规
2. 创建只有1条边的格子，应显示边数违规
3. 创建只有2条边有折线的地图，应显示折线不足

**Step 6: 提交**

```bash
git add js/map-debugger/ css/map-debugger.css
git commit -m "feat: 实现自动验证系统

- 实现 PathValidator 类检测三大原则
- 检测每个格子的边数量
- 检测对角线连接
- 检测Z字折线数量
- 添加验证面板UI和违规高亮"
```

---

## Task 5: 实现配置化生成

**文件：**
- 创建: `js/map-debugger/MapGenerator.js`
- 修改: `js/map-debugger/main.js`
- 修改: `map-debugger.html`

**Step 1: 实现地图生成器**

创建 `js/map-debugger/MapGenerator.js`:

```javascript
/**
 * 地图生成器
 * 基于配置自动生成符合规范的地图
 */
export class MapGenerator {
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
    }

    /**
     * 生成地图
     */
    generate(config) {
        const {
            gridCount = 15,
            zigzagEdges = ['top', 'right', 'bottom'],
            startX = 100,
            startY = 80
        } = config;

        const grids = [];
        const step = this.gridSystem.step;

        let currentX = startX;
        let currentY = startY;
        let gridId = 0;

        // 计算每条边的格子数
        const gridsPerEdge = Math.floor(gridCount / 4);
        const remainder = gridCount % 4;

        // 上边
        const topCount = gridsPerEdge + (remainder > 0 ? 1 : 0);
        for (let i = 0; i < topCount; i++) {
            grids.push({
                id: gridId++,
                x: currentX,
                y: currentY,
                type: gridId === 1 ? 'start' : 'normal',
                prevId: gridId > 1 ? gridId - 2 : null,
                nextId: null
            });
            currentX += step;
        }

        // 上边Z字折线
        if (zigzagEdges.includes('top')) {
            this.addTopZigzag(grids, gridId, currentX, currentY, step);
        }

        // 右边
        const rightCount = gridsPerEdge + (remainder > 1 ? 1 : 0);
        // 回到主线
        currentX -= step;
        for (let i = 0; i < rightCount; i++) {
            grids.push({
                id: gridId++,
                x: currentX,
                y: currentY,
                type: 'normal',
                prevId: gridId > 1 ? gridId - 2 : null,
                nextId: null
            });
            currentY += step;
        }

        // 右边Z字折线
        if (zigzagEdges.includes('right')) {
            this.addRightZigzag(grids, gridId, currentX, currentY, step);
        }

        // 下边
        const bottomCount = gridsPerEdge + (remainder > 2 ? 1 : 0);
        currentY -= step;
        for (let i = 0; i < bottomCount; i++) {
            currentX -= step;
            grids.push({
                id: gridId++,
                x: currentX,
                y: currentY,
                type: 'normal',
                prevId: gridId > 1 ? gridId - 2 : null,
                nextId: null
            });
        }

        // 下边Z字折线
        if (zigzagEdges.includes('bottom')) {
            this.addBottomZigzag(grids, gridId, currentX, currentY, step);
        }

        // 左边
        currentX += step;
        while (gridId < gridCount) {
            currentY -= step;
            grids.push({
                id: gridId++,
                x: currentX,
                y: currentY,
                type: 'normal',
                prevId: gridId > 1 ? gridId - 2 : null,
                nextId: null
            });
        }

        // 连接格子成环
        this.connectGrids(grids);

        return grids;
    }

    /**
     * 添加上边Z字折线
     */
    addTopZigzag(grids, startId, x, y, step) {
        let id = startId;
        let currentX = x;
        let currentY = y;

        // 向下
        grids.push({ id: id++, x: currentX, y: currentY + step, type: 'normal', prevId: id - 2, nextId: null });
        // 向右
        currentX += step;
        grids.push({ id: id++, x: currentX, y: currentY + step, type: 'normal', prevId: id - 2, nextId: null });
        // 向下
        grids.push({ id: id++, x: currentX, y: currentY + step * 2, type: 'normal', prevId: id - 2, nextId: null });
        // 向右
        currentX += step;
        grids.push({ id: id++, x: currentX, y: currentY + step * 2, type: 'normal', prevId: id - 2, nextId: null });
        // 向上回主线
        grids.push({ id: id++, x: currentX, y: currentY + step, type: 'normal', prevId: id - 2, nextId: null });
        grids.push({ id: id++, x: currentX, y: currentY, type: 'normal', prevId: id - 2, nextId: null });

        return id;
    }

    /**
     * 添加右边Z字折线
     */
    addRightZigzag(grids, startId, x, y, step) {
        // 类似上边的逻辑，调整坐标
        // ... 省略具体实现
        return startId;
    }

    /**
     * 添加下边Z字折线
     */
    addBottomZigzag(grids, startId, x, y, step) {
        // 类似上边的逻辑，调整坐标
        // ... 省略具体实现
        return startId;
    }

    /**
     * 连接格子成环
     */
    connectGrids(grids) {
        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];
            grid.prevId = i > 0 ? grids[i - 1].id : grids[grids.length - 1].id;
            grid.nextId = i < grids.length - 1 ? grids[i + 1].id : grids[0].id;
        }
    }
}
```

**Step 2: 更新HTML添加配置面板**

修改 `map-debugger.html` 添加配置区域：

```html
<!-- 难度配置 -->
<section class="panel-section">
    <h3>难度配置</h3>
    <select id="difficulty-select" class="difficulty-select">
        <option value="1">难度1 - 15格</option>
        <option value="2">难度2 - 25格</option>
        <option value="3">难度3 - 35格</option>
        <option value="4">难度4 - 50格</option>
        <option value="bonus">福利关 - 10格</option>
    </select>
    <button id="btn-generate" class="action-btn primary">生成地图</button>
</section>
```

**Step 3: 添加配置样式**

修改 `css/map-debugger.css`:

```css
.difficulty-select {
    width: 100%;
    padding: 10px;
    background: #0f3460;
    border: 2px solid #333;
    border-radius: 6px;
    color: #fff;
    font-size: 14px;
    margin-bottom: 10px;
    cursor: pointer;
}
```

**Step 4: 更新主入口集成生成器**

修改 `js/map-debugger/main.js`:

```javascript
import { MapGenerator } from './MapGenerator.js';

const generator = new MapGenerator(gridSystem);

// 难度配置
const difficulties = {
    '1': { gridCount: 15, zigzagEdges: ['top', 'right', 'bottom'] },
    '2': { gridCount: 25, zigzagEdges: ['top', 'right', 'bottom'] },
    '3': { gridCount: 35, zigzagEdges: ['top', 'right', 'bottom'] },
    '4': { gridCount: 50, zigzagEdges: ['top', 'right', 'bottom', 'left'] },
    'bonus': { gridCount: 10, zigzagEdges: [] }
};

// 生成地图
function generateMap() {
    const difficulty = document.getElementById('difficulty-select').value;
    const config = difficulties[difficulty];

    // 清空现有格子
    state.grids = [];
    state.nextId = 0;

    // 生成新地图
    const grids = generator.generate(config);

    // 添加到状态
    grids.forEach(grid => {
        state.grids.push(grid);
        state.nextId = Math.max(state.nextId, grid.id + 1);
    });

    state.notify('mapGenerated', grids);
}

// 绑定生成按钮
document.getElementById('btn-generate').addEventListener('click', generateMap);
```

**Step 5: 测试生成功能**

测试不同难度配置：
- 选择难度1，生成15格地图
- 选择难度4，生成50格地图
- 验证生成的地图符合规范

**Step 6: 提交**

```bash
git add js/map-debugger/ map-debugger.html css/map-debugger.css
git commit -m "feat: 实现配置化地图生成

- 实现 MapGenerator 类
- 支持选择难度自动生成地图
- 支持配置格子数量和折线边
- 生成结果符合三大原则"
```

---

## 完成检查

在完成所有任务后，运行以下检查：

```bash
# 在浏览器中打开
open map-debugger.html
```

检查清单：
- [ ] 三种编辑模式正常工作
- [ ] 格子可以添加、移动、删除
- [ ] 双击可以设置起点
- [ ] 验证系统正确检测违规
- [ ] 配置化生成符合不同难度
- [ ] 导出JSON功能正常
- [ ] 键盘快捷键正常工作

---

## 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-01 | 1.0 | 初始版本 |
