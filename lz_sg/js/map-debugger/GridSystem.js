/**
 * 坐标系统类
 * 提供网格坐标计算和距离测量功能
 */
export class GridSystem {
    constructor(gridSize = 80) {
        this.gridSize = gridSize; // 格子大小（像素）
    }

    /**
     * 将像素坐标对齐到网格
     * @param {number} x - 像素 X 坐标
     * @param {number} y - 像素 Y 坐标
     * @returns {Object} 网格坐标 {x, y}
     */
    snapToGrid(x, y) {
        const gridX = Math.round(x / this.gridSize);
        const gridY = Math.round(y / this.gridSize);
        return { x: gridX, y: gridY };
    }

    /**
     * 计算两个格子之间的曼哈顿距离
     * @param {Object} grid1 - 第一个格子 {x, y}
     * @param {Object} grid2 - 第二个格子 {x, y}
     * @returns {number} 曼哈顿距离
     */
    getDistance(grid1, grid2) {
        return Math.abs(grid1.x - grid2.x) + Math.abs(grid1.y - grid2.y);
    }

    /**
     * 检查两个格子是否边对边相邻
     * @param {Object} grid1 - 第一个格子 {x, y}
     * @param {Object} grid2 - 第二个格子 {x, y}
     * @returns {boolean} 是否边对边相邻
     */
    isEdgeAdjacent(grid1, grid2) {
        const dx = Math.abs(grid1.x - grid2.x);
        const dy = Math.abs(grid1.y - grid2.y);

        // 边对边相邻：一个方向距离为1，另一个方向距离为0
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    /**
     * 检查两个格子是否对角线相邻
     * @param {Object} grid1 - 第一个格子 {x, y}
     * @param {Object} grid2 - 第二个格子 {x, y}
     * @returns {boolean} 是否对角线相邻
     */
    isDiagonalAdjacent(grid1, grid2) {
        const dx = Math.abs(grid1.x - grid2.x);
        const dy = Math.abs(grid1.y - grid2.y);

        // 对角线相邻：两个方向距离都为1
        return dx === 1 && dy === 1;
    }

    /**
     * 获取格子中心点的像素坐标
     * @param {Object} grid - 网格坐标 {x, y}
     * @returns {Object} 中心点像素坐标 {x, y}
     */
    getCenter(grid) {
        return {
            x: grid.x * this.gridSize + this.gridSize / 2,
            y: grid.y * this.gridSize + this.gridSize / 2
        };
    }

    /**
     * 将网格坐标转换为像素坐标
     * @param {Object} grid - 网格坐标 {x, y}
     * @returns {Object} 像素坐标 {x, y}
     */
    gridToPixel(grid) {
        return {
            x: grid.x * this.gridSize,
            y: grid.y * this.gridSize
        };
    }

    /**
     * 检查格子是否在网格范围内
     * @param {Object} grid - 网格坐标 {x, y}
     * @param {number} minX - 最小 X 坐标
     * @param {number} maxX - 最大 X 坐标
     * @param {number} minY - 最小 Y 坐标
     * @param {number} maxY - 最大 Y 坐标
     * @returns {boolean} 是否在范围内
     */
    isWithinBounds(grid, minX, maxX, minY, maxY) {
        return grid.x >= minX && grid.x <= maxX && grid.y >= minY && grid.y <= maxY;
    }

    /**
     * 获取格子周围的相邻格子（边对边）
     * @param {Object} grid - 网格坐标 {x, y}
     * @returns {Array} 相邻格子数组
     */
    getAdjacentGrids(grid) {
        return [
            { x: grid.x - 1, y: grid.y },     // 左
            { x: grid.x + 1, y: grid.y },     // 右
            { x: grid.x, y: grid.y - 1 },     // 上
            { x: grid.x, y: grid.y + 1 }      // 下
        ];
    }

    /**
     * 格式化格子坐标为字符串
     * @param {Object} grid - 网格坐标 {x, y}
     * @returns {string} 格式化的坐标字符串
     */
    formatGrid(grid) {
        return `(${grid.x}, ${grid.y})`;
    }
}
