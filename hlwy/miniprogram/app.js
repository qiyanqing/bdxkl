// app.js
// 文件路径：app.js
// 功能描述：小程序入口文件，包含登录状态管理
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-8gu8ciol755aa7bb',
      traceUser: true
    })

    // 获取系统信息
    wx.getSystemInfo({
      success: res => {
        this.globalData.systemInfo = res;
      }
    });
  },

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.globalData.userInfo;
  },

  /**
   * 检查登录状态，未登录则跳转个人中心
   * @returns {boolean} 是否已登录
   */
  requireLogin() {
    if (!this.isLoggedIn()) {
      wx.showModal({
        title: '温馨提示',
        content: '请先登录后再进行此操作',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/user/user'
            });
          }
        }
      });
      return false;
    }
    return true;
  },

  /**
   * 设置用户信息
   * @param {Object} userInfo - 用户信息
   */
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
  },

  /**
   * 清除用户信息（退出登录）
   */
  clearUserInfo() {
    this.globalData.userInfo = null;
    this.globalData.addresses = [];
    this.globalData.defaultAddress = null;
  },

  globalData: {
    userInfo: null,
    addresses: [],
    defaultAddress: null,
    systemInfo: null
  }
});
