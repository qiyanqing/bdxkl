import { MapRenderer } from './MapRenderer.js';
import { MapState } from './MapState.js';
import { PathEditor } from './PathEditor.js';

/**
 * 主程序入口
 * 初始化地图调试工具
 */
class MapDebugger {
    constructor() {
        // 创建状态管理器
        this.state = new MapState();

        // 创建渲染器
        this.renderer = new MapRenderer('map-canvas');

        // 创建路径编辑器
        this.pathEditor = new PathEditor({
            canvas: this.renderer.canvas,
            state: this.state,
            gridSystem: this.renderer.getGridSystem(),
            renderer: this.renderer
        });

        // 初始化
        this.initTestData();
        this.initEventListeners();
        this.initStateObservers();
        this.updateUI();
    }

    /**
     * 初始化测试数据
     * 创建3个测试格子：起点(0,0) -> (1,0) -> (2,0)
     */
    initTestData() {
        const grid0 = this.state.addGrid({ x: 0, y: 0, type: 'start' });
        const grid1 = this.state.addGrid({ x: 1, y: 0, type: 'normal' });
        const grid2 = this.state.addGrid({ x: 2, y: 0, type: 'normal' });

        // 设置连接关系
        this.state.connectGrids(grid0.id, grid1.id);
        this.state.connectGrids(grid1.id, grid2.id);

        // 更新渲染器
        this.renderer.setGrids(this.state.getAllGrids());
    }

    /**
     * 初始化状态观察者
     * 监听状态变化并自动更新渲染器
     */
    initStateObservers() {
        // 监听格子添加
        this.state.subscribe((event, data) => {
            switch (event) {
                case 'grid:added':
                case 'grid:deleted':
                case 'grid:moved':
                case 'grid:connected':
                case 'grid:disconnected':
                    // 更新渲染器的格子数据
                    this.renderer.setGrids(this.state.getAllGrids());
                    break;
                case 'mode:changed':
                    // 更新模式按钮状态
                    this.updateModeButtons(data.newMode);
                    break;
                case 'grid:selected':
                    // 更新选中的格子
                    const grid = data.grid ? this.state.getGrid(data.grid.id) : null;
                    this.renderer.setSelectedGrid(grid);
                    break;
            }
        });
    }

    /**
     * 初始化事件监听器
     * 注意：鼠标和键盘事件已由 PathEditor 处理
     */
    initEventListeners() {
        // 模式切换按钮
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // 导出按钮（委托给 PathEditor）
        document.getElementById('btn-export').addEventListener('click', () => {
            this.pathEditor.exportJSON();
        });

        // 验证按钮
        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validateMap();
        });
    }

    /**
     * 设置编辑模式
     * @param {string} mode - 模式：add, select, delete
     */
    setMode(mode) {
        this.state.setEditMode(mode);
    }

    /**
     * 更新模式按钮状态
     * @param {string} activeMode - 当前激活的模式
     */
    updateModeButtons(activeMode) {
        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            if (btn.dataset.mode === activeMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
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

        // 初始化模式按钮状态
        this.updateModeButtons(this.state.editMode);
    }

    /**
     * 验证地图
     * TODO: 后续实现完整的验证逻辑
     */
    validateMap() {
        console.log('验证地图...');

        const grids = this.state.getAllGrids();
        let issues = [];

        // 检查是否有起点
        const hasStart = grids.some(g => g.type === 'start');
        if (!hasStart) {
            issues.push('缺少起点格子');
        }

        // 检查是否有孤立格子（没有前驱也没有后继，除了起点）
        grids.forEach(grid => {
            if (grid.type !== 'start') {
                const hasPrev = grids.some(g => g.next && g.next.id === grid.id);
                if (!hasPrev && !grid.next) {
                    issues.push(`格子 ${grid.id} 是孤立的`);
                }
            }
        });

        // 检查是否有循环
        const visited = new Set();
        let hasCycle = false;

        const startGrid = grids.find(g => g.type === 'start') || grids[0];
        if (startGrid) {
            let current = startGrid;
            while (current && !hasCycle) {
                if (visited.has(current.id)) {
                    hasCycle = true;
                    break;
                }
                visited.add(current.id);
                current = current.next;
            }
        }

        if (hasCycle) {
            issues.push('检测到循环路径');
        }

        // 更新验证状态
        const statusEl = document.getElementById('validation-status');
        if (issues.length === 0) {
            statusEl.innerHTML = `
                <span class="status-icon">✓</span>
                <span class="status-text">验证通过</span>
            `;
            alert('地图验证通过！');
        } else {
            statusEl.innerHTML = `
                <span class="status-icon">✗</span>
                <span class="status-text">验证失败 (${issues.length} 个问题)</span>
            `;
            alert('验证失败：\n' + issues.join('\n'));
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MapDebugger();
});
