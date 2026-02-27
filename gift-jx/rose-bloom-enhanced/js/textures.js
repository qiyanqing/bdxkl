/**
 * 玫瑰花瓣纹理生成器
 * 使用 Canvas 生成高保真花瓣纹理
 */

class RoseTextureGenerator {
    constructor() {
        this.textureCache = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 生成花瓣纹理
     * @param {Object} options - 纹理参数
     * @returns {string} DataURL
     */
    generatePetalTexture(options = {}) {
        const {
            width = 200,
            height = 250,
            colorStart = '#C73E1D',
            colorMid = '#E8806F',
            colorEnd = '#F09585',
            veinCount = 7,
            veinColor = 'rgba(180, 100, 100, 0.15)',
            imperfectionCount = 15
        } = options;

        const cacheKey = `petal_${width}_${height}_${colorStart}_${colorMid}_${colorEnd}`;

        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        this.canvas.width = width;
        this.canvas.height = height;
        const ctx = this.ctx;

        // 1. 基础渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(0.3, colorMid);
        gradient.addColorStop(0.7, colorEnd);
        gradient.addColorStop(1, colorStart);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. 绘制花瓣轮廓（心形）
        this.drawPetalShape(ctx, width, height);

        // 3. 绘制叶脉系统
        this.drawVeinSystem(ctx, width, height, veinCount, veinColor);

        // 4. 添加微纹理和瑕疵
        this.addImperfections(ctx, width, height, imperfectionCount);

        // 5. 边缘加深效果
        this.addEdgeDarkening(ctx, width, height);

        // 6. 添加光泽效果
        this.addSheen(ctx, width, height);

        const dataUrl = this.canvas.toDataURL('image/png');
        this.textureCache.set(cacheKey, dataUrl);
        return dataUrl;
    }

    /**
     * 绘制花瓣形状（心形轮廓）
     */
    drawPetalShape(ctx, width, height) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(width / 2, height);

        // 左侧曲线
        ctx.bezierCurveTo(
            width * 0.1, height * 0.7,
            width * 0.05, height * 0.3,
            width * 0.35, height * 0.05
        );
        ctx.bezierCurveTo(
            width * 0.45, height * 0.02,
            width * 0.5, 0,
            width * 0.5, 0
        );

        // 右侧曲线（镜像）
        ctx.bezierCurveTo(
            width * 0.5, 0,
            width * 0.55, height * 0.02,
            width * 0.65, height * 0.05
        );
        ctx.bezierCurveTo(
            width * 0.95, height * 0.3,
            width * 0.9, height * 0.7,
            width / 2, height
        );

        ctx.closePath();
        ctx.clip();
        ctx.restore();
    }

    /**
     * 绘制叶脉系统
     */
    drawVeinSystem(ctx, width, height, veinCount, veinColor) {
        ctx.strokeStyle = veinColor;
        ctx.lineCap = 'round';

        // 主叶脉（中心线）
        ctx.beginPath();
        ctx.moveTo(width / 2, height);
        ctx.quadraticCurveTo(width / 2, height * 0.3, width / 2, height * 0.05);
        ctx.lineWidth = 2;
        ctx.stroke();

        // 侧叶脉
        for (let i = 0; i < veinCount; i++) {
            const t = 0.15 + (i * 0.7 / veinCount);
            const y = height * (1 - t);
            const spread = Math.sin(t * Math.PI) * width * 0.35;

            // 左侧叶脉
            this.drawSideVein(ctx, width / 2, y, -spread, 0.3 + i * 0.05);

            // 右侧叶脉
            this.drawSideVein(ctx, width / 2, y, spread, 0.3 + i * 0.05);
        }

        // 细微叶脉网络
        this.drawFineVeinNetwork(ctx, width, height);
    }

    /**
     * 绘制单条侧叶脉
     */
    drawSideVein(ctx, startX, startY, spread, curve) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(
            startX + spread * 0.5,
            startY - 20,
            startX + spread,
            startY - 40 - curve * 20
        );
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    /**
     * 绘制细微叶脉网络
     */
    drawFineVeinNetwork(ctx, width, height) {
        ctx.strokeStyle = 'rgba(180, 100, 100, 0.06)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = height * 0.2 + Math.random() * height * 0.6;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 15);
            ctx.stroke();
        }
    }

    /**
     * 添加微纹理和瑕疵
     */
    addImperfections(ctx, width, height, count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3 + 1;

            // 小斑点
            ctx.fillStyle = `rgba(${150 + Math.random() * 50}, ${80 + Math.random() * 40}, ${80 + Math.random() * 40}, ${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // 微小褶皱
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = height * 0.3 + Math.random() * height * 0.5;

            ctx.strokeStyle = 'rgba(100, 50, 50, 0.03)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 10, y - 5, x + 15, y + 5);
            ctx.stroke();
        }
    }

    /**
     * 边缘加深效果
     */
    addEdgeDarkening(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.6
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(100, 30, 30, 0.2)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * 添加光泽效果
     */
    addSheen(ctx, width, height) {
        // 左上角高光
        const sheenGradient = ctx.createLinearGradient(0, 0, width * 0.6, height * 0.4);
        sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        sheenGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = sheenGradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * 生成花蕊纹理
     */
    generateStamenTexture() {
        const cacheKey = 'stamen_texture';
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        this.canvas.width = 20;
        this.canvas.height = 60;
        const ctx = this.ctx;

        // 纵向渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, 60);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.4, '#D2691E');
        gradient.addColorStop(0.7, '#DAA520');
        gradient.addColorStop(1, '#FFD700');

        ctx.fillStyle = gradient;
        ctx.fillRect(5, 0, 10, 45);

        // 花药（顶部膨大部分）
        ctx.beginPath();
        ctx.ellipse(10, 50, 8, 10, 0, 0, Math.PI * 2);
        const antherGradient = ctx.createRadialGradient(10, 50, 0, 10, 50, 10);
        antherGradient.addColorStop(0, '#FFD700');
        antherGradient.addColorStop(0.6, '#FFA500');
        antherGradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = antherGradient;
        ctx.fill();

        // 花粉颗粒
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 6;
            const x = 10 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius * 0.6;

            ctx.fillStyle = `rgba(255, 215, 0, ${Math.random() * 0.8})`;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const dataUrl = this.canvas.toDataURL('image/png');
        this.textureCache.set(cacheKey, dataUrl);
        return dataUrl;
    }

    /**
     * 生成叶片纹理
     */
    generateLeafTexture() {
        const cacheKey = 'leaf_texture';
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        this.canvas.width = 150;
        this.canvas.height = 200;
        const ctx = this.ctx;

        // 基础绿色渐变
        const gradient = ctx.createLinearGradient(0, 0, 150, 0);
        gradient.addColorStop(0, '#2D5D2A');
        gradient.addColorStop(0.3, '#4A8B45');
        gradient.addColorStop(0.5, '#5A9B55');
        gradient.addColorStop(0.7, '#4A8B45');
        gradient.addColorStop(1, '#2D5D2A');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 150, 200);

        // 主叶脉
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(75, 200);
        ctx.lineTo(75, 20);
        ctx.stroke();

        // 侧叶脉
        for (let i = 0; i < 8; i++) {
            const y = 40 + i * 20;
            const length = 40 + Math.sin(i / 8 * Math.PI) * 25;

            // 左侧
            ctx.beginPath();
            ctx.moveTo(75, y);
            ctx.lineTo(75 - length, y - 10);
            ctx.stroke();

            // 右侧
            ctx.beginPath();
            ctx.moveTo(75, y);
            ctx.lineTo(75 + length, y - 10);
            ctx.stroke();
        }

        // 细微绒毛纹理
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 150;
            const y = Math.random() * 200;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(x, y, 1, 1);
        }

        const dataUrl = this.canvas.toDataURL('image/png');
        this.textureCache.set(cacheKey, dataUrl);
        return dataUrl;
    }

    /**
     * 清除纹理缓存
     */
    clearCache() {
        this.textureCache.clear();
    }
}

// 导出单例
window.roseTextureGenerator = new RoseTextureGenerator();
