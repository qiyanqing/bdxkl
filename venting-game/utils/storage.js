/**
 * 存储工具函数
 */

// 存储我的发泄目标列表
const saveMyTargets = (targets) => {
  try {
    wx.setStorageSync('myTargets', targets)
    return true
  } catch (e) {
    console.error('保存发泄目标失败:', e)
    return false
  }
}

// 获取我的发泄目标列表
const getMyTargets = () => {
  try {
    return wx.getStorageSync('myTargets') || []
  } catch (e) {
    console.error('获取发泄目标失败:', e)
    return []
  }
}

// 保存当前选中的发泄目标
const saveCurrentTarget = (target) => {
  try {
    wx.setStorageSync('currentTarget', target)
    return true
  } catch (e) {
    console.error('保存当前目标失败:', e)
    return false
  }
}

// 获取当前选中的发泄目标
const getCurrentTarget = () => {
  try {
    return wx.getStorageSync('currentTarget') || null
  } catch (e) {
    console.error('获取当前目标失败:', e)
    return null
  }
}

// 清除本次会话统计数据
const clearSessionStats = () => {
  try {
    wx.removeStorageSync('sessionStats')
    return true
  } catch (e) {
    console.error('清除会话统计失败:', e)
    return false
  }
}

// 获取本次会话统计数据
const getSessionStats = () => {
  try {
    return wx.getStorageSync('sessionStats') || {
      totalAttacks: 0,
      attacks: {}
    }
  } catch (e) {
    console.error('获取会话统计失败:', e)
    return {
      totalAttacks: 0,
      attacks: {}
    }
  }
}

// 更新本次会话统计数据
const updateSessionStats = (stats) => {
  try {
    const currentStats = getSessionStats()
    const newStats = { ...currentStats, ...stats }
    wx.setStorageSync('sessionStats', newStats)
    return newStats
  } catch (e) {
    console.error('更新会话统计失败:', e)
    return null
  }
}

module.exports = {
  saveMyTargets,
  getMyTargets,
  saveCurrentTarget,
  getCurrentTarget,
  clearSessionStats,
  getSessionStats,
  updateSessionStats
}
