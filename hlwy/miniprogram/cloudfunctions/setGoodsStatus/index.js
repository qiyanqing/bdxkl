// 云函数入口文件
// 文件路径：cloudfunctions/setGoodsStatus/index.js
// 功能描述：更新商品状态并发送订阅消息通知
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 状态中文映射
const STATUS_MAP = {
  'available': '可交易',
  'reserved': '已预留',
  'sold': '已售出',
  'unavailable': '已下架'
};

/**
 * 发送订阅消息
 */
async function sendSubscribeMessage(touser, templateId, page, data) {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: touser,
      page: page,
      data: data,
      templateId: templateId,
      miniprogramState: 'formal'
    });
    return result;
  } catch (err) {
    // 订阅消息发送失败不影响主流程
    console.error('发送订阅消息失败:', err);
    return null;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { goodsId, status } = event;

  try {
    if (!goodsId || !status) {
      return {
        success: false,
        message: '缺少商品ID或状态参数'
      };
    }

    // 1. 获取商品信息
    const goodsResult = await db.collection('goods').doc(goodsId).get();
    if (!goodsResult.data) {
      return {
        success: false,
        message: '商品不存在'
      };
    }

    const goods = goodsResult.data;

    // 2. 更新商品状态
    const result = await db.collection('goods').doc(goodsId).update({
      data: {
        status: status,
        lastUpdatedAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    // 3. 发送订阅消息通知
    const templateId = 'YOUR_TEMPLATE_ID_STATUS'; // 需替换为实际的模板ID
    const statusText = STATUS_MAP[status] || status;

    // 通知收藏该商品的用户（这里简化处理，实际应查询收藏表）
    const page = `pages/detail/detail?id=${goodsId}`;
    const data = {
      thing1: { value: goods.title || '商品' },
      phrase2: { value: statusText },
      date3: { value: new Date().toLocaleString('zh-CN', { hour12: false }) }
    };

    // 可以在这里添加发送给相关用户的逻辑
    // 例如：发送给卖家（如果不是操作者本人）
    // const sellerOpenid = goods._openid;
    // if (sellerOpenid !== wxContext.OPENID) {
    //   await sendSubscribeMessage(sellerOpenid, templateId, page, data);
    // }

    return {
      success: true,
      message: '商品状态更新成功',
      result: result
    };
  } catch (error) {
    console.error('setGoodsStatus 云函数执行失败:', error);
    return {
      success: false,
      message: '商品状态更新失败',
      error: error.message
    };
  }
};
