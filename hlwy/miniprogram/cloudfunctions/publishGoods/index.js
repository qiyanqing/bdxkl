// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { 
    title, description, category, condition, 
    addressType, price, status, images, exchangeItem 
  } = event;
  
  try {
    // 验证必填字段
    if (!title || !description || !category || !addressType || !images || images.length === 0) {
      return {
        success: false,
        message: '缺少必填参数'
      };
    }
    
    // 查询用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }
    
    const user = userResult.data[0];
    
    // 生成场景标签
    let sceneTag = '';
    if (addressType === 'community' || addressType === 'both') {
      const communityAddress = user.addresses.find(addr => addr.isDefault && addr.type === 'community');
      if (communityAddress) {
        sceneTag += `${communityAddress.poiName} · `;
      }
    }
    
    if (addressType === 'office' || addressType === 'both') {
      const officeAddress = user.addresses.find(addr => addr.isDefault && addr.type === 'office');
      if (officeAddress) {
        sceneTag += `${officeAddress.poiName}-${officeAddress.companyName || ''}`;
      }
    }
    
    // 去除末尾的分隔符
    sceneTag = sceneTag.replace(/·\s*$/g, '');
    
    // 获取地址坐标
    let communityLng, communityLat, officeLng, officeLat;
    if (addressType === 'community' || addressType === 'both') {
      const communityAddress = user.addresses.find(addr => addr.isDefault && addr.type === 'community');
      if (communityAddress) {
        communityLng = communityAddress.longitude;
        communityLat = communityAddress.latitude;
      }
    }
    
    if (addressType === 'office' || addressType === 'both') {
      const officeAddress = user.addresses.find(addr => addr.isDefault && addr.type === 'office');
      if (officeAddress) {
        officeLng = officeAddress.longitude;
        officeLat = officeAddress.latitude;
      }
    }
    
    // 发布物品
    const result = await db.collection('goods').add({
      data: {
        userId: user._id,
        title: title,
        description: description,
        images: images,
        category: category,
        condition: condition,
        price: price,
        exchangeItem: exchangeItem || '',
        status: status || 'available',
        addressType: addressType,
        communityLng: communityLng,
        communityLat: communityLat,
        officeLng: officeLng,
        officeLat: officeLat,
        sceneTag: sceneTag,
        isTop: false,
        topExpireAt: null,
        viewCount: 0,
        chatCount: 0,
        collectCount: 0,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
        lastUpdatedAt: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '物品发布成功',
      goodsId: result._id
    };
  } catch (error) {
    console.error('发布物品失败:', error);
    return {
      success: false,
      message: '发布物品失败，请稍后重试'
    };
  }
};