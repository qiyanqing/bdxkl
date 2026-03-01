import { MapRenderer } from './MapRenderer.js';

/**
 * 主程序入口
 * 初始化地图调试工具
 */
class MapDebugger {
    constructor() {
        // 创建渲染器
        this.renderer = new MapRenderer('map-canvas');

        // 状态管理
        this.currentMode = 'add'; // 当前编辑模式：add, select, delete
        this.grids = [];          // 格子数组

        // 初始化
        this.initTestData();
        this.initEventListeners();
        this.updateUI();
    }

    /**
     * 初始化测试数据
     * 创建3个测试格子：起点(0,0) -> (1,0) -> (2,0)
     */
    initTestData() {
        this.grids = [
            { id: 0, x: 0, y: 0, type: 'start', next: null },
            { id: 1, x: 1, y: 0, type: 'normal', next: null },
            { id: 2, x: 2, y: 0, type: 'normal', next: null }
        ];

        // 设置连接关系
        this.grids[0].next = this.grids[1];
        this.grids[1].next = this.grids[2];

        // 更新渲染器
        this.renderer.setGrids(this.grids);
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 模式切换按钮
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // Canvas 鼠标事件
        const canvas = this.renderer.canvas;

        canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        canvas.addEventListener('click', (e) => {
            this.handleMouseClick(e);
        });

        // 操作按钮
        document.getElementById('btn-export').addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateMap();
        });
    }

    /**
     * 设置编辑模式
     * @param {string} mode - 模式：add, select, delete
     */
    setMode(mode) {
        this.currentMode = mode;

        // 更新按钮状态
        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 处理鼠标移动事件
     * @param {MouseEvent} e
     */
    handleMouseMove(e) {
        const rect = this.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 查找鼠标下的格子
        const grid = this.renderer.findGridAt(x, y);

        // 更新悬停状态
        this.renderer.setHoveredGrid(grid);

        // 更新格子详情面板
        this.updateGridInfo(grid);
    }

    /**
     * 处理鼠标点击事件
     * @param {MouseEvent} e
     */
    handleMouseClick(e) {
        const rect = this.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridSystem = this.renderer.getGridSystem();
        const grid = gridSystem.snapToGrid(x, y);

        switch (this.currentMode) {
            case 'add':
                this.addGrid(grid);
                break;
            case 'select':
                this.selectGrid(grid);
                break;
            case 'delete':
                this.deleteGrid(grid);
                break;
        }
    }

    /**
     * 添加格子
     * @param {Object} grid - 网格坐标 {x, y}
     */
    addGrid(grid) {
        // 检查是否已存在
        const exists = this.grids.find(g => g.x === grid.x && g.y === grid.y);
        if (exists) {
            console.log('格子已存在:', grid);
            return;
        }

        // 创建新格子
        const newGrid = {
            id: this.grids.length,
            x: grid.x,
            y: grid.y,
            type: 'normal',
            next: null
        };

        this.grids.push(newGrid);
        this.renderer.setGrids(this.grids);

        console.log('添加格子:', newGrid);
    }

    /**
     * 选择格子
     * @param {Object} grid - 网格坐标 {x, y}
     */
    selectGrid(grid) {
        const found = this.grids.find(g => g.x === grid.x && g.y === grid.y);
        if (found) {
            this.renderer.setSelectedGrid(found);
            console.log('选中格子:', found);
        } else {
            this.renderer.setSelectedGrid(null);
        }
    }

    /**
     * 删除格子
     * @param {Object} grid - 网格坐标 {x, y}
     */
    deleteGrid(grid) {
        const index = this.grids.findIndex(g => g.x === grid.x && g.y === grid.y);
        if (index !== -1) {
            const deleted = this.grids.splice(index, 1)[0];

            // 清除指向该格子的连接
            this.grids.forEach(g => {
                if (g.next === deleted) {
                    g.next = null;
                }
            });

            this.renderer.setGrids(this.grids);
            console.log('删除格子:', deleted);
        }
    }

    /**
     * 更新格子详情面板
     * @param {Object} grid - 格子对象
     */
    updateGridInfo(grid) {
        const gridInfo = document.getElementById('grid-info');

        if (!grid) {
            gridInfo.innerHTML = '<p>鼠标悬停格子查看详情</p>';
            return;
        }

        const info = `
            <p><span class="info-label">格子 ID:</span> <span class="info-value">${grid.id}</span></p>
            <p><span class="info-label">坐标:</span> <span class="info-value">(${grid.x}, ${grid.y})</span></p>
            <p><span class="info-label">类型:</span> <span class="info-value">${this.getTypeName(grid.type)}</span></p>
            <p><span class="info-label">下一个:</span> <span class="info-value">${grid.next ? `(${grid.next.x}, ${grid.next.y})` : '无'}</span></p>
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
            'normal': '普通',
            'battle': '战斗',
            'event': '事件',
            'shop': '商店',
            'rest': '休息'
        };
        return types[type] || type;
    }

    /**
     * 更新 UI 显示
     */
    updateUI() {
        // 更新验证状态
        const statusEl = document.getElementById('validation-status');
        statusEl.innerHTML = `
            <span class="status-icon">⏳</span>
            <span class="status-text">待验证</span>
        `;
    }

    /**
     * 导出 JSON
     */
    exportJSON() {
        // 简化导出数据（移除循环引用）
        const exportData = this.grids.map(g => ({
            id: g.id,
            x: g.x,
            y: g.y,
            type: g.type,
            nextId: g.next ? g.next.id : null
        }));

        const json = JSON.stringify(exportData, null, 2);
        console.log('导出 JSON:', json);

        // 可以添加下载功能
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'map-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 验证地图
     * TODO: 后续实现完整的验证逻辑
     */
    validateMap() {
        console.log('验证地图...');
        alert('验证功能待实现');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MapDebugger();
});
