/**
 * 关卡保存器
 * 负责将编辑的关卡保存为JSON文件
 */
export class LevelSaver {
    constructor(options = {}) {
        this.options = options;
        this.savedLevels = [];
        this.loadSavedLevels();
    }

    /**
     * 保存关卡
     * @param {string} levelId - 关卡ID (如: 1-1)
     * @param {string} levelName - 关卡名称
     * @param {Array} grids - 格子数组
     * @param {string} levelType - 关卡类型 (normal | bonus)
     */
    saveLevel(levelId, levelName, grids, levelType) {
        // 验证输入
        if (!levelId || !levelName) {
            return { success: false, message: '关卡ID和名称不能为空' };
        }

        // 构建关卡数据
        const levelData = {
            levelId,
            levelName,
            levelType,
            mapConfig: {
                totalGrids: grids.length,
                edges: 4,
                gridsPerEdge: 12
            },
            grids: grids.map(grid => ({
                id: grid.id,
                edge: this.getEdgeFromGrid(grid, grids),
                index: this.getEdgeIndex(grid, grids),
                x: grid.x,
                y: grid.y,
                type: grid.type
            }))
        };

        // 保存到本地存储
        this.saveToLocalStorage(levelData);

        // 通知更新
        this.options.onSave?.(levelData);

        return { success: true, levelData };
    }

    /**
     * 保存到本地存储
     */
    saveToLocalStorage(levelData) {
        let levels = this.getStoredLevels();
        const index = levels.findIndex(l => l.levelId === levelData.levelId);

        if (index >= 0) {
            levels[index] = levelData;
        } else {
            levels.push(levelData);
        }

        localStorage.setItem('map-debugger-levels', JSON.stringify(levels));
        this.savedLevels = levels;
    }

    /**
     * 获取存储的关卡
     */
    getStoredLevels() {
        const data = localStorage.getItem('map-debugger-levels');
        return data ? JSON.parse(data) : [];
    }

    /**
     * 加载已保存的关卡列表
     */
    loadSavedLevels() {
        this.savedLevels = this.getStoredLevels();
        return this.savedLevels;
    }

    /**
     * 根据坐标判断格子在哪条边
     */
    getEdgeFromGrid(grid, grids) {
        if (grids.length === 0) return 'top';

        // 计算边界
        const xs = grids.map(g => g.x);
        const ys = grids.map(g => g.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const margin = 50;

        // 判断在哪条边
        if (grid.y <= minY + margin) return 'top';
        if (grid.x >= maxX - margin) return 'right';
        if (grid.y >= maxY - margin) return 'bottom';
        return 'left';
    }

    /**
     * 获取格子在该边中的位置
     */
    getEdgeIndex(grid, grids) {
        const edge = this.getEdgeFromGrid(grid, grids);
        const sameEdgeGrids = grids.filter(g =>
            this.getEdgeFromGrid(g, grids) === edge
        );
        return sameEdgeGrids.findIndex(g => g.id === grid.id);
    }

    /**
     * 导出关卡文件（供下载）
     */
    exportLevel(levelId) {
        const levels = this.getStoredLevels();
        const level = levels.find(l => l.levelId === levelId);

        if (!level) {
            alert('关卡不存在');
            return;
        }

        const json = JSON.stringify(level, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${levelId}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }
}
