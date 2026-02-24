// pages/create/create.js
const { CARTOON_CHARS } = require('../../config/game.config.js')
const { saveMyTargets, getMyTargets } = require('../../utils/storage.js')
const { generateId, vibrate } = require('../../utils/util.js')

Page({
  data: {
    step: 1,
    gender: '',
    type: '',
    uploadedImageUrl: '',
    processedImageUrl: '',
    selectedCartoonId: '',
    cartoonList: [],
    targetName: '',
    finalImageUrl: '',
    isProcessing: false,
    canNext: false
  },

  onLoad() {
    // 初始化卡通角色列表
    this.setData({
      cartoonList: CARTOON_CHARS.male // 默认显示男性
    })
  },

  /**
   * 步骤1: 选择性别
   */
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    vibrate('light')
    
    this.setData({
      gender,
      cartoonList: CARTOON_CHARS[gender],
      canNext: true
    })
  },

  /**
   * 步骤2: 选择形象来源
   */
  chooseType(e) {
    const type = e.currentTarget.dataset.type
    vibrate('light')
    
    this.setData({
      type,
      canNext: true
    })
  },

  /**
   * 步骤3a: 选择并上传照片
   */
  chooseImage() {
    vibrate('light')
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        
        this.setData({
          uploadedImageUrl: tempFilePath,
          isProcessing: true,
          canNext: false
        })

        // 调用云函数进行抠图处理
        this.processImage(tempFilePath)
      }
    })
  },

  /**
   * 处理图片（抠图）
   */
  processImage(imagePath) {
    // TODO: 调用人像抠图云函数
    // 暂时直接使用原图，后续配置云函数后再替换
    setTimeout(() => {
      this.setData({
        processedImageUrl: imagePath,
        isProcessing: false,
        canNext: true
      })
      
      wx.showToast({
        title: '处理完成',
        icon: 'success'
      })
    }, 1000)
    
    /* 
    // 实际调用云函数的代码（配置好后使用）
    wx.cloud.getTempFileURL({
      fileList: [imagePath]
    }).then(res => {
      const imageUrl = res.fileList[0].tempFileURL
      
      return wx.cloud.callFunction({
        name: 'removeBackground',
        data: { imageUrl }
      })
    }).then(res => {
      this.setData({
        processedImageUrl: res.result.imageUrl,
        isProcessing: false,
        canNext: true
      })
      
      wx.showToast({
        title: '处理完成',
        icon: 'success'
      })
    }).catch(err => {
      console.error('抠图失败:', err)
      this.setData({
        isProcessing: false,
        canNext: true // 失败也允许继续，使用原图
      })
      
      wx.showToast({
        title: '处理失败，使用原图',
        icon: 'none'
      })
      
      // 使用原图
      this.setData({
        processedImageUrl: imagePath
      })
    })
    */
  },

  /**
   * 步骤3b: 选择卡通角色
   */
  selectCartoon(e) {
    const id = e.currentTarget.dataset.id
    vibrate('light')
    
    this.setData({
      selectedCartoonId: id,
      canNext: true
    })
  },

  /**
   * 步骤4: 输入名称
   */
  onNameInput(e) {
    this.setData({
      targetName: e.detail.value,
      canNext: e.detail.value.trim().length > 0
    })
  },

  /**
   * 下一步
   */
  nextStep() {
    if (!this.data.canNext) return
    
    vibrate('light')
    
    // 从步骤3进入步骤4时，设置最终预览图
    if (this.data.step === 3) {
      let finalImageUrl = ''
      if (this.data.type === 'photo') {
        finalImageUrl = this.data.processedImageUrl || this.data.uploadedImageUrl
      } else {
        const cartoon = this.data.cartoonList.find(c => c.id === this.data.selectedCartoonId)
        finalImageUrl = cartoon ? cartoon.preview : ''
      }
      
      this.setData({ finalImageUrl, canNext: false })
    }
    
    // 步骤4完成创建
    if (this.data.step === 4) {
      this.createTarget()
      return
    }
    
    this.setData({
      step: this.data.step + 1,
      canNext: false
    })
  },

  /**
   * 上一步
   */
  prevStep() {
    vibrate('light')
    
    if (this.data.step === 4) {
      // 从步骤4返回步骤3，恢复canNext状态
      let canNext = false
      if (this.data.type === 'photo') {
        canNext = !!this.data.processedImageUrl
      } else {
        canNext = !!this.data.selectedCartoonId
      }
      
      this.setData({
        step: this.data.step - 1,
        canNext
      })
    } else if (this.data.step === 3) {
      this.setData({
        step: this.data.step - 1,
        canNext: true
      })
    } else {
      this.setData({
        step: this.data.step - 1,
        canNext: false
      })
    }
  },

  /**
   * 创建目标
   */
  createTarget() {
    const { gender, type, targetName, finalImageUrl, selectedCartoonId } = this.data
    
    // 构建新的目标对象
    const newTarget = {
      id: generateId(),
      name: targetName.trim(),
      type,
      imageUrl: finalImageUrl,
      cartoonId: type === 'cartoon' ? selectedCartoonId : '',
      gender,
      createdAt: Date.now(),
      lifetimeStats: {
        totalAttacks: 0,
        attacks: {}
      },
      progress: {
        level: 1,
        exp: 0
      }
    }
    
    // 保存到本地
    const targets = getMyTargets()
    targets.push(newTarget)
    saveMyTargets(targets)
    
    wx.showToast({
      title: '创建成功',
      icon: 'success'
    })
    
    // 返回首页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
