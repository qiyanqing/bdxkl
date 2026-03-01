/**
 * 路径验证器类
 * 验证地图是否符合三大原则：
 * 1. 每个格子恰好2条边（除了起点和终点）
 * 2. 禁止对角线连接
 * 3. 最少3条边有Z字折线（增强视觉吸引力）
 */
export class PathValidator {
    /**
     * 构造函数
     * @param {GridSystem} gridSystem - GridSystem 实例
     */
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
        this.violations = [];
        this.zigzagEdges = { top: false, right: false, bottom: false, left: false };
    }

    /**
     * 验证整个地图
     * @param {Array} grids - 所有格子数组
     * @returns {Object} 验证结果 {isValid, violations, zigzagEdges, zigzagCount}
     */
    validate(grids) {
        this.violations = [];
        this.zigzagEdges = { top: false, right: false, bottom: false, left: false };

        // 验证原则1：每个格子恰好2条边
        this.validateEdgeCount(grids);

        // 验证原则2：禁止对角线连接
        this.validateNoDiagonals(grids);

        // 验证原则3：最少3条边有Z字折线
        this.validateZigzagEdges(grids);

        // 计算有折线的边数量
        const zigzagCount = this.countZigzagEdges();

        return {
            isValid: this.violations.length === 0,
            violations: this.violations,
            zigzagEdges: this.zigzagEdges,
            zigzagCount
        };
    }

    /**
     * 验证原则1：每个格子恰好2条边
     * @param {Array} grids - 所有格子数组
     */
    validateEdgeCount(grids) {
        grids.forEach(grid => {
            // 计算每个格子的边数
            let edgeCount = 0;

            // 检查是否有前驱（有其他格子指向它）
            const hasPrev = grids.some(g => g.next && g.next.id === grid.id);
            if (hasPrev) edgeCount++;

            // 检查是否有后继
            if (grid.next) edgeCount++;

            // 起点和终点可以是1条边
            const isStart = grid.type === 'start';
            const isEnd = !grid.next && !hasPrev;

            if (isStart || isEnd) {
                // 起点和终点可以是1条边
                if (edgeCount > 2) {
                    this.violations.push({
                        type: 'edgeCount',
                        gridId: grid.id,
                        message: `格子 ${grid.id} (${grid.x}, ${grid.y}) 边数过多`,
                        actual: edgeCount,
                        expected: isStart ? '≤2' : '≤2'
                    });
                }
            } else {
                // 中间格子必须是2条边
                if (edgeCount !== 2) {
                    this.violations.push({
                        type: 'edgeCount',
                        gridId: grid.id,
                        message: `格子 ${grid.id} (${grid.x}, ${grid.y}) 边数错误`,
                        actual: edgeCount,
                        expected: 2
                    });
                }
            }
        });
    }

    /**
     * 验证原则2：禁止对角线连接
     * @param {Array} grids - 所有格子数组
     */
    validateNoDiagonals(grids) {
        grids.forEach(grid => {
            if (grid.next) {
                if (this.gridSystem.isDiagonalAdjacent(grid, grid.next)) {
                    this.violations.push({
                        type: 'diagonal',
                        gridId: grid.id,
                        relatedGridId: grid.next.id,
                        message: `格子 ${grid.id} (${grid.x}, ${grid.y}) -> ${grid.next.id} (${grid.next.x}, ${grid.next.y}) 是对角线连接`
                    });
                }
            }
        });
    }

    /**
     * 验证原则3：最少3条边有Z字折线
     * @param {Array} grids - 所有格子数组
     */
    validateZigzagEdges(grids) {
        if (grids.length < 2) return;

        const bounds = this.getBounds(grids);
        const margin = 1; // 边缘容差

        // 检查上边（y 最小）
        const topEdge = grids.filter(grid => grid.y <= bounds.minY + margin);
        this.zigzagEdges.top = this.hasZigzag(topEdge);

        // 检查右边（x 最大）
        const rightEdge = grids.filter(grid => grid.x >= bounds.maxX - margin);
        this.zigzagEdges.right = this.hasZigzag(rightEdge);

        // 检查下边（y 最大）
        const bottomEdge = grids.filter(grid => grid.y >= bounds.maxY - margin);
        this.zigzagEdges.bottom = this.hasZigzag(bottomEdge);

        // 检查左边（x 最小）
        const leftEdge = grids.filter(grid => grid.x <= bounds.minX + margin);
        this.zigzagEdges.left = this.hasZigzag(leftEdge);

        // 检查是否至少有3条边有折线
        const zigzagCount = this.countZigzagEdges();
        if (zigzagCount < 3) {
            this.violations.push({
                type: 'zigzag',
                message: `折线边数量不足（当前：${zigzagCount}，要求：≥3）`,
                actual: zigzagCount,
                expected: '≥3'
            });
        }
    }

    /**
     * 检测一组格子是否有折线
     * 折线定义：至少有一次方向变化（水平 -> 垂直 或 垂直 -> 水平）
     * @param {Array} edgeGrids - 边缘格子数组
     * @returns {boolean} 是否有折线
     */
    hasZigzag(edgeGrids) {
        if (edgeGrids.length < 3) return false;

        // 按照连接关系排序格子
        const sortedGrids = this.sortGridsByConnection(edgeGrids);
        if (sortedGrids.length < 3) return false;

        // 检测方向变化
        let lastDirection = null;
        let directionChangeCount = 0;

        for (let i = 0; i < sortedGrids.length - 1; i++) {
            const current = sortedGrids[i];
            const next = sortedGrids[i + 1];

            const dx = Math.abs(next.x - current.x);
            const dy = Math.abs(next.y - current.y);

            if (dx > dy) {
                // 水平方向
                if (lastDirection === 'vertical') {
                    directionChangeCount++;
                }
                lastDirection = 'horizontal';
            } else if (dy > dx) {
                // 垂直方向
                if (lastDirection === 'horizontal') {
                    directionChangeCount++;
                }
                lastDirection = 'vertical';
            }
        }

        // 至少有一次方向变化才算有折线
        return directionChangeCount >= 1;
    }

    /**
     * 按照连接关系排序格子
     * @param {Array} grids - 格子数组
     * @returns {Array} 排序后的格子数组
     */
    sortGridsByConnection(grids) {
        if (grids.length === 0) return [];

        // 找到起点（没有前驱的格子）
        const gridSet = new Set(grids.map(g => g.id));
        let startGrid = grids.find(g => {
            // 在提供的格子集合中，检查是否有其他格子指向它
            return !grids.some(other => other.next && other.next.id === g.id);
        });

        // 如果找不到起点，使用第一个格子
        if (!startGrid) {
            startGrid = grids[0];
        }

        const sorted = [startGrid];
        let current = startGrid;

        // 按照 next 关系遍历
        while (current.next && gridSet.has(current.next.id)) {
            sorted.push(current.next);
            current = current.next;
        }

        return sorted;
    }

    /**
     * 计算有折线的边数量
     * @returns {number} 有折线的边数量
     */
    countZigzagEdges() {
        return Object.values(this.zigzagEdges).filter(has => has).length;
    }

    /**
     * 获取地图边界
     * @param {Array} grids - 所有格子数组
     * @returns {Object} 边界 {minX, maxX, minY, maxY}
     */
    getBounds(grids) {
        if (grids.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        grids.forEach(grid => {
            minX = Math.min(minX, grid.x);
            maxX = Math.max(maxX, grid.x);
            minY = Math.min(minY, grid.y);
            maxY = Math.max(maxY, grid.y);
        });

        return { minX, maxX, minY, maxY };
    }
}
