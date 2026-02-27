// createReview/index.js
// 文件路径：cloudfunctions/createReview/index.js
// 功能描述：创建交易评价
// 创建日期：2026-01-28
// 版本：1.0.0

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const {
    goodsId,          // 商品ID
    toUserId,         // 被评价用户ID
    rating,           // 评分 1-5
    content,          // 评价内容
    tags              // 评价标签数组
  } = event;

  try {
    // 1. 参数验证
    if (!goodsId || !toUserId || !rating) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }

    if (rating < 1 || rating > 5) {
      return {
        success: false,
        message: '评分必须在1-5之间'
      };
    }

    // 2. 检查是否已经评价过
    const existingReview = await db.collection('reviews').where({
      goodsId: goodsId,
      fromUserId: wxContext.OPENID,
      toUserId: toUserId
    }).get();

    if (existingReview.data.length > 0) {
      return {
        success: false,
        message: '您已经评价过该交易'
      };
    }

    // 3. 获取商品和用户信息
    const goodsResult = await db.collection('goods').doc(goodsId).get();
    if (!goodsResult.data) {
      return {
        success: false,
        message: '商品不存在'
      };
    }

    const goods = goodsResult.data;
    const toUserResult = await db.collection('users').where({
      openid: toUserId
    }).get();

    if (toUserResult.data.length === 0) {
      return {
        success: false,
        message: '被评价用户不存在'
      };
    }

    const toUser = toUserResult.data[0];

    // 4. 创建评价记录
    const reviewData = {
      goodsId: goodsId,
      goodsTitle: goods.title,
      goodsImage: goods.images[0] || '',
      fromUserId: wxContext.OPENID,
      fromUserName: cloud.getWXContext().CLIENTIP || '用户', // 实际应从用户表获取
      fromUserAvatar: '',
      toUserId: toUserId,
      toUserName: toUser.nickname || '用户',
      toUserAvatar: toUser.avatar || '',
      rating: rating,
      content: content || '',
      tags: tags || [],
      createdAt: db.serverDate()
    };

    const reviewResult = await db.collection('reviews').add({
      data: reviewData
    });

    // 5. 更新被评价用户的评分统计
    const userReviews = await db.collection('reviews').where({
      toUserId: toUserId
    }).get();

    const totalRating = userReviews.data.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = totalRating / userReviews.data.length;

    await db.collection('users').where({
      openid: toUserId
    }).update({
      data: {
        'reviewStats.totalReviews': userReviews.data.length,
        'reviewStats.avgRating': avgRating,
        'reviewStats.fiveStarCount': userReviews.data.filter(r => r.rating === 5).length,
        'reviewStats.fourStarCount': userReviews.data.filter(r => r.rating === 4).length,
        'reviewStats.threeStarCount': userReviews.data.filter(r => r.rating === 3).length,
        'reviewStats.twoStarCount': userReviews.data.filter(r => r.rating === 2).length,
        'reviewStats.oneStarCount': userReviews.data.filter(r => r.rating === 1).length,
        updatedAt: db.serverDate()
      }
    });

    return {
      success: true,
      message: '评价成功',
      reviewId: reviewResult._id
    };

  } catch (error) {
    console.error('createReview 云函数执行失败:', error);
    return {
      success: false,
      message: '评价失败',
      error: error.message
    };
  }
};
