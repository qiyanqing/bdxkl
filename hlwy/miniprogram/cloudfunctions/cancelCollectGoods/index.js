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
    if (!user.collections || !user.collections.includes(goodsId)) {
      return {
        success: false,
        message: '没有收藏该物品'
      };
    }
    
    // 从收藏列表中移除
    await db.collection('users').where({
      openid: openid
    }).update({
      data: {
        collections: _.pull(goodsId),
        updatedAt: db.serverDate()
      }
    });
    
    // 更新商品的收藏数量
    await db.collection('goods').doc(goodsId).update({
      data: {
        collectCount: _.inc(-1),
        updatedAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '取消收藏成功'
    };
  } catch (error) {
    console.error('取消收藏失败:', error);
    return {
      success: false,
      message: '取消收藏失败，请稍后重试'
    };
  }
};