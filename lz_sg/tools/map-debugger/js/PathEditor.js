import { GRID_TYPES } from './MapGenerator.js';
import { ContextMenu } from './ContextMenu.js';

/**
 * 路径编辑器类
 * 处理地图的鼠标交互、键盘快捷键和编辑操作
 */
export class PathEditor {
    /**
     * 构造函数
     * @param {Object} dependencies - 依赖对象 {canvas, state, gridSystem, renderer}
     */
    constructor({ canvas, state, gridSystem, renderer }) {
        this.canvas = canvas;
        this.state = state;
        this.gridSystem = gridSystem;
        this.renderer = renderer;

        // 鼠标按下状态（用于区分点击和长按拖拽）
        this.mouseDownTime = 0;
        this.mouseDownPos = { x: 0, y: 0 };
        this.dragThreshold = 200; // 长按阈值（毫秒）
        this.dragDistanceThreshold = 5; // 移动阈值（像素）

        // 拖拽状态
        this.isDragging = false;
        this.dragStartGrid = null;
        this.dragStartPos = null;

        // 右键菜单
        this.contextMenu = new ContextMenu({
            onSelect: (gridType) => {
                if (this.targetGrid) {
                    // 更新格子类型
                    this.targetGrid.type = gridType;
                    this.state.notify('gridUpdated', this.targetGrid);
                    console.log('格子类型已更新:', gridType);
                }
            }
        });
        this.targetGrid = null;

        // 绑定事件
        this.bindEvents();
    }

    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * 处理点击事件（左键单击选中格子）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleClick(e) {
        // 如果正在拖拽，不处理点击
        if (this.isDragging) {
            return;
        }

        // 检测是否是快速点击（时间差小于阈值且移动距离小于阈值）
        const timeDiff = Date.now() - this.mouseDownTime;
        const { x, y } = this.getMousePos(e);
        const distance = Math.sqrt(
            Math.pow(x - this.mouseDownPos.x, 2) +
            Math.pow(y - this.mouseDownPos.y, 2)
        );

        // 如果时间超过阈值或移动距离超过阈值，认为是拖拽，不处理点击
        if (timeDiff > this.dragThreshold || distance > this.dragDistanceThreshold) {
            return;
        }

        // 左键单击：选中格子
        const clickedGrid = this.renderer.findGridAt(x, y);

        if (clickedGrid) {
            // 清除之前的选中状态，选中当前格子
            this.state.setSelectedGrid(clickedGrid.id);
            console.log('选中格子:', clickedGrid);
        } else {
            // 点击空白区，清除选中状态
            this.state.setSelectedGrid(null);
        }
    }

    /**
     * 自动连接新格子到最近的格子
     * @param {Object} newGrid - 新添加的格子
     */
    autoConnectToNearest(newGrid) {
        const allGrids = this.state.getAllGrids();
        if (allGrids.length <= 1) {
            return;
        }

        // 找到最近的格子（不包括新格子本身）
        let nearest = null;
        let minDistance = Infinity;

        allGrids.forEach(grid => {
            if (grid.id === newGrid.id) {
                return;
            }
            const distance = this.gridSystem.getDistance(newGrid, grid);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = grid;
            }
        });

        // 如果最近的格子相邻且没有后继，连接它
        if (nearest && this.gridSystem.isEdgeAdjacent(newGrid, nearest) && !nearest.next) {
            this.state.connectGrids(nearest.id, newGrid.id);
            console.log(`自动连接: ${nearest.id} -> ${newGrid.id}`);
        }
    }

    /**
     * 处理鼠标按下事件（记录按下时间和位置）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseDown(e) {
        // 只处理左键
        if (e.button !== 0) {
            return;
        }

        const { x, y } = this.getMousePos(e);
        const clickedGrid = this.renderer.findGridAt(x, y);

        // 记录按下时间和位置（用于区分点击和长按拖拽）
        this.mouseDownTime = Date.now();
        this.mouseDownPos = { x, y };

        // 如果点击了格子，准备拖拽
        if (clickedGrid) {
            this.dragStartGrid = clickedGrid;
            this.dragStartPos = { x, y };
        }
    }

    /**
     * 处理鼠标移动事件（检测拖拽、悬停效果）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseMove(e) {
        const { x, y } = this.getMousePos(e);

        // 检测是否进入拖拽模式（时间超过阈值且移动距离超过阈值）
        if (this.dragStartGrid && !this.isDragging) {
            const timeDiff = Date.now() - this.mouseDownTime;
            const distance = Math.sqrt(
                Math.pow(x - this.mouseDownPos.x, 2) +
                Math.pow(y - this.mouseDownPos.y, 2)
            );

            if (timeDiff > this.dragThreshold && distance > this.dragDistanceThreshold) {
                // 进入拖拽模式
                this.isDragging = true;
                console.log('开始拖拽格子:', this.dragStartGrid);
            }
        }

        // 处理拖拽
        if (this.isDragging && this.dragStartGrid) {
            const gridPos = this.gridSystem.snapToGrid(x, y);

            // 检查是否移动了位置
            if (gridPos.x !== this.dragStartGrid.x || gridPos.y !== this.dragStartGrid.y) {
                const moved = this.state.moveGrid(this.dragStartGrid.id, gridPos.x, gridPos.y);

                if (moved) {
                    this.dragStartGrid.x = gridPos.x;
                    this.dragStartGrid.y = gridPos.y;
                }
            }
            return;
        }

        // 处理悬停效果
        const hoveredGrid = this.renderer.findGridAt(x, y);
        this.renderer.setHoveredGrid(hoveredGrid);

        // 更新详情面板
        this.updateGridInfoPanel(hoveredGrid);
    }

    /**
     * 处理鼠标释放事件（结束拖拽）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.dragStartGrid = null;
            this.dragStartPos = null;
            console.log('结束拖拽');
        }
    }

    /**
     * 处理双击事件（设置起点）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleDoubleClick(e) {
        const { x, y } = this.getMousePos(e);
        const clickedGrid = this.renderer.findGridAt(x, y);

        if (!clickedGrid) {
            return;
        }

        // 清除之前的起点
        const allGrids = this.state.getAllGrids();
        allGrids.forEach(grid => {
            if (grid.type === 'start') {
                grid.type = GRID_TYPES.EMPTY;
            }
        });

        // 设置新起点
        clickedGrid.type = 'start';
        console.log('设置起点:', clickedGrid);

        // 更新渲染器
        this.renderer.setGrids(allGrids);
    }

    /**
     * 处理右键菜单事件（区分格子和空白区）
     * @param {MouseEvent} e - 鼠标事件
     */
    handleContextMenu(e) {
        e.preventDefault();

        const { x, y } = this.getMousePos(e);
        const gridPos = this.gridSystem.snapToGrid(x, y);
        const clickedGrid = this.renderer.findGridAt(x, y);

        // 获取页面坐标（用于定位菜单）
        const pageX = e.pageX;
        const pageY = e.pageY;

        if (clickedGrid) {
            // 右键点击格子：显示属性菜单
            this.targetGrid = clickedGrid;
            this.contextMenu.show(pageX, pageY, clickedGrid);
        } else {
            // 右键点击空白区：添加空白格
            const newGrid = this.state.addGrid({
                x: gridPos.x,
                y: gridPos.y,
                type: GRID_TYPES.EMPTY
            });

            if (newGrid) {
                console.log('添加空白格:', newGrid);
                // 自动连接到最近的格子
                this.autoConnectToNearest(newGrid);
            } else {
                console.log('该位置已有格子，无法添加');
            }
        }
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        // 忽略在输入框中的按键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                // 删除选中的格子
                e.preventDefault();
                this.deleteSelectedGrid();
                break;

            default:
                // 处理组合键
                if (e.ctrlKey || e.metaKey) {
                    if (e.key.toLowerCase() === 's') {
                        // 导出 JSON
                        e.preventDefault();
                        this.exportJSON();
                    }
                }
                break;
        }
    }

    /**
     * 删除选中的格子（将格子类型设为空白）
     */
    deleteSelectedGrid() {
        const selectedId = this.state.selectedGridId;
        if (selectedId === null) {
            return;
        }

        const grid = this.state.getGrid(selectedId);
        if (grid) {
            grid.type = GRID_TYPES.EMPTY;
            this.state.notify('gridUpdated', grid);
            console.log('删除格子（设为空白）:', grid);
        }
    }

    /**
     * 获取鼠标在 Canvas 中的坐标
     * @param {MouseEvent} e - 鼠标事件
     * @returns {Object} 坐标 {x, y}
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
     * @param {Object} grid - 格子对象
     */
    updateGridInfoPanel(grid) {
        const gridInfo = document.getElementById('grid-info');

        if (!grid) {
            gridInfo.innerHTML = '<p>鼠标悬停格子查看详情</p>';
            return;
        }

        const typeName = this.getTypeName(grid.type);
        const nextInfo = grid.next ? `(${grid.next.x}, ${grid.next.y})` : '无';

        const info = `
            <p><span class="info-label">格子 ID:</span> <span class="info-value">${grid.id}</span></p>
            <p><span class="info-label">坐标:</span> <span class="info-value">(${grid.x}, ${grid.y})</span></p>
            <p><span class="info-label">类型:</span> <span class="info-value">${typeName}</span></p>
            <p><span class="info-label">下一个:</span> <span class="info-value">${nextInfo}</span></p>
        `;

        gridInfo.innerHTML = info;
    }

    /**
     * 获取类型名称
     * @param {string} type - 类型
     * @returns {string} 类型名称
     */
    getTypeName(type) {
        const types = {
            'start': '起点',
            'empty': '空白',
            'battle': '战斗',
            'elite': '精英',
            'shop': '商店',
            'buff': 'Buff',
            'event': '事件',
            'rest': '休息',
            'dice': '骰子',
            'reward': '奖励'
        };
        return types[type] || type;
    }

    /**
     * 导出地图数据为 JSON 文件
     */
    exportJSON() {
        const json = this.state.toJSON();
        console.log('导出 JSON:', json);

        // 创建下载链接
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}
