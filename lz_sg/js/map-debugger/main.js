import { MapRenderer } from './MapRenderer.js';
import { MapState } from './MapState.js';
import { PathEditor } from './PathEditor.js';
import { PathValidator } from './PathValidator.js';

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

        // 创建路径验证器
        this.validator = new PathValidator(this.renderer.getGridSystem());

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
                    // 自动验证并更新验证面板
                    this.updateValidationPanel();
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
     * 使用 PathValidator 执行完整验证
     */
    validateMap() {
        console.log('验证地图...');

        const grids = this.state.getAllGrids();
        const result = this.validator.validate(grids);

        // 更新验证面板
        this.updateValidationPanelUI(result);

        // 绘制违规高亮
        this.renderer.drawViolations(result.violations);

        // 显示结果提示
        if (result.isValid) {
            alert('地图验证通过！');
        } else {
            alert(`验证失败：发现 ${result.violations.length} 个问题`);
        }
    }

    /**
     * 更新验证面板UI（自动验证时调用）
     */
    updateValidationPanel() {
        const grids = this.state.getAllGrids();
        const result = this.validator.validate(grids);

        this.updateValidationPanelUI(result);

        // 如果有违规，绘制高亮
        if (result.violations.length > 0) {
            this.renderer.drawViolations(result.violations);
        }
    }

    /**
     * 更新验证面板UI显示
     * @param {Object} result - 验证结果
     */
    updateValidationPanelUI(result) {
        const statusEl = document.getElementById('validation-status');
        const detailsEl = document.getElementById('validation-details');

        // 更新状态图标和文本
        if (result.isValid) {
            statusEl.innerHTML = `
                <span class="status-icon">✓</span>
                <span class="status-text">验证通过</span>
            `;
            statusEl.className = 'validation-status success';
        } else {
            statusEl.innerHTML = `
                <span class="status-icon">✗</span>
                <span class="status-text">验证失败 (${result.violations.length} 个问题)</span>
            `;
            statusEl.className = 'validation-status error';
        }

        // 更新详情面板
        let detailsHTML = '';

        // 显示折线统计
        detailsHTML += `
            <div class="zigzag-summary">
                <p style="color: var(--accent-blue); margin-bottom: 8px;">折线统计：</p>
                <div class="zigzag-item ${result.zigzagEdges.top ? 'has-zigzag' : 'no-zigzag'}">
                    上边：${result.zigzagEdges.top ? '✓ 有折线' : '✗ 无折线'}
                </div>
                <div class="zigzag-item ${result.zigzagEdges.right ? 'has-zigzag' : 'no-zigzag'}">
                    右边：${result.zigzagEdges.right ? '✓ 有折线' : '✗ 无折线'}
                </div>
                <div class="zigzag-item ${result.zigzagEdges.bottom ? 'has-zigzag' : 'no-zigzag'}">
                    下边：${result.zigzagEdges.bottom ? '✓ 有折线' : '✗ 无折线'}
                </div>
                <div class="zigzag-item ${result.zigzagEdges.left ? 'has-zigzag' : 'no-zigzag'}">
                    左边：${result.zigzagEdges.left ? '✓ 有折线' : '✗ 无折线'}
                </div>
            </div>
        `;

        // 显示违规列表
        if (result.violations.length > 0) {
            detailsHTML += '<div style="margin-top: 12px;"><p style="color: var(--accent-red); margin-bottom: 8px;">违规列表：</p>';
            result.violations.forEach(v => {
                detailsHTML += `<div class="violation-item ${v.type}">${v.message}</div>`;
            });
            detailsHTML += '</div>';
        }

        detailsEl.innerHTML = detailsHTML;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new MapDebugger();
});
