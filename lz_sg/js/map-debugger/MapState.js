/**
 * 地图状态管理类
 * 负责管理地图数据、格子状态和观察者通知
 */
export class MapState {
    constructor() {
        // 状态属性
        this.grids = [];           // 格子数组
        this.nextId = 0;           // 下一个格子ID
        this.editMode = 'add';     // 当前编辑模式：'add' | 'select' | 'delete'
        this.selectedGridId = null; // 选中的格子ID
        this.observers = [];       // 观察者数组
    }

    /**
     * 添加格子
     * @param {Object} data - 格子数据 {x, y, type}
     * @returns {Object|null} 新创建的格子对象，如果位置已存在则返回 null
     */
    addGrid(data) {
        // 检查位置是否已存在格子
        const exists = this.grids.find(g => g.x === data.x && g.y === data.y);
        if (exists) {
            return null;
        }

        // 创建新格子
        const newGrid = {
            id: this.nextId++,
            x: data.x,
            y: data.y,
            type: data.type || 'normal',
            next: null
        };

        this.grids.push(newGrid);
        this.notify('grid:added', newGrid);
        return newGrid;
    }

    /**
     * 删除格子
     * 删除格子后会自动修复路径断裂（连接前驱和后继）
     * @param {number} id - 要删除的格子ID
     * @returns {Object|null} 被删除的格子对象，如果不存在则返回 null
     */
    deleteGrid(id) {
        const index = this.grids.findIndex(g => g.id === id);
        if (index === -1) {
            return null;
        }

        const deleted = this.grids[index];

        // 查找前驱和后继格子
        let prevGrid = null;
        let nextGrid = deleted.next;

        // 找到指向被删除格子的前驱
        for (const grid of this.grids) {
            if (grid.next && grid.next.id === id) {
                prevGrid = grid;
                break;
            }
        }

        // 修复路径断裂：连接前驱和后继
        if (prevGrid && nextGrid) {
            prevGrid.next = nextGrid;
            this.notify('grid:connected', { from: prevGrid, to: nextGrid });
        } else if (prevGrid && !nextGrid) {
            prevGrid.next = null;
        }

        // 从数组中删除
        this.grids.splice(index, 1);

        // 清除选中状态
        if (this.selectedGridId === id) {
            this.selectedGridId = null;
        }

        this.notify('grid:deleted', deleted);
        return deleted;
    }

    /**
     * 移动格子到新位置
     * @param {number} id - 格子ID
     * @param {number} x - 新的X坐标
     * @param {number} y - 新的Y坐标
     * @returns {boolean} 是否移动成功
     */
    moveGrid(id, x, y) {
        const grid = this.grids.find(g => g.id === id);
        if (!grid) {
            return false;
        }

        // 检查新位置是否已被占用
        const exists = this.grids.find(g => g.x === x && g.y === y && g.id !== id);
        if (exists) {
            return false;
        }

        const oldPosition = { x: grid.x, y: grid.y };
        grid.x = x;
        grid.y = y;

        this.notify('grid:moved', { grid, oldPosition, newPosition: { x, y } });
        return true;
    }

    /**
     * 连接两个格子
     * 设置 fromId 格子的 next 指向 toId 格子
     * @param {number} fromId - 起始格子ID
     * @param {number} toId - 目标格子ID
     * @returns {boolean} 是否连接成功
     */
    connectGrids(fromId, toId) {
        const fromGrid = this.grids.find(g => g.id === fromId);
        const toGrid = this.grids.find(g => g.id === toId);

        if (!fromGrid || !toGrid) {
            return false;
        }

        // 避免自连接
        if (fromId === toId) {
            return false;
        }

        fromGrid.next = toGrid;
        this.notify('grid:connected', { from: fromGrid, to: toGrid });
        return true;
    }

    /**
     * 断开两个格子的连接
     * 清除 id1 格子的 next 指向
     * @param {number} id1 - 第一个格子ID
     * @param {number} id2 - 第二个格子ID（未使用，保持API一致性）
     * @returns {boolean} 是否断开成功
     */
    disconnectGrids(id1, id2) {
        const grid = this.grids.find(g => g.id === id1);
        if (!grid) {
            return false;
        }

        const wasConnected = grid.next !== null;
        grid.next = null;

        if (wasConnected) {
            this.notify('grid:disconnected', { grid });
        }
        return true;
    }

    /**
     * 根据ID获取格子
     * @param {number} id - 格子ID
     * @returns {Object|null} 格子对象或 null
     */
    getGrid(id) {
        return this.grids.find(g => g.id === id) || null;
    }

    /**
     * 根据坐标获取格子
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 格子对象或 null
     */
    getGridAtPosition(x, y) {
        return this.grids.find(g => g.x === x && g.y === y) || null;
    }

    /**
     * 根据像素坐标获取格子
     * @param {number} pixelX - 像素X坐标
     * @param {number} pixelY - 像素Y坐标
     * @param {number} gridSize - 格子大小
     * @returns {Object|null} 格子对象或 null
     */
    getGridAtPixel(pixelX, pixelY, gridSize) {
        const gridX = Math.round(pixelX / gridSize);
        const gridY = Math.round(pixelY / gridSize);
        return this.getGridAtPosition(gridX, gridY);
    }

    /**
     * 设置编辑模式
     * @param {string} mode - 编辑模式：'add' | 'select' | 'delete'
     */
    setEditMode(mode) {
        const validModes = ['add', 'select', 'delete'];
        if (!validModes.includes(mode)) {
            console.warn(`无效的编辑模式: ${mode}`);
            return;
        }

        const oldMode = this.editMode;
        this.editMode = mode;
        this.notify('mode:changed', { oldMode, newMode: mode });
    }

    /**
     * 设置选中的格子
     * @param {number|null} id - 格子ID，null 表示取消选中
     */
    setSelectedGrid(id) {
        const oldId = this.selectedGridId;
        this.selectedGridId = id;

        const grid = id !== null ? this.getGrid(id) : null;
        this.notify('grid:selected', { grid, oldId, newId: id });
    }

    /**
     * 订阅状态变化
     * @param {Function} callback - 回调函数，接收 (event, data) 参数
     * @returns {Function} 取消订阅函数
     */
    subscribe(callback) {
        this.observers.push(callback);

        // 返回取消订阅函数
        return () => {
            const index = this.observers.indexOf(callback);
            if (index !== -1) {
                this.observers.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有观察者
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    notify(event, data) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('观察者回调出错:', error);
            }
        });
    }

    /**
     * 导出为 JSON
     * 移除循环引用，只保留基本数据和关系ID
     * @returns {string} JSON 字符串
     */
    toJSON() {
        const exportData = this.grids.map(g => ({
            id: g.id,
            x: g.x,
            y: g.y,
            type: g.type,
            nextId: g.next ? g.next.id : null
        }));

        return JSON.stringify({
            grids: exportData,
            nextId: this.nextId,
            editMode: this.editMode
        }, null, 2);
    }

    /**
     * 从 JSON 导入数据
     * @param {string} jsonString - JSON 字符串
     * @returns {boolean} 是否导入成功
     */
    fromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // 重建格子数组，保留 nextId 和 prevId
            this.grids = data.grids.map(g => ({
                id: g.id,
                x: g.x,
                y: g.y,
                type: g.type,
                nextId: g.nextId,
                prevId: g.prevId,
                next: null,
                prev: null
            }));

            // 重建连接关系
            this.grids.forEach(grid => {
                if (grid.nextId !== null) {
                    grid.next = this.grids.find(g => g.id === grid.nextId) || null;
                }
                if (grid.prevId !== null) {
                    grid.prev = this.grids.find(g => g.id === grid.prevId) || null;
                }
            });

            // 更新状态
            this.nextId = data.nextId || this.grids.length;
            this.editMode = data.editMode || 'add';
            this.selectedGridId = null;

            this.notify('state:loaded', { grids: this.grids });
            return true;
        } catch (error) {
            console.error('导入 JSON 失败:', error);
            return false;
        }
    }

    /**
     * 获取所有格子
     * @returns {Array} 格子数组
     */
    getAllGrids() {
        return [...this.grids];
    }

    /**
     * 清空所有格子
     */
    clear() {
        this.grids = [];
        this.nextId = 0;
        this.selectedGridId = null;
        this.notify('state:cleared', null);
    }
}
