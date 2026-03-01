/**
 * 格子类型定义
 */
export const GRID_TYPES = {
    EMPTY: 'empty',           // 空白格
    START: 'start',           // 起点
    BATTLE: 'battle',         // 普通战斗格
    ELITE: 'elite',           // 精英战斗格
    SHOP: 'shop',             // 商店格
    BUFF: 'buff',             // buff格
    EVENT: 'event',           // 事件格
    REST: 'rest',             // 休息格
    DICE: 'dice',             // 骰子格
    REWARD: 'reward'          // 奖励格
};

/**
 * 地图生成器类
 * 生成环形地图：4条边×12格=48格
 */
export class MapGenerator {
    /**
     * 构造函数
     * @param {GridSystem} gridSystem - GridSystem 实例
     */
    constructor(gridSystem) {
        this.gridSystem = gridSystem;
        this.GRIDS_PER_EDGE = 12; // 每条边12格
        this.TOTAL_GRIDS = 48;     // 总共48格
    }

    /**
     * 生成地图
     * @param {Object} config - 配置参数
     * @param {string} config.levelType - 关卡类型：'normal' | 'bonus'
     * @param {number} config.startX - 起点X网格坐标（默认100）
     * @param {number} config.startY - 起点Y网格坐标（默认80）
     * @returns {Array} 格子数组
     */
    generate(config) {
        const {
            levelType = 'normal',
            startX = 100,
            startY = 80
        } = config;

        const grids = [];
        let currentGridX = startX;
        let currentGridY = startY;

        // 生成上边（从左到右，12格）
        for (let i = 0; i < this.GRIDS_PER_EDGE; i++) {
            const gridType = this.getGridType(levelType, grids.length);
            grids.push({
                id: grids.length,
                x: currentGridX,
                y: currentGridY,
                type: gridType,
                next: null
            });
            currentGridX += 1; // 向右移动
        }

        // 生成右边（从上到下，12格）
        for (let i = 0; i < this.GRIDS_PER_EDGE; i++) {
            // 跳过第一个格子，因为上边最后一个格子已经在右上角
            if (i === 0) {
                currentGridY += 1;
                continue;
            }
            const gridType = this.getGridType(levelType, grids.length);
            grids.push({
                id: grids.length,
                x: currentGridX,
                y: currentGridY,
                type: gridType,
                next: null
            });
            currentGridY += 1; // 向下移动
        }

        // 生成下边（从右到左，12格）
        for (let i = 0; i < this.GRIDS_PER_EDGE; i++) {
            // 跳过第一个格子，因为右边最后一个格子已经在右下角
            if (i === 0) {
                currentGridX -= 1;
                continue;
            }
            const gridType = this.getGridType(levelType, grids.length);
            grids.push({
                id: grids.length,
                x: currentGridX,
                y: currentGridY,
                type: gridType,
                next: null
            });
            currentGridX -= 1; // 向左移动
        }

        // 生成左边（从下到上，12格）
        for (let i = 0; i < this.GRIDS_PER_EDGE; i++) {
            // 跳过第一个格子，因为下边最后一个格子已经在左下角
            // 跳过最后一个格子，因为要回到起点，避免重复
            if (i === 0) {
                currentGridY -= 1;
                continue;
            }
            if (i === this.GRIDS_PER_EDGE - 1) {
                break; // 不生成最后一个格子，回到起点
            }
            const gridType = this.getGridType(levelType, grids.length);
            grids.push({
                id: grids.length,
                x: currentGridX,
                y: currentGridY,
                type: gridType,
                next: null
            });
            currentGridY -= 1; // 向上移动
        }

        // 连接格子成环
        this.connectGrids(grids);

        return grids;
    }

    /**
     * 根据关卡类型和格子索引获取格子类型
     * @param {string} levelType - 关卡类型
     * @param {number} gridIndex - 格子索引
     * @returns {string} 格子类型
     */
    getGridType(levelType, gridIndex) {
        // 第一个格子总是起点
        if (gridIndex === 0) {
            return GRID_TYPES.START;
        }

        // 福利关：全部奖励格
        if (levelType === 'bonus') {
            return GRID_TYPES.REWARD;
        }

        // 普通关：随机分配各种类型
        const normalTypes = [
            GRID_TYPES.BATTLE,
            GRID_TYPES.ELITE,
            GRID_TYPES.SHOP,
            GRID_TYPES.BUFF,
            GRID_TYPES.EVENT,
            GRID_TYPES.REST,
            GRID_TYPES.DICE
        ];

        // 随机选择一个类型
        const randomIndex = Math.floor(Math.random() * normalTypes.length);
        return normalTypes[randomIndex];
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
