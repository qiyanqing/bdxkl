import { GridSystem } from './GridSystem.js';

/**
 * 地图渲染器类
 * 负责在 Canvas 上绘制地图、格子、连接线等
 */
export class MapRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 坐标系统
        this.gridSystem = new GridSystem(80); // 格子大小 80px

        // 数据
        this.grids = [];           // 所有格子数组
        this.selectedGrid = null;  // 当前选中的格子
        this.hoveredGrid = null;   // 当前悬停的格子

        // 颜色配置
        this.colors = {
            background: '#1a1a2e',
            gridLines: '#2a2a4e',
            normalGrid: '#ff4757',      // 普通格子：红色
            startGrid: '#ffd700',       // 起点格子：金色
            selectedGrid: '#00ff88',    // 选中格子：绿色
            hoveredGrid: '#00d9ff',     // 悬停格子：蓝色
            connection: 'rgba(255, 255, 255, 0.3)', // 连接线：白色半透明
            text: '#ffffff'
        };

        // 初始化画布大小
        this.resizeCanvas();

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * 调整画布大小以适应容器
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // 设置画布的实际像素大小
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // 重新渲染
        this.render();
    }

    /**
     * 设置格子数组
     * @param {Array} grids - 格子数组
     */
    setGrids(grids) {
        this.grids = grids;
        this.render();
    }

    /**
     * 设置选中的格子
     * @param {Object} grid - 格子对象 {x, y, type, next}
     */
    setSelectedGrid(grid) {
        this.selectedGrid = grid;
        this.render();
    }

    /**
     * 设置悬停的格子
     * @param {Object} grid - 格子对象 {x, y, type, next}
     */
    setHoveredGrid(grid) {
        this.hoveredGrid = grid;
        this.render();
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制连接线和箭头
     */
    drawConnections() {
        this.grids.forEach(grid => {
            if (grid.next) {
                const fromCenter = this.gridSystem.getCenter(grid);
                const toCenter = this.gridSystem.getCenter(grid.next);

                // 绘制连接线
                this.ctx.beginPath();
                this.ctx.moveTo(fromCenter.x, fromCenter.y);
                this.ctx.lineTo(toCenter.x, toCenter.y);
                this.ctx.strokeStyle = this.colors.connection;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                // 绘制箭头
                this.drawArrow(fromCenter, toCenter);
            }
        });
    }

    /**
     * 绘制方向箭头
     * @param {Object} from - 起点坐标 {x, y}
     * @param {Object} to - 终点坐标 {x, y}
     */
    drawArrow(from, to) {
        const arrowSize = 10;
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        // 计算箭头位置（在线段终点前一点）
        const arrowX = to.x - Math.cos(angle) * 30;
        const arrowY = to.y - Math.sin(angle) * 30;

        // 绘制箭头
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.strokeStyle = this.colors.connection;
        this.ctx.lineWidth = 2;
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
     * @param {Object} grid - 格子对象 {x, y, type, next}
     */
    drawGrid(grid) {
        const { x, y, type } = grid;
        const size = this.gridSystem.gridSize;
        const pixel = this.gridSystem.gridToPixel(grid);

        // 确定格子颜色
        let color = this.colors.normalGrid;
        if (type === 'start') {
            color = this.colors.startGrid;
        }

        // 优先显示悬停或选中状态
        if (this.selectedGrid && this.selectedGrid.x === x && this.selectedGrid.y === y) {
            color = this.colors.selectedGrid;
        } else if (this.hoveredGrid && this.hoveredGrid.x === x && this.hoveredGrid.y === y) {
            color = this.colors.hoveredGrid;
        }

        // 绘制格子背景
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        // 绘制格子边框
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(pixel.x + 2, pixel.y + 2, size - 4, size - 4);

        // 绘制格子编号
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            grid.id || '',
            pixel.x + size / 2,
            pixel.y + size / 2
        );
    }

    /**
     * 绘制网格参考线
     */
    drawGridLines() {
        const size = this.gridSystem.gridSize;
        this.ctx.strokeStyle = this.colors.gridLines;
        this.ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = 0; x < this.canvas.width; x += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y < this.canvas.height; y += size) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 渲染整个场景
     */
    render() {
        // 清空画布
        this.clear();

        // 绘制网格参考线
        this.drawGridLines();

        // 绘制连接线
        this.drawConnections();

        // 绘制所有格子
        this.drawGrids();
    }

    /**
     * 根据像素坐标查找格子
     * @param {number} pixelX - 像素 X 坐标
     * @param {number} pixelY - 像素 Y 坐标
     * @returns {Object|null} 找到的格子对象或 null
     */
    findGridAt(pixelX, pixelY) {
        const grid = this.gridSystem.snapToGrid(pixelX, pixelY);
        return this.grids.find(g => g.x === grid.x && g.y === grid.y) || null;
    }

    /**
     * 获取坐标系统实例
     * @returns {GridSystem}
     */
    getGridSystem() {
        return this.gridSystem;
    }
}
