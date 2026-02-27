// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { goodsId, ...updateData } = event;
  
  try {
    if (!goodsId) {
      return {
        success: false,
        message: '缺少商品ID'
      };
    }
    
    // 更新商品信息，并同步更新lastUpdatedAt字段
    const result = await db.collection('goods').doc(goodsId).update({
      data: {
        ...updateData,
        lastUpdatedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '商品更新成功',
      result: result
    };
  } catch (error) {
    console.error('updateGoods 云函数执行失败:', error);
    return {
      success: false,
      message: '商品更新失败',
      error: error.message
    };
  }
};
