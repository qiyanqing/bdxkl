// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { _id } = event;
  
  try {
    // 删除地址，确保该地址属于当前用户
    await db.collection('addresses')
      .where({
        _id: _id,
        openid: wxContext.OPENID
      })
      .remove();
    
    return {
      success: true,
      message: '删除地址成功'
    };
  } catch (error) {
    console.error('删除地址失败:', error);
    return {
      success: false,
      message: '删除地址失败',
      error: error.message
    };
  }
};
