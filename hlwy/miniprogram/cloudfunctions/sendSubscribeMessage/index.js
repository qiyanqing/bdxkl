// sendSubscribeMessage/index.js
// 文件路径：cloudfunctions/sendSubscribeMessage/index.js
// 功能描述：发送订阅消息通知用户交易状态变更
// 创建日期：2026-01-28
// 版本：1.0.0

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * 发送订阅消息
 * @param {string} touser - 接收者openid
 * @param {string} templateId - 模板ID
 * @param {string} page - 点击消息跳转的页面
 * @param {object} data - 模板数据
 * @param {string} miniprogramState - 小程序状态：developer为开发版；trial为体验版；formal为正式版，默认为正式版
 */
async function sendSubscribe(touser, templateId, page, data, miniprogramState = 'formal') {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: touser,
      page: page,
      data: data,
      templateId: templateId,
      miniprogramState: miniprogramState
    });
    return result;
  } catch (err) {
    console.error('发送订阅消息失败:', err);
    throw err;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const {
    toUserOpenid,      // 接收者openid
    messageType,       // 消息类型：goods_sold/goods_purchased/goods_status_changed/chat_new_message
    goodsId,           // 商品ID
    goodsTitle,        // 商品标题
    goodsPrice,        // 商品价格
    status,            // 状态
    buyerName,         // 买家名称
    sellerName,        // 卖家名称
    dealTime           // 交易时间
  } = event;

  try {
    // 获取接收者用户信息
    const userResult = await db.collection('users').where({
      openid: toUserOpenid
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '接收者用户不存在'
      };
    }

    const user = userResult.data[0];

    // 根据消息类型构建模板数据
    let templateId = '';
    let page = '';
    let data = {};

    switch (messageType) {
      case 'goods_sold':
        // 商品已售出通知（发送给卖家）
        templateId = 'YOUR_TEMPLATE_ID_SOLD'; // 需替换为实际的模板ID
        page = `pages/detail/detail?id=${goodsId}`;
        data = {
          thing1: { value: goodsTitle || '商品' }, // 商品名称
          amount2: { value: goodsPrice || '0' }, // 成交金额
          name3: { value: buyerName || '买家' }, // 买家昵称
          date4: { value: dealTime || new Date().toLocaleString() } // 交易时间
        };
        break;

      case 'goods_purchased':
        // 购买成功通知（发送给买家）
        templateId = 'YOUR_TEMPLATE_ID_PURCHASED'; // 需替换为实际的模板ID
        page = `pages/detail/detail?id=${goodsId}`;
        data = {
          thing1: { value: goodsTitle || '商品' }, // 商品名称
          amount2: { value: goodsPrice || '0' }, // 支付金额
          name3: { value: sellerName || '卖家' }, // 卖家昵称
          date4: { value: dealTime || new Date().toLocaleString() } // 交易时间
        };
        break;

      case 'goods_status_changed':
        // 商品状态变更通知
        templateId = 'YOUR_TEMPLATE_ID_STATUS'; // 需替换为实际的模板ID
        page = `pages/detail/detail?id=${goodsId}`;
        data = {
          thing1: { value: goodsTitle || '商品' }, // 商品名称
          phrase2: { value: status || '已变更' }, // 当前状态
          date3: { value: new Date().toLocaleString() } // 变更时间
        };
        break;

      case 'chat_new_message':
        // 新聊天消息通知
        templateId = 'YOUR_TEMPLATE_ID_CHAT'; // 需替换为实际的模板ID
        page = `pages/chat/chat?userId=${wxContext.OPENID}&goodsId=${goodsId}`;
        data = {
          thing1: { value: goodsTitle || '新消息' }, // 商品名称
          thing2: { value: '有人向您咨询' }, // 消息内容
          date3: { value: new Date().toLocaleString() } // 消息时间
        };
        break;

      default:
        return {
          success: false,
          message: '不支持的消息类型'
        };
    }

    // 发送订阅消息
    const result = await sendSubscribe(toUserOpenid, templateId, page, data);

    return {
      success: true,
      message: '发送订阅消息成功',
      data: result
    };

  } catch (error) {
    console.error('sendSubscribeMessage 云函数执行失败:', error);
    return {
      success: false,
      message: '发送订阅消息失败',
      error: error.message
    };
  }
};
