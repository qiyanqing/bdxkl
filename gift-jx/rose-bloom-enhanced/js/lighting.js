/**
 * 动态光照系统
 * 模拟真实环境光、阴影投射和高光反射
 */

class LightingSystem {
    constructor() {
        this.enabled = true;
        this.timeOfDay = 0.5; // 0-1, 0.5 = 正午
        this.lightDirection = { x: -0.3, y: -0.5, z: 0.8 };
        this.ambientIntensity = 0.6;
        this.shadows = new Map();
    }

    /**
     * 初始化光照系统
     */
    init() {
        this.ambientLight = document.querySelector('.ambient-light');
        this.directionalLight = document.querySelector('.directional-light');
        this.shadowCaster = document.querySelector('.shadow-caster');

        this.updateLighting();
    }

    /**
     * 更新光照状态
     */
    updateLighting() {
        if (!this.enabled) return;

        // 环境光
        const ambientColor = this.getAmbientColor();
        this.ambientLight.style.background = `radial-gradient(ellipse at 30% 20%, ${ambientColor.top} 0%, ${ambientColor.bottom} 70%)`;

        // 方向光
        const dirLightX = 30 + this.lightDirection.x * 50;
        const dirLightY = 20 + this.lightDirection.y * 30;
        this.directionalLight.style.background = `radial-gradient(ellipse at ${dirLightX}% ${dirLightY}%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`;

        // 更新阴影投射
        this.updateShadows();
    }

    /**
     * 获取环境光颜色
     */
    getAmbientColor() {
        // 根据时间调整色温
        const warmShift = Math.sin(this.timeOfDay * Math.PI) * 30;

        return {
            top: `rgba(${255 + warmShift}, ${250 - warmShift * 0.5}, ${245 - warmShift}, 0.15)`,
            bottom: `rgba(${200 + warmShift}, ${220 - warmShift * 0.3}, ${235 - warmShift * 0.5}, 0.08)`
        };
    }

    /**
     * 计算并应用阴影
     */
    calculateShadow(element, receiverElement) {
        const rect = element.getBoundingClientRect();
        const receiverRect = receiverElement.getBoundingClientRect();

        // 计算阴影偏移
        const shadowX = (rect.left + rect.width / 2 - receiverRect.left - receiverRect.width / 2) * 0.1;
        const shadowY = (rect.top + rect.height / 2 - receiverRect.top - receiverRect.height / 2) * 0.15;

        // 阴影强度基于距离
        const distance = Math.sqrt(shadowX ** 2 + shadowY ** 2);
        const intensity = Math.max(0, 0.3 - distance * 0.01);

        return {
            x: shadowX,
            y: shadowY,
            blur: 10 + distance * 0.2,
            intensity
        };
    }

    /**
     * 更新所有阴影
     */
    updateShadows() {
        const petals = document.querySelectorAll('.petal');
        const stem = document.querySelector('.stem-main');

        petals.forEach(petal => {
            const shadow = this.calculateShadow(petal, stem);
            const shadowStyle = `${shadow.x}px ${shadow.y}px ${shadow.blur}px rgba(0, 0, 0, ${shadow.intensity})`;
            petal.style.filter = `drop-shadow(${shadowStyle})`;
        });
    }

    /**
     * 切换光照
     */
    toggle() {
        this.enabled = !this.enabled;
        const lightingSystem = document.querySelector('.lighting-system');

        if (this.enabled) {
            lightingSystem.style.opacity = '1';
            this.updateLighting();
        } else {
            lightingSystem.style.opacity = '0.3';
        }

        return this.enabled;
    }

    /**
     * 设置时间（影响色温）
     */
    setTimeOfDay(time) {
        this.timeOfDay = Math.max(0, Math.min(1, time));
        this.updateLighting();
    }

    /**
     * 动态光照循环
     */
    startDynamicCycle() {
        let time = 0;
        const cycle = () => {
            time += 0.002;
            this.lightDirection.x = Math.sin(time) * 0.3;
            this.lightDirection.y = -0.5 + Math.cos(time * 0.7) * 0.2;
            this.updateLighting();
            requestAnimationFrame(cycle);
        };
        cycle();
    }
}

// 导出单例
window.lightingSystem = new LightingSystem();
