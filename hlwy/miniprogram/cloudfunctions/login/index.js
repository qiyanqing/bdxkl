// 云函数入口文件
// 文件路径：cloudfunctions/login/index.js
// 功能描述：用户登录云函数，支持头像昵称填写组件
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

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
  const { avatarUrl, nickname } = event;

  try {
    console.log('登录云函数被调用，openid:', openid);
    console.log('头像:', avatarUrl);
    console.log('昵称:', nickname);

    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();

    let userInfo;

    if (userResult.data.length > 0) {
      // 用户已存在，更新头像和昵称
      const existingUser = userResult.data[0];

      console.log('已存在用户数据:', existingUser);
      console.log('接收到的 avatarUrl:', avatarUrl);
      console.log('接收到的 nickname:', nickname);

      // 始终更新登录时间和用户信息
      const updateData = {
        lastLoginTime: db.serverDate()
      };

      // 如果提供了新的头像或昵称，则更新
      if (avatarUrl) {
        updateData.avatar = avatarUrl;
        console.log('将更新头像为:', avatarUrl);
      }
      if (nickname) {
        updateData.nickname = nickname;
        console.log('将更新昵称为:', nickname);
      }

      console.log('准备更新的数据:', updateData);

      // 执行更新
      await db.collection('users').doc(existingUser._id).update({
        data: updateData
      });

      console.log('数据库更新完成');

      // 更新后重新查询用户信息，确保获取最新数据
      const updatedUser = await db.collection('users').doc(existingUser._id).get();
      userInfo = updatedUser.data;

      console.log('重新查询后的用户信息:', userInfo);
    } else {
      // 新用户，创建记录
      const newUser = {
        openid: openid,
        avatar: avatarUrl || '',
        nickname: nickname || '邻居',
        points: 0,
        reviewStats: {
          totalReviews: 0,
          avgRating: 0,
          fiveStarCount: 0,
          fourStarCount: 0,
          threeStarCount: 0,
          twoStarCount: 0,
          oneStarCount: 0
        },
        createdAt: db.serverDate(),
        lastLoginTime: db.serverDate()
      };

      const result = await db.collection('users').add({
        data: newUser
      });

      userInfo = {
        _id: result._id,
        ...newUser
      };

      console.log('创建新用户:', userInfo);
    }

    return {
      success: true,
      userInfo: userInfo
    };

  } catch (error) {
    console.error('登录云函数执行失败:', error);
    return {
      success: true,
      userInfo: {
        _id: openid,
        openid: openid,
        nickname: nickname || '邻居',
        avatar: avatarUrl || '',
        points: 0
      }
    };
  }
};
