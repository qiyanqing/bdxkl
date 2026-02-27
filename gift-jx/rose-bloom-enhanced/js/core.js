/**
 * 玫瑰花盛开核心动画控制器
 * 控制整个动画序列：花蕊 → 花萼 → 花瓣 → 叶片
 */

class RoseBloomController {
    constructor() {
        this.animationState = 'idle';
        this.animationTime = 0;
        this.totalDuration = 12000; // 12秒完整动画
        this.components = {
            stamens: [],
            sepals: [],
            petals: [],
            leaves: []
        };
    }

    /**
     * 初始化
     */
    async init() {
        console.log('🌹 初始化玫瑰花仿真系统...');

        // 初始化光照系统
        window.lightingSystem.init();
        window.lightingSystem.startDynamicCycle();

        // 生成纹理
        await this.generateTextures();

        // 构建花蕊
        this.buildStamens();

        // 构建花萼
        this.buildSepals();

        // 构建 8 层花瓣
        this.buildPetals();

        // 构建花茎和叶片
        this.buildStemAndLeaves();

        // 绑定控制
        this.bindControls();

        console.log('✅ 玫瑰花仿真系统初始化完成');
        console.log('📊 统计信息:');
        console.log(`   - 花蕊: ${this.components.stamens.length} 根`);
        console.log(`   - 花萼: ${this.components.sepals.length} 片`);
        console.log(`   - 花瓣: ${this.components.petals.length} 片 (8层)`);
        console.log(`   - 叶片: ${this.components.leaves.length} 片`);

        // 开始动画
        setTimeout(() => this.startAnimation(), 500);
    }

    /**
     * 生成所有纹理
     */
    async generateTextures() {
        console.log('🎨 生成纹理...');

        // 预生成花瓣纹理（每层不同）
        this.petalTextures = [];
        for (let layer = 0; layer < 8; layer++) {
            const texture = window.roseTextureGenerator.generatePetalTexture({
                colorStart: this.getLayerColor(layer, 'start'),
                colorMid: this.getLayerColor(layer, 'mid'),
                colorEnd: this.getLayerColor(layer, 'end')
            });
            this.petalTextures.push(texture);
        }

        // 花蕊纹理
        this.stamenTexture = window.roseTextureGenerator.generateStamenTexture();

        // 叶片纹理
        this.leafTexture = window.roseTextureGenerator.generateLeafTexture();
    }

    /**
     * 获取各层花瓣颜色
     */
    getLayerColor(layer, position) {
        const colors = [
            { start: '#8B1810', mid: '#A02010', end: '#B03020' }, // L1
            { start: '#A02010', mid: '#C73E1D', end: '#D05035' }, // L2
            { start: '#C73E1D', mid: '#D85545', end: '#E8705A' }, // L3
            { start: '#D85545', mid: '#E8806F', end: '#F09080' }, // L4
            { start: '#E8806F', mid: '#F09585', end: '#F8B0A0' }, // L5
            { start: '#F09585', mid: '#F8B0A0', end: '#FCC0B5' }, // L6
            { start: '#F8AFA6', mid: '#FCC8C0', end: '#FDD8D2' }, // L7
            { start: '#FCC8C0', mid: '#FDD8D2', end: '#FFE8E4' }  // L8
        ];
        return colors[layer][position];
    }

    /**
     * 构建花蕊
     */
    buildStamens() {
        const cluster = document.getElementById('stamenCluster');
        const stamenCount = 18;

        for (let i = 0; i < stamenCount; i++) {
            const stamen = document.createElement('div');
            stamen.className = 'stamen';

            const angle = (i / stamenCount) * 360;
            const spread = 3 + Math.random() * 5;
            const height = 25 + Math.random() * 8;

            stamen.style.cssText = `
                --angle: ${angle}deg;
                --spread: ${spread}px;
                --height: ${height}px;
                background-image: url(${this.stamenTexture});
                background-size: cover;
            `;

            cluster.appendChild(stamen);
            this.components.stamens.push(stamen);
        }
    }

    /**
     * 构建花萼
     */
    buildSepals() {
        const cluster = document.getElementById('sepalCluster');
        const sepalCount = 5;

        for (let i = 0; i < sepalCount; i++) {
            const sepal = document.createElement('div');
            sepal.className = 'sepal';

            const angle = (i / sepalCount) * 360;
            const scale = 0.9 + Math.random() * 0.2;

            sepal.style.cssText = `
                --angle: ${angle}deg;
                --scale: ${scale};
            `;

            cluster.appendChild(sepal);
            this.components.sepals.push(sepal);
        }
    }

    /**
     * 构建 8 层花瓣
     */
    buildPetals() {
        const cluster = document.getElementById('petalCluster');
        const layerConfig = [
            { count: 6, size: { w: 35, h: 45 }, angleStep: 60, zBase: 50 },
            { count: 8, size: { w: 45, h: 58 }, angleStep: 45, zBase: 35 },
            { count: 10, size: { w: 55, h: 70 }, angleStep: 36, zBase: 20 },
            { count: 12, size: { w: 65, h: 82 }, angleStep: 30, zBase: 5 },
            { count: 12, size: { w: 75, h: 92 }, angleStep: 30, zBase: -10 },
            { count: 10, size: { w: 85, h: 100 }, angleStep: 36, zBase: -25 },
            { count: 8, size: { w: 95, h: 108 }, angleStep: 45, zBase: -40 },
            { count: 6, size: { w: 105, h: 115 }, angleStep: 60, zBase: -55 }
        ];

        layerConfig.forEach((config, layerIndex) => {
            for (let i = 0; i < config.count; i++) {
                const petal = document.createElement('div');
                petal.className = `petal layer-${layerIndex + 1}`;

                const baseAngle = i * config.angleStep;
                const randomOffset = (Math.random() - 0.5) * 15;
                const zPos = config.zBase + (Math.random() - 0.5) * 10;

                petal.style.cssText = `
                    --layer: ${layerIndex + 1};
                    --base-angle: ${baseAngle}deg;
                    --random-offset: ${randomOffset}deg;
                    --z-pos: ${zPos}px;
                    --petal-width: ${config.size.w}px;
                    --petal-height: ${config.size.h}px;
                    width: ${config.size.w}px;
                    height: ${config.size.h}px;
                    background-image: url(${this.petalTextures[layerIndex]});
                    background-size: cover;
                `;

                cluster.appendChild(petal);
                this.components.petals.push({ element: petal, layer: layerIndex, index: i });
            }
        });
    }

    /**
     * 构建花茎和叶片
     */
    buildStemAndLeaves() {
        const stem = document.getElementById('stemMain');
        const leafPoints = document.getElementById('leafPoints');

        // 花茎
        stem.style.height = '0';

        // 添加 4 片叶片
        const leafPositions = [
            { y: 80, side: -1, angle: -45, scale: 0.7 },
            { y: 140, side: 1, angle: 35, scale: 0.85 },
            { y: 200, side: -1, angle: -50, scale: 1 },
            { y: 270, side: 1, angle: 40, scale: 0.9 }
        ];

        leafPositions.forEach((pos, i) => {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';

            leaf.style.cssText = `
                --y-pos: ${pos.y}px;
                --side: ${pos.side};
                --angle: ${pos.angle}deg;
                --scale: ${pos.scale};
                background-image: url(${this.leafTexture});
                background-size: cover;
            `;

            leafPoints.appendChild(leaf);
            this.components.leaves.push(leaf);
        });
    }

    /**
     * 开始动画序列
     */
    startAnimation() {
        if (this.animationState === 'running') return;

        this.animationState = 'running';
        this.animationStart = performance.now();

        // 花茎生长
        this.animateStem();

        // 花蕊展开
        setTimeout(() => this.animateStamens(), 1000);

        // 花萼展开
        setTimeout(() => this.animateSepals(), 1500);

        // 花瓣展开（从外到内）
        setTimeout(() => this.animatePetals(), 2000);

        // 叶片展开
        setTimeout(() => this.animateLeaves(), 3000);

        // 进度条动画
        this.animateProgress();
    }

    /**
     * 花茎生长动画
     */
    animateStem() {
        const stem = document.getElementById('stemMain');
        stem.style.transition = 'height 4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        stem.style.height = '380px';
    }

    /**
     * 花蕊展开动画
     */
    animateStamens() {
        this.components.stamens.forEach((stamen, i) => {
            const delay = i * 0.05;
            stamen.style.animation = `stamenUnfold 3s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`;
        });
    }

    /**
     * 花萼展开动画
     */
    animateSepals() {
        this.components.sepals.forEach((sepal, i) => {
            const delay = i * 0.1;
            sepal.style.animation = `sepalUnfold 4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`;
        });
    }

    /**
     * 花瓣展开动画（从外到内）
     */
    animatePetals() {
        // 按层从外到内展开
        const sortedPetals = [...this.components.petals].sort((a, b) => b.layer - a.layer);

        sortedPetals.forEach(({ element, layer, index }) => {
            const isOuter = layer >= 4;
            const duration = isOuter ? 7 : 5;
            const delay = (7 - layer) * 0.3 + index * 0.03;

            element.style.animation = `petalBloom${layer + 1} ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`;
        });
    }

    /**
     * 叶片展开动画
     */
    animateLeaves() {
        this.components.leaves.forEach((leaf, i) => {
            const delay = i * 0.4;
            leaf.style.animation = `leafUnfold 5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`;
        });
    }

    /**
     * 进度条动画
     */
    animateProgress() {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.transition = `width ${this.totalDuration}ms linear`;
        progressFill.style.width = '100%';
    }

    /**
     * 绑定控制按钮
     */
    bindControls() {
        document.getElementById('btnRestart').addEventListener('click', () => this.restart());
        document.getElementById('btnToggleLight').addEventListener('click', () => {
            const enabled = window.lightingSystem.toggle();
            document.getElementById('btnToggleLight').textContent = enabled ? '关闭光照' : '开启光照';
        });
    }

    /**
     * 重新播放
     */
    restart() {
        // 重置所有元素
        document.querySelectorAll('.stamen, .sepal, .petal, .leaf').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // 触发重排
        });

        document.getElementById('stemMain').style.height = '0';
        document.getElementById('progressFill').style.transition = 'none';
        document.getElementById('progressFill').style.width = '0%';

        // 重新开始
        setTimeout(() => this.startAnimation(), 100);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.roseBloomController = new RoseBloomController();
    window.roseBloomController.init();
});
