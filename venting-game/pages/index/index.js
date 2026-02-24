// pages/index/index.js
const { getMyTargets, updateTarget, deleteTarget } = require('../../utils/cloud.js')
const { saveCurrentTarget } = require('../../utils/storage.js')
const { vibrate } = require('../../utils/util.js')

Page({
  data: {
    targets: [],
    actionSheetHidden: true,
    selectedTargetId: '',
    isLoading: false
  },

  onLoad() {
    this.loadTargets()
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadTargets()
  },

  /**
   * 加载形象列表（从云数据库）
   */
  async loadTargets() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const targets = await getMyTargets()
      this.setData({ targets })
    } catch (err) {
      console.error('加载失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 选择形象进入攻击场景
   */
  selectTarget(e) {
    const target = e.currentTarget.dataset.target
    saveCurrentTarget(target)

    // 震动反馈
    vibrate('light')

    wx.navigateTo({
      url: '/pages/attack/attack'
    })
  },

  /**
   * 长按显示操作菜单
   */
  showMenu(e) {
    const targetId = e.currentTarget.dataset.id
    this.setData({
      selectedTargetId: targetId,
      actionSheetHidden: false
    })
    vibrate('medium')
  },

  /**
   * 操作菜单关闭
   */
  actionSheetChange() {
    this.setData({
      actionSheetHidden: true,
      selectedTargetId: ''
    })
  },

  /**
   * 编辑形象名称
   */
  editTarget(e) {
    const targetId = e.currentTarget.dataset.id
    const targets = this.data.targets
    const targetIndex = targets.findIndex(t => t._id === targetId)
    const target = targets[targetIndex]

    if (target && targetIndex > -1) {
      wx.showModal({
        title: '编辑名称',
        editable: true,
        placeholderText: '请输入新名称',
        content: target.name,
        success: async (res) => {
          if (res.confirm && res.content) {
            const newName = res.content.trim()
            if (newName) {
              try {
                wx.showLoading({ title: '保存中...' })
                await updateTarget(targetId, { name: newName })

                // 更新本地数据
                const updatedTargets = [...targets]
                updatedTargets[targetIndex] = {
                  ...target,
                  name: newName
                }
                this.setData({ targets: updatedTargets })

                wx.hideLoading()
                wx.showToast({
                  title: '修改成功',
                  icon: 'success'
                })
              } catch (err) {
                wx.hideLoading()
                wx.showToast({
                  title: '修改失败',
                  icon: 'none'
                })
              }
            }
          }
        }
      })
    }
  },

  /**
   * 删除形象
   */
  deleteTargetConfirm(e) {
    const targetId = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '删除后该形象的攻击数据也将被清除，确定要删除吗？',
      confirmColor: '#ff6b6b',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })
            await deleteTarget(targetId)

            // 从本地数据中移除
            const targets = this.data.targets.filter(t => t._id !== targetId)
            this.setData({ targets })

            wx.hideLoading()
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
          } catch (err) {
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  /**
   * 跳转到创建页面
   */
  goToCreate() {
    vibrate('light')
    wx.navigateTo({
      url: '/pages/create/create'
    })
  }
})
