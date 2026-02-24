// app.js
const ENV_CONFIG = require('./config/env.config.js')

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: ENV_CONFIG.cloudEnvId,
        traceUser: true
      })
    }

    // 获取用户openid
    this.getOpenid()
  },

  getOpenid() {
    const that = this
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      that.globalData.openid = res.result.openid
    }).catch(err => {
      console.error('获取openid失败:', err)
    })
  },

  globalData: {
    openid: null,
    currentTarget: null,
    currentSession: {
      userOpenid: null,
      currentTargetId: null,
      sessionStats: {
        totalAttacks: 0,
        attacks: {},
        startTime: Date.now()
      }
    },
    myTargets: []
  }
})
