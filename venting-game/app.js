// app.js
const ENV_CONFIG = require('./config/env.config.js')
const { getOpenId, getUserInfo, saveUserInfo } = require('./utils/cloud.js')

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

    // 初始化登录
    this.initLogin()
  },

  async initLogin() {
    try {
      wx.showLoading({ title: '登录中...', mask: true })

      // 获取 openid
      const openid = await getOpenId()
      if (!openid) {
        console.error('获取openid失败')
        wx.hideLoading()
        return
      }

      console.log('获取 openid 成功:', openid)
      this.globalData.openid = openid

      // 获取用户信息
      let userInfo = await getUserInfo()

      if (!userInfo) {
        console.log('首次登录，创建用户')
        // 首次登录，创建用户
        userInfo = await saveUserInfo({
          nickname: '小卡拉' + Math.floor(Math.random() * 10000),
          avatarUrl: ''
        })
      }

      this.globalData.userInfo = userInfo
      console.log('登录成功:', userInfo)
      wx.hideLoading()

    } catch (err) {
      console.error('登录失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    }
  },

  globalData: {
    openid: null,
    userInfo: null,
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
