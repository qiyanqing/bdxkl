/**
 * 地图生成器类
 * 根据配置自动生成符合三大原则的地图
 */
export class MapGenerator {
    /**
     * 构造函数
     * @param {GridSystem} gridSystem - GridSystem 实例
     */
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
    }

    /**
     * 生成地图
     * @param {Object} config - 配置参数
     * @param {number} config.gridCount - 格子总数
     * @param {string[]} config.zigzagEdges - 哪些边有折线 ['top', 'right', 'bottom', 'left']
     * @param {number} config.startX - 起点X网格坐标（默认1）
     * @param {number} config.startY - 起点Y网格坐标（默认1）
     * @returns {Array} 格子数组
     */
    generate(config) {
        const {
            gridCount,
            zigzagEdges,
            startX = 1,
            startY = 1
        } = config;

        const grids = [];

        let currentGridX = startX;
        let currentGridY = startY;

        // 添加上边折线
        if (zigzagEdges.includes('top')) {
            const result = this.addTopZigzag(grids, currentGridX, currentGridY, gridCount);
            currentGridX = result.currentX;
            currentGridY = result.currentY;

            // 如果已经用完所有格子，直接返回
            if (grids.length >= gridCount) {
                this.connectGrids(grids);
                return grids.slice(0, gridCount);
            }
        }

        // 添加右边折线
        if (zigzagEdges.includes('right')) {
            const result = this.addRightZigzag(grids, currentGridX, currentGridY, gridCount);
            currentGridX = result.currentX;
            currentGridY = result.currentY;

            if (grids.length >= gridCount) {
                this.connectGrids(grids);
                return grids.slice(0, gridCount);
            }
        }

        // 添加下边折线
        if (zigzagEdges.includes('bottom')) {
            const result = this.addBottomZigzag(grids, currentGridX, currentGridY, gridCount);
            currentGridX = result.currentX;
            currentGridY = result.currentY;

            if (grids.length >= gridCount) {
                this.connectGrids(grids);
                return grids.slice(0, gridCount);
            }
        }

        // 添加左边折线
        if (zigzagEdges.includes('left')) {
            const remaining = gridCount - grids.length;
            for (let i = 0; i < remaining; i++) {
                const isStart = grids.length === 0;
                grids.push({
                    id: i,
                    x: currentGridX,
                    y: currentGridY,
                    type: isStart ? 'start' : 'normal',
                    next: null
                });

                // 向左移动
                currentGridX -= 1;
            }
        }

        // 连接格子成环
        this.connectGrids(grids);

        return grids.slice(0, gridCount);
    }

    /**
     * 添加上边Z字折线
     * @param {Array} grids - 格子数组
     * @param {number} currentX - 当前X网格坐标
     * @param {number} currentY - 当前Y网格坐标
     * @param {number} maxCount - 最大格子数
     * @returns {Object} {currentX, currentY}
     */
    addTopZigzag(grids, currentX, currentY, maxCount) {
        // 上边折线模式：先向右，然后向下一格，再向左，再向下一格，再向右...
        // 创建锯齿形状
        let direction = 1; // 1 = 向右，-1 = 向左
        let moveCount = 0;
        const zigzagDepth = 2; // 每次折线的深度

        while (grids.length < maxCount && moveCount < maxCount) {
            const isStart = grids.length === 0;
            grids.push({
                id: grids.length,
                x: currentX,
                y: currentY,
                type: isStart ? 'start' : 'normal',
                next: null
            });

            // 水平移动
            currentX += direction;
            moveCount++;

            // 每移动2格，改变方向并向下移动一格
            if (moveCount % zigzagDepth === 0 && grids.length < maxCount) {
                direction *= -1; // 反转方向
                currentY += 1; // 向下移动一格

                // 添加转向点
                if (grids.length < maxCount) {
                    grids.push({
                        id: grids.length,
                        x: currentX,
                        y: currentY,
                        type: 'normal',
                        next: null
                    });
                    moveCount++;
                }
            }
        }

        return { currentX, currentY };
    }

    /**
     * 添加右边Z字折线
     * @param {Array} grids - 格子数组
     * @param {number} currentX - 当前X网格坐标
     * @param {number} currentY - 当前Y网格坐标
     * @param {number} maxCount - 最大格子数
     * @returns {Object} {currentX, currentY}
     */
    addRightZigzag(grids, currentX, currentY, maxCount) {
        // 右边折线模式：先向下，然后向左一格，再向上，再向左一格，再向下...
        let direction = 1; // 1 = 向下，-1 = 向上
        let moveCount = 0;
        const zigzagDepth = 2; // 每次折线的深度

        while (grids.length < maxCount && moveCount < maxCount) {
            // 垂直移动
            currentY += direction;
            moveCount++;

            if (grids.length >= maxCount) break;

            grids.push({
                id: grids.length,
                x: currentX,
                y: currentY,
                type: 'normal',
                next: null
            });

            // 每移动2格，改变方向并向左移动一格
            if (moveCount % zigzagDepth === 0 && grids.length < maxCount) {
                direction *= -1; // 反转方向
                currentX -= 1; // 向左移动一格

                // 添加转向点
                if (grids.length < maxCount) {
                    grids.push({
                        id: grids.length,
                        x: currentX,
                        y: currentY,
                        type: 'normal',
                        next: null
                    });
                    moveCount++;
                }
            }
        }

        return { currentX, currentY };
    }

    /**
     * 添加下边Z字折线
     * @param {Array} grids - 格子数组
     * @param {number} currentX - 当前X网格坐标
     * @param {number} currentY - 当前Y网格坐标
     * @param {number} maxCount - 最大格子数
     * @returns {Object} {currentX, currentY}
     */
    addBottomZigzag(grids, currentX, currentY, maxCount) {
        // 下边折线模式：先向左，然后向上一格，再向右，再向上一格，再向左...
        let direction = -1; // -1 = 向左，1 = 向右
        let moveCount = 0;
        const zigzagDepth = 2; // 每次折线的深度

        while (grids.length < maxCount && moveCount < maxCount) {
            // 水平移动
            currentX += direction;
            moveCount++;

            if (grids.length >= maxCount) break;

            grids.push({
                id: grids.length,
                x: currentX,
                y: currentY,
                type: 'normal',
                next: null
            });

            // 每移动2格，改变方向并向上移动一格
            if (moveCount % zigzagDepth === 0 && grids.length < maxCount) {
                direction *= -1; // 反转方向
                currentY -= 1; // 向上移动一格

                // 添加转向点
                if (grids.length < maxCount) {
                    grids.push({
                        id: grids.length,
                        x: currentX,
                        y: currentY,
                        type: 'normal',
                        next: null
                    });
                    moveCount++;
                }
            }
        }

        return { currentX, currentY };
    }

    /**
     * 连接格子成环
     * @param {Array} grids - 格子数组
     */
    connectGrids(grids) {
        if (grids.length === 0) return;

        // 连接相邻格子
        for (let i = 0; i < grids.length - 1; i++) {
            grids[i].next = grids[i + 1];
        }

        // 连接最后一个格子到第一个格子，形成闭环
        if (grids.length > 2) {
            grids[grids.length - 1].next = grids[0];
        }
    }
}
