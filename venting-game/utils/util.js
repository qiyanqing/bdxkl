/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return ''

  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

/**
 * 震动反馈
 * @param {string} type - 震动类型: 'short' | 'long' | 'light' | 'medium' | 'heavy'
 */
const vibrate = (type = 'short') => {
  try {
    if (type === 'short') {
      wx.vibrateShort()
    } else if (type === 'long') {
      wx.vibrateLong()
    } else {
      // iOS 支持 light, medium, heavy
      wx.vibrateShort({ type })
    }
  } catch (e) {
    console.error('震动反馈失败:', e)
  }
}

/**
 * 生成唯一ID
 * @returns {string} 唯一标识符
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深度克隆对象
 * @param {any} obj - 要克隆的对象
 * @returns {any} 克隆后的对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }

  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

module.exports = {
  formatTime,
  vibrate,
  generateId,
  deepClone
}
