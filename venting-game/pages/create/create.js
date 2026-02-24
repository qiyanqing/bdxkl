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
    console.log('选择性别:', gender)
    vibrate('light')

    this.setData({
      gender,
      cartoonList: CARTOON_CHARS[gender],
      canNext: true  // 选择性别后可以进入步骤2
    })
    console.log('选择性别后 canNext:', this.data.canNext)
  },

  /**
   * 步骤2: 选择形象来源
   */
  chooseType(e) {
    const type = e.currentTarget.dataset.type
    console.log('选择类型:', type)
    vibrate('light')

    this.setData({
      type,
      step: 3,  // 直接进入步骤3
      canNext: false  // 步骤3需要选择具体角色或上传照片
    })
    console.log('选择类型后 step:', this.data.step, 'canNext:', this.data.canNext)
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
        try {
          const tempFilePath = res.tempFiles[0].tempFilePath

          this.setData({
            uploadedImageUrl: tempFilePath,
            isProcessing: true,
            canNext: false
          })

          // 调用云函数进行抠图处理
          this.processImage(tempFilePath)
        } catch (err) {
          console.error('选择图片失败:', err)
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('选择图片取消或失败:', err)
      }
    })
  },

  /**
   * 处理图片（抠图）
   * 添加完整的错误处理
   */
  processImage(imagePath) {
    this.setData({ isProcessing: true })

    try {
      // TODO: 调用人像抠图云函数
      // 暂时直接使用原图，后续配置云函数后再替换
      const timeout = setTimeout(() => {
        try {
          this.setData({
            processedImageUrl: imagePath,
            isProcessing: false,
            canNext: true
          })

          wx.showToast({
            title: '处理完成',
            icon: 'success'
          })
        } catch (err) {
          console.error('更新UI状态失败:', err)
          this.handleImageProcessError(imagePath)
        }
      }, 1000)

      // 保存timeout引用用于清理
      this.imageProcessTimeout = timeout

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
        this.handleImageProcessError(imagePath)
      })
      */
    } catch (err) {
      console.error('处理图片时发生错误:', err)
      this.handleImageProcessError(imagePath)
    }
  },

  /**
   * 处理图片处理错误
   */
  handleImageProcessError(fallbackImagePath) {
    try {
      this.setData({
        isProcessing: false,
        canNext: true,
        processedImageUrl: fallbackImagePath
      })

      wx.showToast({
        title: '使用原图',
        icon: 'none'
      })
    } catch (err) {
      console.error('错误恢复失败:', err)
    }
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
      let finalEmoji = ''
      try {
        if (this.data.type === 'photo') {
          finalImageUrl = this.data.processedImageUrl || this.data.uploadedImageUrl
        } else {
          const cartoon = this.data.cartoonList.find(c => c.id === this.data.selectedCartoonId)
          finalEmoji = cartoon ? cartoon.emoji : ''
          // 使用 emoji 作为 imageUrl
          finalImageUrl = finalEmoji
        }

        this.setData({ finalImageUrl, finalEmoji, canNext: false })
      } catch (err) {
        console.error('设置预览图失败:', err)
        wx.showToast({
          title: '设置预览图失败',
          icon: 'none'
        })
        return
      }
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
      try {
        if (this.data.type === 'photo') {
          canNext = !!this.data.processedImageUrl
        } else {
          canNext = !!this.data.selectedCartoonId
        }

        this.setData({
          step: this.data.step - 1,
          canNext
        })
      } catch (err) {
        console.error('返回步骤失败:', err)
        this.setData({
          step: this.data.step - 1,
          canNext: false
        })
      }
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
   * 页面卸载时清理定时器
   */
  onUnload() {
    if (this.imageProcessTimeout) {
      clearTimeout(this.imageProcessTimeout)
    }
  },

  /**
   * 创建目标
   */
  createTarget() {
    try {
      const { gender, type, targetName, finalImageUrl, selectedCartoonId } = this.data

      // 验证必需数据
      if (!targetName || !targetName.trim()) {
        wx.showToast({
          title: '请输入名称',
          icon: 'none'
        })
        return
      }

      if (!finalImageUrl) {
        wx.showToast({
          title: '请选择形象',
          icon: 'none'
        })
        return
      }

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
    } catch (err) {
      console.error('创建目标失败:', err)
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
    }
  }
})
