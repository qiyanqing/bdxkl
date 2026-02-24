// components/spine-view/spine-view.js
/**
 * Spine动画组件
 * 
 * 使用方法：
 * <spine-view
 *   spineData="{{spineData}}"
 *   animation="idle"
 *   loop="{{true}}"
 *   bind:loaded="onSpineLoaded"
 * />
 * 
 * 属性：
 * - spineData: Spine动画数据对象
 * - animation: 当前播放的动画名称
 * - loop: 是否循环播放
 * - scale: 缩放比例，默认1
 * 
 * 事件：
 * - loaded: 动画加载完成
 * - complete: 动画播放完成（非循环时）
 */

Component({
  properties: {
    // Spine动画数据
    spineData: {
      type: Object,
      value: null
    },
    // 动画名称
    animation: {
      type: String,
      value: 'idle'
    },
    // 是否循环
    loop: {
      type: Boolean,
      value: true
    },
    // 缩放比例
    scale: {
      type: Number,
      value: 1
    },
    // 宽度
    width: {
      type: Number,
      value: 300
    },
    // 高度
    height: {
      type: Number,
      value: 400
    }
  },

  data: {
    canvasId: 'spine-canvas',
    ctx: null,
    spineRenderer: null,
    isLoaded: false,
    currentAnimation: 'idle'
  },

  lifetimes: {
    attached() {
      this.initCanvas()
    },

    detached() {
      this.cleanup()
    }
  },

  observers: {
    'spineData': function(spineData) {
      if (spineData && !this.data.isLoaded) {
        this.loadSpine(spineData)
      }
    },
    'animation': function(newAnim) {
      if (newAnim && this.data.isLoaded) {
        this.playAnimation(newAnim, this.data.loop)
      }
    }
  },

  methods: {
    /**
     * 初始化Canvas
     */
    initCanvas() {
      const query = this.createSelectorQuery()
      
      query.select('#spine-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            console.error('Canvas节点获取失败')
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          // 设置Canvas尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = this.data.width * dpr
          canvas.height = this.data.height * dpr
          ctx.scale(dpr, dpr)

          this.setData({ ctx, canvas })
          
          // 如果已有数据，开始加载
          if (this.data.spineData) {
            this.loadSpine(this.data.spineData)
          }
        })
    },

    /**
     * 加载Spine动画
     */
    loadSpine(spineData) {
      // TODO: 集成Spine运行库
      // 当前为占位实现，后续需要引入 @esotericsoftware/spine-canvas
      
      console.log('加载Spine动画:', spineData)
      
      // 模拟加载延迟
      setTimeout(() => {
        this.setData({ 
          isLoaded: true,
          currentAnimation: this.data.animation 
        })
        
        this.triggerEvent('loaded', { animation: this.data.animation })
        this.startRenderLoop()
      }, 100)
      
      /* 
      // 实际实现代码（引入Spine库后使用）
      try {
        // 创建Spine Atlas
        const atlas = new spine.SkeletonAtlas(spineData.atlasText, {
          onLoad(texture) {
            // 加载纹理
            const image = canvas.createImage()
            image.src = spineData.texturePath
            return image
          }
        })
        
        // 创建AtlasLoader
        const atlasLoader = new spine.AtlasAttachmentLoader(atlas)
        
        // 创建SkeletonJson
        const skeletonJson = new spine.SkeletonJson(atlasLoader)
        const skeletonData = skeletonJson.readSkeletonData(spineData.skeletonJson)
        
        // 创建Skeleton
        const skeleton = new spine.Skeleton(skeletonData)
        
        // 设置皮肤
        if (spineData.skin) {
          skeleton.setSkinByName(spineData.skin)
        }
        
        // 创建AnimationState
        const animationState = new spine.AnimationState(spine.AnimationStateData)
        
        // 创建渲染器
        const spineRenderer = new spine.SkeletonRenderer(ctx)
        
        this.setData({ 
          spineRenderer, 
          skeleton, 
          animationState,
          isLoaded: true 
        })
        
        // 播放默认动画
        this.playAnimation(this.data.animation, this.data.loop)
        
        this.triggerEvent('loaded')
        this.startRenderLoop()
        
      } catch (error) {
        console.error('Spine加载失败:', error)
      }
      */
    },

    /**
     * 播放动画
     */
    playAnimation(animationName, loop = true) {
      if (!this.data.isLoaded) {
        console.warn('Spine未加载完成')
        return
      }

      console.log('播放动画:', animationName, '循环:', loop)
      
      this.setData({ currentAnimation: animationName })
      
      /* 
      // 实际实现代码
      const { animationState, spineRenderer, skeleton } = this.data
      
      // 混合动画
      animationState.clearTracks()
      animationState.setAnimation(0, animationName, loop)
      
      // 非循环动画监听完成事件
      if (!loop) {
        animationState.addListener({
          complete: () => {
            this.triggerEvent('complete', { animation: animationName })
          }
        })
      }
      */
    },

    /**
     * 设置皮肤
     */
    setSkin(skinName) {
      console.log('设置皮肤:', skinName)
      
      /* 
      // 实际实现代码
      const { skeleton } = this.data
      if (skeleton) {
        skeleton.setSkinByName(skinName)
        skeleton.setSlotsToSetupPose()
      }
      */
    },

    /**
     * 设置混合模式
     */
    setMix(fromAnimation, toAnimation, duration) {
      /* 
      // 实际实现代码
      const { animationState } = this.data
      if (animationState.data) {
        animationState.data.setMix(fromAnimation, toAnimation, duration)
      }
      */
    },

    /**
     * 开始渲染循环
     */
    startRenderLoop() {
      const render = () => {
        if (!this.data.isLoaded) return

        const { ctx, canvas } = this.data
        if (!ctx || !canvas) return

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        /*
        // 实际渲染代码
        const { spineRenderer, skeleton, animationState, scale } = this.data

        // 更新动画
        const delta = 16 / 1000 // 假设60fps
        animationState.update(delta)
        animationState.apply(skeleton)
        skeleton.updateWorldTransform()

        // 渲染
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.scale(scale, scale)
        spineRenderer.render(skeleton)
        ctx.restore()
        */

        // 临时：绘制占位图
        this.drawPlaceholder(ctx)
      }

      // 使用 setInterval 替代 requestAnimationFrame（微信小程序兼容）
      if (this.renderTimer) {
        clearInterval(this.renderTimer)
      }
      this.renderTimer = setInterval(render, 16) // ~60fps
    },

    /**
     * 绘制占位图
     */
    drawPlaceholder(ctx) {
      const { canvas, currentAnimation } = this.data

      if (!canvas) return

      const dpr = wx.getSystemInfoSync().pixelRatio
      const displayWidth = canvas.width / dpr
      const displayHeight = canvas.height / dpr

      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.scale(dpr, dpr)

      ctx.fillStyle = '#667eea'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Spine动画区域', displayWidth / 2, displayHeight / 2 - 10)
      ctx.font = '14px Arial'
      ctx.fillStyle = '#8892b0'
      ctx.fillText('当前动画: ' + currentAnimation, displayWidth / 2, displayHeight / 2 + 15)

      ctx.restore()
    },

    /**
     * 清理资源
     */
    cleanup() {
      // TODO: 清理Spine资源
      console.log('清理Spine资源')

      // 清理渲染定时器
      if (this.renderTimer) {
        clearInterval(this.renderTimer)
        this.renderTimer = null
      }

      this.setData({
        isLoaded: false,
        spineRenderer: null,
        skeleton: null,
        animationState: null
      })
    }
  }
})
