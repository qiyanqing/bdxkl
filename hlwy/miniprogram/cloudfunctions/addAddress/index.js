// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { address } = event;
  
  try {
    // 如果是默认地址，先取消其他地址的默认状态
    if (address.isDefault) {
      await db.collection('addresses')
        .where({
          openid: wxContext.OPENID
        })
        .update({
          data: {
            isDefault: false
          }
        });
    }
    
    // 添加地址
    const result = await db.collection('addresses').add({
      data: {
        ...address,
        openid: wxContext.OPENID,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '添加地址成功',
      _id: result._id
    };
  } catch (error) {
    console.error('添加地址失败:', error);
    return {
      success: false,
      message: '添加地址失败',
      error: error.message
    };
  }
};
