// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { result, turns, myHeroes, enemyHeroes } = event;

  try {
    // 保存战斗记录到云数据库
    const res = await db.collection('battle_records').add({
      data: {
        result: result,           // win/lose
        turns: turns,             // 回合数
        myHeroes: myHeroes,       // 我方阵容
        enemyHeroes: enemyHeroes, // 敌方阵容
        createTime: db.serverDate()
      }
    });

    return {
      success: true,
      _id: res._id
    };
  } catch (e) {
    return {
      success: false,
      error: e
    };
  }
};
