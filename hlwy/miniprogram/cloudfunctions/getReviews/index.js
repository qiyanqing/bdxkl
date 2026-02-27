// getReviews/index.js
// 文件路径：cloudfunctions/getReviews/index.js
// 功能描述：获取用户的评价列表
// 创建日期：2026-01-28
// 版本：1.0.0

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const {
    userId,      // 要查询的用户ID（不传则查询当前用户的评价）
    type,        // 评价类型：received收到的评价/given给出的评价
    page = 1,
    limit = 20
  } = event;

  try {
    const targetUserId = userId || wxContext.OPENID;

    // 构建查询条件
    const query = {};
    if (type === 'received') {
      query.toUserId = targetUserId;
    } else if (type === 'given') {
      query.fromUserId = targetUserId;
    } else {
      // 默认查询收到的评价
      query.toUserId = targetUserId;
    }

    // 获取评价列表
    const result = await db.collection('reviews')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();

    // 获取总数
    const countResult = await db.collection('reviews').where(query).count();

    return {
      success: true,
      reviews: result.data,
      total: countResult.total,
      hasMore: (page - 1) * limit + result.data.length < countResult.total
    };

  } catch (error) {
    console.error('getReviews 云函数执行失败:', error);
    return {
      success: false,
      message: '获取评价列表失败',
      error: error.message
    };
  }
};
