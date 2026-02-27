// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    // 这里是 topGoods 云函数的基本实现
    console.log('topGoods 云函数被调用', event);
    
    return {
      success: true,
      message: 'topGoods 云函数调用成功',
      openid: wxContext.OPENID,
      event: event
    };
  } catch (error) {
    console.error('topGoods 云函数执行失败:', error);
    return {
      success: false,
      message: 'topGoods 云函数执行失败',
      error: error.message
    };
  }
};
