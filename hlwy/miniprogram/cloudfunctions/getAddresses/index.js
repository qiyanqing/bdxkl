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
    // 查询当前用户的所有地址
    const result = await db.collection('addresses')
      .where({
        openid: wxContext.OPENID
      })
      .get();
    
    return {
      success: true,
      message: '获取地址列表成功',
      data: result.data
    };
  } catch (error) {
    console.error('获取地址列表失败:', error);
    return {
      success: false,
      message: '获取地址列表失败',
      error: error.message
    };
  }
};
