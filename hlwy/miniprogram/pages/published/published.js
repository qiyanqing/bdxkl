// published.js
const app = getApp();

Page({
  data: {
    goodsList: [],
    activeFilter: 'all',
    isLoading: false
  },

  onShow() {
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '请先登录',
        content: '查看发布记录需要先登录',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
    
    // 加载我的发布列表
    this.loadPublishedGoods();
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 筛选条件变化
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      activeFilter: filter
    });
    this.loadPublishedGoods();
  },

  // 加载我的发布列表
  loadPublishedGoods() {
    const that = this;
    this.setData({ isLoading: true });
    
    console.log('加载我的发布列表');
    
    // 构造查询条件
    const query = {
      userId: app.globalData.userInfo._id
    };
    
    if (this.data.activeFilter !== 'all') {
      query.status = this.data.activeFilter;
    }
    
    // 调用云函数获取我的发布
    wx.cloud.callFunction({
      name: 'getMyPublishedGoods',
      data: {
        status: this.data.activeFilter !== 'all' ? this.data.activeFilter : undefined,
        page: 1,
        limit: 100
      },
      success(res) {
        console.log('获取我的发布成功:', res.result);
        if (res.result.success) {
          that.setData({
            goodsList: res.result.goodsList
          });
        } else {
          // 云函数调用失败，使用本地模拟数据
          console.log('云函数调用失败，使用本地模拟数据');
          that.setData({
            goodsList: that.getMockData()
          });
        }
      },
      fail(err) {
        console.error('获取我的发布失败:', err);
        // 调用失败，使用本地模拟数据
        that.setData({
          goodsList: that.getMockData()
        });
      },
      complete() {
        that.setData({ isLoading: false });
      }
    });
  },

  // 本地模拟数据
  getMockData() {
    return [
      {
        _id: 'mock1',
        title: '小米手机11',
        description: '9成新小米手机11，使用一年，无拆无修，配件齐全',
        images: ['https://via.placeholder.com/200'],
        price: 1500,
        status: 'available',
        distanceRange: '500米内',
        viewCount: 23,
        chatCount: 5,
        collectCount: 3
      },
      {
        _id: 'mock2',
        title: '华为平板电脑',
        description: '全新华为平板电脑，未拆封，原价2999，现低价出售',
        images: ['https://via.placeholder.com/200'],
        price: 2200,
        status: 'available',
        distanceRange: '500米内',
        viewCount: 15,
        chatCount: 2,
        collectCount: 1
      }
    ];
  },

  // 查看物品详情
  onGoodsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 去发布新物品
  onPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  }
});