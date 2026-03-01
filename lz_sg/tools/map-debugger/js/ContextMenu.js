/**
 * 右键菜单组件
 * 用于设置格子类型属性
 */
export class ContextMenu {
    constructor(options = {}) {
        this.options = options;
        this.menuElement = null;
        this.targetGrid = null;
        this.onSelect = options.onSelect || null;
    }

    /**
     * 菜单配置项
     */
    static MENU_ITEMS = [
        { type: 'empty', label: '空白格', color: '#444444' },
        { type: 'start', label: '起点', color: '#ffd700' },
        { type: 'battle', label: '战斗格', color: '#e74c3c' },
        { type: 'elite', label: '精英格', color: '#9b59b6' },
        { type: 'shop', label: '商店格', color: '#3498db' },
        { type: 'buff', label: 'buff格', color: '#2ecc71' },
        { type: 'event', label: '事件格', color: '#e67e22' },
        { type: 'rest', label: '休息格', color: '#1abc9c' },
        { type: 'dice', label: '骰子格', color: '#f39c12' },
        { type: 'reward', label: '奖励格', color: '#ff69b4' }
    ];

    /**
     * 显示菜单
     * @param {number} x - 菜单X坐标（页面坐标）
     * @param {number} y - 菜单Y坐标（页面坐标）
     * @param {Object} grid - 目标格子
     */
    show(x, y, grid) {
        this.targetGrid = grid;
        this.createMenu(x, y);
    }

    /**
     * 隐藏菜单
     */
    hide() {
        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
        }
        this.targetGrid = null;
    }

    /**
     * 创建菜单元素
     * @param {number} x - 菜单X坐标
     * @param {number} y - 菜单Y坐标
     */
    createMenu(x, y) {
        // 先移除已存在的菜单
        this.hide();

        // 创建菜单容器
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'context-menu';
        this.menuElement.style.left = `${x}px`;
        this.menuElement.style.top = `${y}px`;

        // 添加菜单标题
        const title = document.createElement('div');
        title.className = 'context-menu-title';
        title.textContent = '设置格子类型';
        this.menuElement.appendChild(title);

        // 添加所有格子类型选项
        ContextMenu.MENU_ITEMS.forEach(item => {
            const menuItem = this.createMenuItem(item);
            this.menuElement.appendChild(menuItem);
        });

        // 添加到文档
        document.body.appendChild(this.menuElement);

        // 添加全局点击监听器（用于隐藏菜单）
        this.addGlobalClickListener();
    }

    /**
     * 创建菜单项
     * @param {Object} item - 菜单项配置 {type, label, color}
     * @returns {HTMLElement} 菜单项元素
     */
    createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.dataset.type = item.type;

        // 创建颜色标识点
        const colorDot = document.createElement('span');
        colorDot.className = 'color-dot';
        colorDot.style.backgroundColor = item.color;

        // 创建标签文字
        const label = document.createElement('span');
        label.textContent = item.label;

        // 组装菜单项
        menuItem.appendChild(colorDot);
        menuItem.appendChild(label);

        // 绑定点击事件
        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleSelect(item.type);
        });

        return menuItem;
    }

    /**
     * 处理菜单项选择
     * @param {string} gridType - 选择的格子类型
     */
    handleSelect(gridType) {
        if (this.onSelect && this.targetGrid) {
            this.onSelect(gridType);
        }
        this.hide();
    }

    /**
     * 添加全局点击监听器
     * 点击其他地方时隐藏菜单
     */
    addGlobalClickListener() {
        // 移除之前的监听器（如果有）
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler);
        }

        // 创建新的监听器
        this.globalClickHandler = (e) => {
            // 如果点击的不是菜单内部，隐藏菜单
            if (this.menuElement && !this.menuElement.contains(e.target)) {
                this.hide();
                document.removeEventListener('click', this.globalClickHandler);
                this.globalClickHandler = null;
            }
        };

        // 延迟添加监听器，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', this.globalClickHandler);
        }, 0);
    }

    /**
     * 销毁菜单组件
     */
    destroy() {
        this.hide();
        if (this.globalClickHandler) {
            document.removeEventListener('click', this.globalClickHandler);
            this.globalClickHandler = null;
        }
    }
}
