/**
 * 环境配置
 * 请根据实际情况配置云开发环境ID
 */
const ENV_CONFIG = {
  // 云开发环境ID
  // 开发环境：在云开发控制台查看环境ID
  // 生产环境：建议使用独立的环境ID
  cloudEnvId: process.env.WX_CLOUD_ENV_ID || 'your-env-id'
}

module.exports = ENV_CONFIG
