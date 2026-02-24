// cloudfunctions/removeBackground/index.js
const cloud = require('wx-server-sdk')

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 腾讯云人像分割API配置
// 需要在腾讯云控制台申请以下密钥，并配置为云函数环境变量
const TENCENT_CLOUD_CONFIG = {
  // 腾讯云API密钥（从环境变量读取，无默认值以确保安全）
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  // 人像分割API端点
  endpoint: 'iai.tencentcloudapi.com',
  region: 'ap-guangzhou',
  // API版本
  version: '2018-03-01'
}

/**
 * 人像抠图云函数
 * 调用腾讯云人像分割API去除图片背景
 */
exports.main = async (event, context) => {
  const { imageUrl } = event

  // 验证API密钥配置
  if (!TENCENT_CLOUD_CONFIG.secretId || !TENCENT_CLOUD_CONFIG.secretKey) {
    return {
      errCode: -3,
      errMsg: 'API密钥未配置，请设置环境变量 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY'
    }
  }

  if (!imageUrl) {
    return {
      errCode: -1,
      errMsg: '缺少图片URL参数'
    }
  }

  try {
    // 方案1: 调用腾讯云人像分割API（推荐）
    // const result = await callTencentPortraitAPI(imageUrl)
    
    // 方案2: 使用云存储+云函数处理（备选方案）
    // const result = await processWithCloudStorage(imageUrl)
    
    // 临时方案：返回原图（待配置API密钥后启用真实API）
    console.log('人像抠图功能待配置API密钥，当前返回原图')
    
    return {
      errCode: 0,
      errMsg: 'success',
      imageUrl: imageUrl, // 临时返回原图
      // processedUrl: result.processedUrl // 配置API后使用
    }
    
  } catch (error) {
    console.error('人像抠图失败:', error)
    
    return {
      errCode: -2,
      errMsg: '人像抠图失败: ' + error.message,
      imageUrl: imageUrl // 失败时返回原图
    }
  }
}

/**
 * 调用腾讯云人像分割API
 * TODO: 配置密钥后启用此函数
 */
async function callTencentPortraitAPI(imageUrl) {
  const tencentcloud = require('tencentcloud-sdk-nodejs')
  
  // 导入人像分割API
  const IaiClient = tencentcloud.iai.v20180301.Client
  
  // 实例化客户端
  const client = new IaiClient({
    credential: {
      secretId: TENCENT_CLOUD_CONFIG.secretId,
      secretKey: TENCENT_CLOUD_CONFIG.secretKey,
    },
    region: TENCENT_CLOUD_CONFIG.region,
    profile: {
      httpProfile: {
        endpoint: TENCENT_CLOUD_CONFIG.endpoint,
      },
    },
  })
  
  // 调用人像分割接口
  const params = {
    ImageUrl: imageUrl,
    // 可选参数
    // RspImgType: 'base64', // 返回base64格式
  }
  
  const result = await client.SegmentPortraitPic(params)
  
  // 上传处理后的图片到云存储
  const processedUrl = await uploadProcessedPhoto(result.ResultImage)
  
  return {
    processedUrl
  }
}

/**
 * 上传处理后的图片到云存储
 */
async function uploadProcessedPhoto(base64Image) {
  // 将base64转换为Buffer
  const buffer = Buffer.from(base64Image, 'base64')
  
  // 生成文件名
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const cloudPath = 'processed/' + timestamp + '_' + random + '.png'
  
  // 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: cloudPath,
    fileContent: buffer
  })
  
  return uploadResult.fileID
}

/**
 * 备选方案：使用云存储处理
 */
async function processWithCloudStorage(imageUrl) {
  // 下载原图
  const downloadResult = await cloud.downloadFile({
    fileID: imageUrl
  })
  
  const fileContent = downloadResult.fileContent
  
  // TODO: 这里可以使用本地图像处理库进行简单抠图
  // 或者调用其他第三方API
  
  // 临时：直接返回原图
  return {
    processedUrl: imageUrl
  }
}
