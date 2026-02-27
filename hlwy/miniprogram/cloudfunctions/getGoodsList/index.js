// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { scene, sort, keyword, page = 1, limit = 10, location } = event;
  
  try {
    // 1. 自动下架超过一个月未维护的商品
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    await db.collection('goods').where({
      status: 'available',
      lastUpdatedAt: _.lt(oneMonthAgo)
    }).update({
      data: {
        status: 'unavailable',
        updatedAt: db.serverDate()
      }
    });
    
    // 2. 获取当前登录用户信息和默认地址
    const userResult = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get();
    
    let user = null;
    let defaultCommunityAddress = null;
    let defaultOfficeAddress = null;
    
    if (userResult.data.length > 0) {
      user = userResult.data[0];
      // 获取用户默认地址
      defaultCommunityAddress = user.addresses?.find(addr => addr.isDefault && addr.type === 'community');
      defaultOfficeAddress = user.addresses?.find(addr => addr.isDefault && addr.type === 'office');
    }
    
    // 3. 构建查询条件
    const query = {
      status: 'available' // 只显示在架状态的商品
    };
    
    // 场景筛选
    if (scene === 'community') {
      query.addressType = _.in(['community', 'both']);
    } else if (scene === 'office') {
      query.addressType = _.in(['office', 'both']);
    }
    
    // 关键词搜索
    if (keyword) {
      query.$or = [
        { title: db.RegExp({ regexp: keyword, options: 'i' }) },
        { description: db.RegExp({ regexp: keyword, options: 'i' }) },
        { category: db.RegExp({ regexp: keyword, options: 'i' }) }
      ];
    }
    
    // 分类筛选
    if (event.category) {
      query.category = event.category;
    }
    
    // 价格区间筛选
    if (event.minPrice || event.maxPrice) {
      query.price = {};
      if (event.minPrice) {
        query.price.$gte = parseFloat(event.minPrice);
      }
      if (event.maxPrice) {
        query.price.$lte = parseFloat(event.maxPrice);
      }
    }
    
    // 新旧程度筛选
    if (event.condition) {
      query.condition = event.condition;
    }
    
    // 排序
    let sortOption = {};
    if (sort === 'latest') {
      sortOption = { createdAt: -1 };
    } else if (sort === 'nearest') {
      sortOption = { createdAt: -1 };
    }
    
    // 添加置顶排序
    sortOption = {
      isTop: -1,
      topExpireAt: -1,
      ...sortOption
    };
    
    // 4. 查询物品列表
    const goodsList = await db.collection('goods')
      .where(query)
      .orderBy('isTop', 'desc')
      .orderBy('topExpireAt', 'desc')
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    
    // 5. 格式化返回结果，计算距离
    const formattedGoodsList = goodsList.data.map(goods => {
      let distanceRange = '附近';
      
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
      } else {
        // 用户未设置地址，显示默认距离
        distanceRange = '附近';
      }
      
      return {
        ...goods,
        distanceRange,
        distance: 0 // 简化处理，实际项目中应返回真实距离
      };
    });
    
    return {
      success: true,
      goodsList: formattedGoodsList
    };
  } catch (error) {
    console.error('获取物品列表失败:', error);
    return {
      success: false,
      message: '获取物品列表失败，请稍后重试'
    };
  }
};