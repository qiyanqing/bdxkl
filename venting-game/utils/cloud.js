/**
 * 云开发工具函数
 */

/**
 * 获取用户 openid
 */
const getOpenId = async () => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'login'
    })
    return res.result.openid
  } catch (err) {
    console.error('获取openid失败:', err)
    return null
  }
}

/**
 * 获取用户信息
 */
const getUserInfo = async () => {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('users').limit(1).get()
    if (res.data.length > 0) {
      return res.data[0]
    }
    return null
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return null
  }
}

/**
 * 创建/更新用户信息
 */
const saveUserInfo = async (userInfo) => {
  try {
    const db = wx.cloud.database()
    const _ = db.command

    // 检查用户是否存在
    const existing = await getUserInfo()
    const now = new Date()

    if (existing) {
      // 更新用户
      await db.collection('users').doc(existing._id).update({
        data: {
          ...userInfo,
          updatedAt: db.serverDate()
        }
      })
      return { ...existing, ...userInfo }
    } else {
      // 创建用户
      const res = await db.collection('users').add({
        data: {
          ...userInfo,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
      return { _id: res._id, ...userInfo }
    }
  } catch (err) {
    console.error('保存用户信息失败:', err)
    throw err
  }
}

/**
 * 获取用户的所有发泄目标
 */
const getMyTargets = async () => {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('targets').orderBy('createdAt', 'desc').get()
    return res.data
  } catch (err) {
    console.error('获取发泄目标失败:', err)
    return []
  }
}

/**
 * 创建发泄目标
 */
const createTarget = async (target) => {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('targets').add({
      data: {
        ...target,
        createdAt: db.serverDate()
      }
    })
    return { _id: res._id, ...target }
  } catch (err) {
    console.error('创建发泄目标失败:', err)
    throw err
  }
}

/**
 * 更新发泄目标
 */
const updateTarget = async (targetId, updateData) => {
  try {
    const db = wx.cloud.database()
    await db.collection('targets').doc(targetId).update({
      data: updateData
    })
    return true
  } catch (err) {
    console.error('更新发泄目标失败:', err)
    throw err
  }
}

/**
 * 删除发泄目标
 */
const deleteTarget = async (targetId) => {
  try {
    const db = wx.cloud.database()
    await db.collection('targets').doc(targetId).remove()
    return true
  } catch (err) {
    console.error('删除发泄目标失败:', err)
    throw err
  }
}

/**
 * 记录攻击
 */
const recordAttack = async (attackData) => {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('attack_records').add({
      data: {
        ...attackData,
        createdAt: db.serverDate()
      }
    })
    return res._id
  } catch (err) {
    console.error('记录攻击失败:', err)
    throw err
  }
}

/**
 * 获取攻击统计
 */
const getAttackStats = async (targetId) => {
  try {
    const db = wx.cloud.database()
    const _ = db.command

    // 获取总攻击次数
    const countRes = await db.collection('attack_records')
      .where({ targetId })
      .count()

    // 获取各技能使用次数
    const res = await db.collection('attack_records')
      .where({ targetId })
      .field({ skillId: true })
      .get()

    const attacks = {}
    res.data.forEach(record => {
      attacks[record.skillId] = (attacks[record.skillId] || 0) + 1
    })

    return {
      totalAttacks: countRes.total,
      attacks
    }
  } catch (err) {
    console.error('获取攻击统计失败:', err)
    return { totalAttacks: 0, attacks: {} }
  }
}

module.exports = {
  getOpenId,
  getUserInfo,
  saveUserInfo,
  getMyTargets,
  createTarget,
  updateTarget,
  deleteTarget,
  recordAttack,
  getAttackStats
}
