// pages/attack/attack.js
const { SKILL_CONFIG, SKILL_CATEGORIES, SHARE_THRESHOLD } = require('../../config/game.config.js')
const { getCurrentTarget } = require('../../utils/storage.js')
const { recordAttack, updateTargetStats } = require('../../utils/cloud.js')
const { vibrate } = require('../../utils/util.js')

Page({
  data: {
    currentTarget: null,
    sessionStats: {
      totalAttacks: 0,
      attacks: {}
    },

    // Spine相关
    spineData: null,
    currentAnimation: 'idle',
    animationLoop: true,
    spineScale: 1,
    spineWidth: 300,
    spineHeight: 400,

    // 伤害飘字
    damageNumbers: [],

    // 技能分类
    skillCategories: [
      { key: 'physical', name: '物理攻击' },
      { key: 'item', name: '道具攻击' },
      { key: 'magic', name: '魔法攻击' },
      { key: 'speech', name: '言语攻击' }
    ],
    currentCategory: 'physical',

    // 当前分类的技能列表
    currentSkills: [],

    // 技能CD状态
    skillCdState: {},
    // CD定时器引用（用于清理）
    cdTimers: {},
    // 动画定时器引用
    animationTimeouts: [],
    // 伤害飘字定时器引用
    damageTimers: [],

    // 分享弹窗
    showShareModal: false,
    milestoneText: ''
  },

  onLoad() {
    // 加载当前目标
    const target = getCurrentTarget()
    if (!target) {
      wx.showToast({
        title: '请先选择形象',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 初始化会话统计（新会话从0开始）
    const sessionStats = {
      totalAttacks: 0,
      attacks: {}
    }

    this.setData({
      currentTarget: target,
      sessionStats
    })

    // 加载技能列表
    this.loadSkills('physical')

    // TODO: 加载Spine动画数据
    // this.loadSpineData(target)
  },

  onShow() {
    // 每次显示时不需要刷新统计，使用本地会话数据即可
  },

  /**
   * 页面卸载时清理所有定时器
   */
  onUnload() {
    // 清理所有CD定时器
    Object.values(this.data.cdTimers).forEach(timer => {
      clearInterval(timer)
    })

    // 清理所有动画定时器
    this.data.animationTimeouts.forEach(timeout => {
      clearTimeout(timeout)
    })

    // 清理所有伤害飘字定时器
    this.data.damageTimers.forEach(timeout => {
      clearTimeout(timeout)
    })
  },

  /**
   * Spine加载完成
   */
  onSpineLoaded(e) {
    console.log('Spine动画加载完成', e)
  },

  /**
   * 动画播放完成
   */
  onAnimationComplete(e) {
    console.log('动画播放完成', e)
    // 非循环动画播放完成后，回到待机状态
    this.setData({
      currentAnimation: 'idle',
      animationLoop: true
    })
  },

  /**
   * 加载Spine动画数据
   */
  loadSpineData(target) {
    // TODO: 根据目标加载对应的Spine动画数据
    const spineData = {
      // 骨骼数据
      skeletonJson: {},
      // 图集数据
      atlasText: '',
      // 纹理路径
      texturePath: '',
      // 皮肤名称
      skin: target.gender === 'male' ? 'male' : 'female'
    }

    this.setData({ spineData })
  },

  /**
   * 切换技能分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    vibrate('light')

    this.setData({ currentCategory: category })
    this.loadSkills(category)
  },

  /**
   * 加载指定分类的技能
   */
  loadSkills(category) {
    const categoryConfig = SKILL_CATEGORIES[category]
    const skills = categoryConfig.skills.map(skillId => {
      const skill = SKILL_CONFIG[skillId]
      return {
        ...skill,
        isInCd: false,
        cdRemaining: 0,
        cdPercent: 0
      }
    })

    this.setData({ currentSkills: skills })
  },

  /**
   * 使用技能
   */
  useSkill(e) {
    const skill = e.currentTarget.dataset.skill

    // 检查CD
    if (skill.isInCd) {
      wx.showToast({
        title: '技能冷却中',
        icon: 'none'
      })
      return
    }

    // 触发震动反馈
    this.triggerVibrate(skill.damage)

    // 更新动画
    this.playHitAnimation(skill.damage)

    // 显示伤害飘字
    this.showDamageNumber(skill.damage, skill.category)

    // 更新统计数据
    this.updateStats(skill.id, skill.damage)

    // 启动技能CD
    this.startSkillCd(skill.id, skill.cd)
  },

  /**
   * 触发震动反馈
   */
  triggerVibrate(damage) {
    if (damage >= 70) {
      vibrate('heavy')
    } else if (damage >= 40) {
      vibrate('medium')
    } else {
      vibrate('short')
    }
  },

  /**
   * 播放受击动画
   */
  playHitAnimation(damage) {
    let animation = 'hit_light'

    if (damage >= 70) {
      animation = 'hit_heavy'
    } else if (damage >= 40) {
      animation = 'hit_medium'
    }

    this.setData({
      currentAnimation: animation,
      animationLoop: false
    })

    // 2秒后自动回到待机状态，保存timeout引用用于清理
    const timeout = setTimeout(() => {
      this.setData({
        currentAnimation: 'idle',
        animationLoop: true
      })
    }, 2000)

    this.data.animationTimeouts.push(timeout)
  },

  /**
   * 显示伤害飘字
   */
  showDamageNumber(damage, category) {
    const isCrit = Math.random() < 0.15 // 15%暴击率
    const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage

    const damageItem = {
      id: generateId(),
      damage: finalDamage,
      x: 100 + Math.random() * 100,
      y: 200 + Math.random() * 50,
      opacity: 1,
      isCrit
    }

    this.data.damageNumbers.push(damageItem)
    this.setData({ damageNumbers: this.data.damageNumbers })

    // 1秒后移除飘字，保存timeout引用
    const timeout = setTimeout(() => {
      const index = this.data.damageNumbers.findIndex(d => d.id === damageItem.id)
      if (index > -1) {
        this.data.damageNumbers.splice(index, 1)
        this.setData({ damageNumbers: this.data.damageNumbers })
      }
    }, 1000)

    this.data.damageTimers.push(timeout)
  },

  /**
   * 更新统计数据（使用云数据库）
   */
  async updateStats(skillId, damage) {
    try {
      // 1. 记录攻击到云数据库（_openid 会自动添加）
      await recordAttack({
        targetId: this.data.currentTarget._id,
        skillId,
        damage,
        isCrit: damage > 50 // 伤害超过50算暴击
      })

      // 2. 更新会话统计（本地显示用）
      const sessionStats = { ...this.data.sessionStats }
      sessionStats.totalAttacks += 1
      sessionStats.attacks[skillId] = (sessionStats.attacks[skillId] || 0) + 1
      this.setData({ sessionStats })

      // 3. 更新目标的终身统计到云数据库
      const target = this.data.currentTarget
      const newStats = {
        totalAttacks: (target.lifetimeStats?.totalAttacks || 0) + 1,
        attacks: {
          ...target.lifetimeStats?.attacks,
          [skillId]: (target.lifetimeStats?.attacks?.[skillId] || 0) + 1
        }
      }

      await updateTargetStats(target._id, newStats)

      // 4. 更新本地显示的数据
      const updatedTarget = {
        ...target,
        lifetimeStats: newStats
      }
      this.setData({ currentTarget: updatedTarget })

      // 检查是否触发分享
      this.checkShareTrigger(skillId)

    } catch (err) {
      console.error('更新统计数据失败:', err)
    }
  },

  /**
   * 检查是否触发分享
   */
  checkShareTrigger(skillId) {
    const sessionStats = this.data.sessionStats

    // 检查单技能次数
    if (sessionStats.attacks[skillId] === SHARE_THRESHOLD.perSkill) {
      this.showShareModal(`使用 ${SKILL_CONFIG[skillId].name} 达到 ${SHARE_THRESHOLD.perSkill} 次！`)
      return
    }

    // 检查总攻击次数
    if (sessionStats.totalAttacks === SHARE_THRESHOLD.perTotal) {
      this.showShareModal(`总攻击次数达到 ${SHARE_THRESHOLD.perTotal} 次！`)
      return
    }
  },

  /**
   * 启动技能CD
   */
  startSkillCd(skillId, cd) {
    if (cd <= 0) return

    const now = Date.now()
    const endTime = now + cd

    // 更新CD状态
    this.setData({
      [`skillCdState.${skillId}`]: endTime
    })

    // 更新技能列表显示
    this.updateSkillCdDisplay(skillId, cd)

    // 启动CD计时器，保存引用用于清理
    const timer = setInterval(() => {
      const remaining = endTime - Date.now()

      if (remaining <= 0) {
        clearInterval(timer)
        delete this.data.cdTimers[skillId]
        this.updateSkillCdDisplay(skillId, 0)
      } else {
        this.updateSkillCdDisplay(skillId, remaining)
      }
    }, 200) // 增加检查间隔到200ms，减少性能开销

    this.data.cdTimers[skillId] = timer
  },

  /**
   * 更新技能CD显示
   */
  updateSkillCdDisplay(skillId, remaining) {
    const skills = this.data.currentSkills.map(skill => {
      if (skill.id === skillId) {
        const isInCd = remaining > 0
        const cdRemaining = Math.ceil(remaining / 1000)
        // 直接使用Math.floor计算百分比，移除isInteger函数
        const cdPercent = Math.max(0, Math.min(100, Math.floor(remaining / 10)))

        return {
          ...skill,
          isInCd,
          cdRemaining,
          cdPercent
        }
      }
      return skill
    })

    this.setData({ currentSkills: skills })
  },

  /**
   * 显示分享弹窗
   */
  showShareModal(text) {
    vibrate('medium')
    this.setData({
      milestoneText: text,
      showShareModal: true
    })
  },

  /**
   * 关闭分享弹窗
   */
  closeShareModal() {
    this.setData({ showShareModal: false })
  },

  /**
   * 立即分享
   */
  shareNow() {
    wx.navigateTo({
      url: '/pages/share/share'
    })
  },

  /**
   * 跳转到分享页面
   */
  goToShare() {
    vibrate('light')
    wx.navigateTo({
      url: '/pages/share/share'
    })
  }
})
