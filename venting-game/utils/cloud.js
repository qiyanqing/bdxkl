/**
 * 云开发工具函数
 * 微信云数据库会自动添加 _openid 字段关联当前登录用户
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
 * 获取当前登录用户信息
 * 使用 where({ _openid: db.serverDate() }) 自动匹配当前用户
 */
const getUserInfo = async () => {
  try {
    const db = wx.cloud.database()
    const _ = db.command

    // 使用 _openid 查询当前用户（数据库自动匹配）
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
 * add() 操作会自动添加 _openid 字段
 */
const saveUserInfo = async (userInfo) => {
  try {
    const db = wx.cloud.database()

    // 检查当前用户是否已存在
    const existing = await getUserInfo()

    if (existing) {
      // 更新用户（只能更新自己的数据）
      await db.collection('users').doc(existing._id).update({
        data: {
          ...userInfo,
          updatedAt: db.serverDate()
        }
      })
      return { ...existing, ...userInfo }
    } else {
      // 创建用户（_openid 会自动添加）
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
 * 获取当前用户的所有发泄目标
 * 数据库会自动只返回 _openid 匹配当前用户的数据
 */
const getMyTargets = async () => {
  try {
    const db = wx.cloud.database()

    // 直接查询即可，数据库权限设置会确保只返回当前用户的数据
    const res = await db.collection('targets')
      .orderBy('createdAt', 'desc')
      .get()

    console.log('获取发泄目标:', res.data.length, '条')
    return res.data
  } catch (err) {
    console.error('获取发泄目标失败:', err)
    return []
  }
}

/**
 * 根据ID获取单个目标的最新数据（从数据库）
 */
const getTargetById = async (targetId) => {
  try {
    const db = wx.cloud.database()
    const res = await db.collection('targets').doc(targetId).get()
    return res.data
  } catch (err) {
    console.error('获取目标详情失败:', err)
    return null
  }
}

/**
 * 创建发泄目标
 * _openid 会自动添加为当前用户的 openid
 */
const createTarget = async (target) => {
  try {
    const db = wx.cloud.database()

    const res = await db.collection('targets').add({
      data: {
        ...target,
        createdAt: db.serverDate()
        // _openid 会自动添加
      }
    })

    console.log('创建发泄目标成功:', res._id)
    return { _id: res._id, ...target }
  } catch (err) {
    console.error('创建发泄目标失败:', err)
    throw err
  }
}

/**
 * 更新发泄目标
 * 只能更新 _openid 等于当前用户的数据
 */
const updateTarget = async (targetId, updateData) => {
  try {
    const db = wx.cloud.database()

    await db.collection('targets').doc(targetId).update({
      data: updateData
    })

    console.log('更新发泄目标成功:', targetId)
    return true
  } catch (err) {
    console.error('更新发泄目标失败:', err)
    throw err
  }
}

/**
 * 删除发泄目标
 * 只能删除 _openid 等于当前用户的数据
 */
const deleteTarget = async (targetId) => {
  try {
    const db = wx.cloud.database()

    await db.collection('targets').doc(targetId).remove()

    console.log('删除发泄目标成功:', targetId)
    return true
  } catch (err) {
    console.error('删除发泄目标失败:', err)
    throw err
  }
}

/**
 * 记录攻击
 * _openid 会自动添加为当前用户的 openid
 */
const recordAttack = async (attackData) => {
  try {
    const db = wx.cloud.database()

    const res = await db.collection('attack_records').add({
      data: {
        ...attackData,
        createdAt: db.serverDate()
        // _openid 会自动添加
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
 * 只统计当前用户对指定目标的攻击记录
 */
const getAttackStats = async (targetId) => {
  try {
    const db = wx.cloud.database()

    // 获取总攻击次数（只统计当前用户的记录）
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

/**
 * 更新目标攻击统计（直接更新 targets 集合）
 */
const updateTargetStats = async (targetId, stats) => {
  try {
    const db = wx.cloud.database()

    await db.collection('targets').doc(targetId).update({
      data: {
        'lifetimeStats.totalAttacks': stats.totalAttacks,
        'lifetimeStats.attacks': stats.attacks
      }
    })

    return true
  } catch (err) {
    console.error('更新目标统计失败:', err)
    throw err
  }
}

module.exports = {
  getOpenId,
  getUserInfo,
  saveUserInfo,
  getMyTargets,
  getTargetById,
  createTarget,
  updateTarget,
  deleteTarget,
  recordAttack,
  getAttackStats,
  updateTargetStats
}
