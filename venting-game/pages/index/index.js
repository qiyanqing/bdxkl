// pages/index/index.js
const { getMyTargets, saveMyTargets, saveCurrentTarget } = require('../../utils/storage.js')
const { vibrate } = require('../../utils/util.js')

Page({
  data: {
    targets: [],
    actionSheetHidden: true,
    selectedTargetId: ''
  },

  onLoad() {
    this.loadTargets()
  },

  onShow() {
    // 每次显示页面时刷新列表
    this.loadTargets()
  },

  /**
   * 加载形象列表
   */
  loadTargets() {
    const targets = getMyTargets()
    this.setData({ targets })
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
    const target = targets.find(t => t.id === targetId)
    
    if (target) {
      wx.showModal({
        title: '编辑名称',
        editable: true,
        placeholderText: '请输入新名称',
        content: target.name,
        success: (res) => {
          if (res.confirm && res.content) {
            const newName = res.content.trim()
            if (newName) {
              target.name = newName
              saveMyTargets(targets)
              this.setData({ targets })
              wx.showToast({
                title: '修改成功',
                icon: 'success'
              })
            }
          }
        }
      })
    }
  },

  /**
   * 删除形象
   */
  deleteTarget(e) {
    const targetId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后该形象的攻击数据也将被清除，确定要删除吗？',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          const targets = this.data.targets.filter(t => t.id !== targetId)
          saveMyTargets(targets)
          this.setData({ targets })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
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
