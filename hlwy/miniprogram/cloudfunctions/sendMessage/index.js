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
  const { toUserId, goodsId, content, contentType = 'text' } = event;
  
  try {
    // 1. 保存聊天消息（这里简化处理，实际项目中应保存到数据库）
    const message = {
      fromUserId: wxContext.OPENID,
      toUserId: toUserId,
      goodsId: goodsId,
      content: content,
      contentType: contentType,
      read: false,
      createdAt: db.serverDate()
    };
    
    // 2. 更新商品的聊天数量
    if (goodsId) {
      await db.collection('goods').doc(goodsId).update({
        data: {
          chatCount: _.inc(1),
          updatedAt: db.serverDate()
        }
      });
    }
    
    return {
      success: true,
      message: '发送消息成功',
      chat: message
    };
  } catch (error) {
    console.error('sendMessage 云函数执行失败:', error);
    return {
      success: false,
      message: '发送消息失败',
      error: error.message
    };
  }
};
