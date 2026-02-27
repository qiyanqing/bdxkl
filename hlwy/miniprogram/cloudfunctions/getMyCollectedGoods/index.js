// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { page = 1, limit = 10 } = event;
  
  try {
    // 查询用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    const user = userResult.data[0];
    
    // 如果用户没有收藏，返回空列表
    if (!user.collections || user.collections.length === 0) {
      return {
        success: true,
        goodsList: [],
        total: 0
      };
    }
    
    // 查询收藏的物品
    const goodsResult = await db.collection('goods')
      .where({
        _id: _.in(user.collections),
        status: 'available'
      })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    
    return {
      success: true,
      goodsList: goodsResult.data,
      total: user.collections.length
    };
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return {
      success: false,
      message: '获取收藏列表失败，请稍后重试'
    };
  }
};