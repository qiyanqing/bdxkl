// address.js
const app = getApp();

Page({
  data: {
    addresses: [],
    filteredAddresses: [],
    currentType: 'community', // 当前地址类型：community 或 office
    hasCommunityAddress: false // 是否已有小区地址
  },

  onShow() {
    this.loadAddresses();
  },

  // 从云数据库加载地址列表
  loadAddresses() {
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.cloud.callFunction({
      name: 'getAddresses',
      data: {}
    }).then(res => {
      console.log('加载地址列表成功:', res);
      
      let addresses = res.result.data || [];
      
      // 检查是否已有小区地址
      const hasCommunityAddress = addresses.some(addr => addr.type === 'community');
      
      // 更新全局地址数据
      app.globalData.addresses = addresses;
      
      this.setData({
        addresses: addresses,
        hasCommunityAddress: hasCommunityAddress
      });
      
      // 初始化过滤地址
      this.filterAddresses();
      
      wx.hideLoading();
    }).catch(err => {
      console.error('加载地址列表失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 切换地址类型
  onSwitchType(e) {
    this.setData({
      currentType: e.currentTarget.dataset.type
    });
    
    // 根据新的地址类型过滤地址
    this.filterAddresses();
  },

  // 根据当前类型过滤地址
  filterAddresses() {
    const addresses = this.data.addresses;
    const currentType = this.data.currentType;
    
    // 过滤出当前类型的地址
    const filteredAddresses = addresses.filter(addr => addr.type === currentType);
    
    this.setData({
      filteredAddresses: filteredAddresses
    });
  },

  // 添加新地址
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address/edit/edit?type=' + this.data.currentType
    });
  },

  // 编辑地址
  onEditAddress(e) {
    const id = e.currentTarget.dataset.id;
    const addresses = this.data.addresses;
    const address = addresses.find(addr => addr._id === id);
    
    if (address && address.createTime) {
      // 检查是否在3个月内
      const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const createTime = new Date(address.createTime).getTime();
      const timeDiff = now - createTime;
      
      if (timeDiff < threeMonths) {
        const remainingDays = Math.ceil((threeMonths - timeDiff) / (24 * 60 * 60 * 1000));
        wx.showToast({
          title: `地址保存未满3个月，还需${remainingDays}天才能修改`,
          icon: 'none',
          duration: 2000
        });
        return;
      }
    }
    
    // 超过3个月，可以修改
    wx.navigateTo({
      url: '/pages/address/edit/edit?id=' + id
    });
  },

  // 设置默认地址
  onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showLoading({
      title: '设置中...'
    });
    
    wx.cloud.callFunction({
      name: 'setDefaultAddress',
      data: {
        _id: id
      }
    }).then(res => {
      console.log('设置默认地址成功:', res);
      wx.hideLoading();
      
      // 重新加载地址列表
      this.loadAddresses();
      
      wx.showToast({
        title: '默认地址设置成功',
        icon: 'success'
      });
    }).catch(err => {
      console.error('设置默认地址失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    });
  },

  // 删除地址
  onDeleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除地址',
      content: '确定要删除这个地址吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...'
          });
          
          wx.cloud.callFunction({
            name: 'deleteAddress',
            data: {
              _id: id
            }
          }).then(res => {
            console.log('删除地址成功:', res);
            wx.hideLoading();
            
            // 重新加载地址列表
            this.loadAddresses();
            
            wx.showToast({
              title: '地址删除成功',
              icon: 'success'
            });
          }).catch(err => {
            console.error('删除地址失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
});