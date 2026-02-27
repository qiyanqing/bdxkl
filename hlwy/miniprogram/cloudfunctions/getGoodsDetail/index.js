// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event;
  const wxContext = cloud.getWXContext();
  
  try {
    // 查询物品详情
    const goodsResult = await db.collection('goods').doc(id).get();
    
    if (!goodsResult.data) {
      return {
        success: false,
        message: '物品不存在'
      };
    }
    
    const goods = goodsResult.data;
    
    // 查询发布者信息
    const userResult = await db.collection('users').doc(goods.userId).get();
    goods.userId = userResult.data;
    
    // 增加浏览量
    await db.collection('goods').doc(id).update({
      data: {
        viewCount: _.inc(1)
      }
    });
    
    // 获取当前登录用户信息和默认地址
    const currentUserResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get();
    
    let distanceRange = '附近';
    
    if (currentUserResult.data.length > 0) {
      const currentUser = currentUserResult.data[0];
      // 获取用户默认地址
      const defaultCommunityAddress = currentUser.addresses?.find(addr => addr.isDefault && addr.type === 'community');
      const defaultOfficeAddress = currentUser.addresses?.find(addr => addr.isDefault && addr.type === 'office');
      
      if (defaultCommunityAddress || defaultOfficeAddress) {
        // 计算商品到用户地址的距离（这里简化处理，实际项目中应使用地图API）
        const goodsLng = goods.communityLng || goods.officeLng || 0;
        const goodsLat = goods.communityLat || goods.officeLat || 0;
        
        let minDistance = Infinity;
        let nearestAddress = null;
        let addressType = '';
        
        // 计算到小区的距离
        if (defaultCommunityAddress) {
          const communityDistance = Math.sqrt(
            Math.pow(goodsLng - defaultCommunityAddress.longitude, 2) + 
            Math.pow(goodsLat - defaultCommunityAddress.latitude, 2)
          ) * 111320; // 简化的距离计算（米）
          
          if (communityDistance < minDistance) {
            minDistance = communityDistance;
            nearestAddress = defaultCommunityAddress.poiName;
            addressType = '小区';
          }
        }
        
        // 计算到公司的距离
        if (defaultOfficeAddress) {
          const officeDistance = Math.sqrt(
            Math.pow(goodsLng - defaultOfficeAddress.longitude, 2) + 
            Math.pow(goodsLat - defaultOfficeAddress.latitude, 2)
          ) * 111320; // 简化的距离计算（米）
          
          if (officeDistance < minDistance) {
            minDistance = officeDistance;
            nearestAddress = defaultOfficeAddress.poiName;
            addressType = '公司';
          }
        }
        
        // 格式化距离显示
        if (minDistance < 500) {
          distanceRange = `距离您所在的${addressType}${nearestAddress}约${Math.round(minDistance)}米`;
        } else if (minDistance < 1000) {
          distanceRange = `距离您所在的${addressType}${nearestAddress}约1公里`;
        } else {
          distanceRange = `距离您所在的${addressType}${nearestAddress}约${(minDistance / 1000).toFixed(1)}公里`;
        }
      }
    }
    
    // 格式化返回结果
    return {
      success: true,
      goods: {
        ...goods,
        distanceRange
      }
    };
  } catch (error) {
    console.error('获取物品详情失败:', error);
    return {
      success: false,
      message: '获取物品详情失败，请稍后重试'
    };
  }
};