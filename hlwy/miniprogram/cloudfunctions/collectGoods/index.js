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
  const { goodsId } = event;
  
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
    
    // 检查是否已经收藏
    if (user.collections && user.collections.includes(goodsId)) {
      return {
        success: false,
        message: '已经收藏过该物品'
      };
    }
    
    // 添加到收藏列表
    await db.collection('users').where({
      openid: openid
    }).update({
      data: {
        collections: _.push(goodsId),
        updatedAt: db.serverDate()
      }
    });
    
    // 更新商品的收藏数量
    await db.collection('goods').doc(goodsId).update({
      data: {
        collectCount: _.inc(1),
        updatedAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '收藏成功'
    };
  } catch (error) {
    console.error('收藏物品失败:', error);
    return {
      success: false,
      message: '收藏物品失败，请稍后重试'
    };
  }
};