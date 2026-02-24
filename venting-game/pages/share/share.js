// pages/share/share.js
const { SKILL_CONFIG } = require('../../config/game.config.js')
const { getCurrentTarget, getSessionStats, clearSessionStats } = require('../../utils/storage.js')
const { formatTime } = require('../../utils/util.js')

Page({
  data: {
    currentTarget: null,
    sessionStats: null,
    topSkills: [],
    summaryText: '',
    isGenerating: false,
    posterUrl: ''
  },

  onLoad() {
    const target = getCurrentTarget()
    const sessionStats = getSessionStats()
    
    if (!target) {
      wx.showToast({
        title: '请先选择形象',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({
      currentTarget: target,
      sessionStats
    })

    // 生成统计信息
    this.generateStats()
    
    // 生成海报
    this.generatePoster()
  },

  /**
   * 生成统计信息
   */
  generateStats() {
    const { sessionStats } = this.data
    const attacks = sessionStats.attacks || {}
    
    // 按使用次数排序
    const sortedSkills = Object.entries(attacks)
      .map(([skillId, count]) => ({
        skillId,
        name: SKILL_CONFIG[skillId]?.name || skillId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // 只显示前5
    
    // 计算百分比
    const maxCount = sortedSkills[0]?.count || 1
    const topSkills = sortedSkills.map(skill => ({
      ...skill,
      percent: Math.round((skill.count / maxCount) * 100)
    }))
    
    // 生成总结文案
    const totalCount = sessionStats.totalAttacks || 0
    let summaryText = ''
    
    if (totalCount >= 100) {
      summaryText = '你也太狠了！角色已经熟了'
    } else if (totalCount >= 50) {
      summaryText = '发泄得差不多了，感觉好点了吗？'
    } else if (totalCount >= 20) {
      summaryText = '继续加油，把压力都释放出来！'
    } else {
      summaryText = '才刚开始呢，再接再厉！'
    }
    
    this.setData({
      topSkills,
      summaryText
    })
  },

  /**
   * 生成分享海报
   */
  async generatePoster() {
    this.setData({ isGenerating: true })
    
    try {
      // 获取Canvas上下文
      const canvas = await this.getCanvasContext()
      if (!canvas) {
        throw new Error('Canvas初始化失败')
      }
      
      const { ctx, width, height } = canvas
      
      // 绘制海报背景
      this.drawBackground(ctx, width, height)
      
      // 绘制标题
      this.drawTitle(ctx, width)
      
      // 绘制形象
      await this.drawTarget(ctx, width)
      
      // 绘制统计信息
      this.drawStats(ctx, width)
      
      // 绘制小程序码（TODO: 需要配置真实小程序码）
      this.drawQRCode(ctx, width, height)
      
      // 导出图片
      const posterUrl = await this.exportImage(canvas)
      
      this.setData({
        posterUrl,
        isGenerating: false
      })
      
    } catch (error) {
      console.error('生成海报失败:', error)
      this.setData({ isGenerating: false })
      
      wx.showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    }
  },

  /**
   * 获取Canvas上下文
   */
  getCanvasContext() {
    return new Promise((resolve) => {
      const query = this.createSelectorQuery()
      
      query.select('#poster-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) {
            resolve(null)
            return
          }
          
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = 270 * dpr
          canvas.height = 480 * dpr
          ctx.scale(dpr, dpr)
          
          resolve({
            canvas,
            ctx,
            width: 270,
            height: 480
          })
        })
    })
  },

  /**
   * 绘制背景
   */
  drawBackground(ctx, width, height) {
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  },

  /**
   * 绘制标题
   */
  drawTitle(ctx, width) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('发泄解压报告', width / 2, 40)
  },

  /**
   * 绘制形象（占位实现）
   */
  async drawTarget(ctx, width) {
    const { currentTarget } = this.data
    
    // TODO: 绘制真实形象图片
    // 当前使用占位圆形
    
    ctx.save()
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)'
    ctx.beginPath()
    ctx.arc(width / 2, 150, 60, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制形象名称
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(currentTarget.name, width / 2, 240)
    
    ctx.restore()
    
    /* 
    // 实际实现代码
    try {
      const image = canvas.createImage()
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = currentTarget.imageUrl
      })
      
      ctx.drawImage(image, width / 2 - 50, 100, 100, 100)
    } catch (error) {
      console.error('加载形象图片失败:', error)
    }
    */
  },

  /**
   * 绘制统计信息
   */
  drawStats(ctx, width) {
    const { topSkills, sessionStats } = this.data
    
    ctx.save()
    ctx.textAlign = 'left'
    
    // 绘制技能统计
    let y = 290
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('攻击统计', 30, y)
    
    y += 30
    topSkills.slice(0, 3).forEach((skill, index) => {
      ctx.fillStyle = '#ccd6f6'
      ctx.font = '14px sans-serif'
      ctx.fillText(`${skill.name} x${skill.count}`, 30, y)
      
      // 绘制进度条
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(150, y - 10, 100, 8)
      
      ctx.fillStyle = '#667eea'
      ctx.fillRect(150, y - 10, skill.percent, 8)
      
      y += 30
    })
    
    // 总计
    y += 20
    ctx.fillStyle = '#667eea'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText(`总计攻击 ${sessionStats.totalAttacks} 次`, 30, y)
    
    ctx.restore()
  },

  /**
   * 绘制小程序码（占位）
   */
  drawQRCode(ctx, width, height) {
    ctx.save()
    
    // TODO: 绘制真实小程序码
    // 当前使用占位框
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(width / 2 - 40, height - 80, 80, 80)
    
    ctx.fillStyle = '#8892b0'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('扫码来解压', width / 2, height - 50)
    
    ctx.restore()
    
    /* 
    // 实际实现代码
    try {
      const qrImage = canvas.createImage()
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve
        qrImage.onerror = reject
        qrImage.src = '/assets/images/qrcode.png'
      })
      
      ctx.drawImage(qrImage, width / 2 - 40, height - 80, 80, 80)
    } catch (error) {
      console.error('加载小程序码失败:', error)
    }
    */
  },

  /**
   * 导出图片
   */
  exportImage({ canvas }) {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: reject
      })
    })
  },

  /**
   * 保存到相册
   */
  saveToAlbum() {
    const { posterUrl } = this.data
    
    if (!posterUrl) {
      wx.showToast({
        title: '海报生成中，请稍候',
        icon: 'none'
      })
      return
    }
    
    // 请求相册权限
    wx.saveImageToPhotosAlbum({
      filePath: posterUrl,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        })
      },
      fail: (err) => {
        if (err.errMsg.includes('auth')) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 返回继续攻击
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 分享给好友
   */
  onShareAppMessage() {
    const { currentTarget, sessionStats } = this.data
    
    return {
      title: `我在发泄小游戏里攻击了${currentTarget.name} ${sessionStats.totalAttacks}次！`,
      path: '/pages/index/index',
      imageUrl: this.data.posterUrl || ''
    }
  }
})
