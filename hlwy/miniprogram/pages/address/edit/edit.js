// edit.js
const app = getApp();

Page({
  data: {
    addressId: null,
    address: {
      _id: '',
      type: 'community',
      poiName: '',
      latitude: '',
      longitude: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      // 编辑已有地址
      this.setData({
        addressId: options.id
      });
      this.loadAddress(options.id);
    } else {
      // 新增地址
      this.setData({
        address: {
          _id: '',
          type: options.type || 'community',
          poiName: '',
          latitude: '',
          longitude: '',
          isDefault: false
        }
      });
    }
  },

  // 从云数据库加载地址详情
  loadAddress(id) {
    wx.showLoading({
      title: '加载中...'
    });
    
    wx.cloud.callFunction({
      name: 'getAddresses',
      data: {}
    }).then(res => {
      console.log('加载地址详情成功:', res);
      
      const addresses = res.result.data || [];
      const address = addresses.find(addr => addr._id === id);
      
      if (address) {
        // 删除companyName字段
        const { companyName, ...addressWithoutCompany } = address;
        this.setData({
          address: addressWithoutCompany
        });
      }
      
      wx.hideLoading();
    }).catch(err => {
      console.error('加载地址详情失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  // 获取当前位置并根据定位获取最近小区
  onGetCurrentLocation() {
    const that = this;
    
    // 显示加载提示
    wx.showLoading({
      title: '获取定位中...',
      mask: true
    });
    
    // 1. 获取当前位置坐标
    wx.getLocation({
      type: 'gcj02',
      altitude: false,
      success: locationRes => {
        console.log('获取定位成功:', locationRes);
        
        // 2. 使用逆地理编码获取最近的小区
        wx.chooseLocation({
          type: 'gcj02',
          title: '选择地址',
          latitude: locationRes.latitude,
          longitude: locationRes.longitude,
          scale: 18,
          success: res => {
            console.log('地图选择结果:', res);
            
            // 更新地址信息
            that.setData({
              address: {
                ...that.data.address,
                poiName: res.name,
                latitude: res.latitude,
                longitude: res.longitude
              }
            });
            
            wx.showToast({
              title: '地址选择成功',
              icon: 'success'
            });
          },
          fail: err => {
            console.error('地图选择失败:', err);
            if (err.errMsg.indexOf('cancel') === -1) {
              wx.showToast({
                title: '地址选择失败，请重试',
                icon: 'none'
              });
            }
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: err => {
        console.error('获取定位失败:', err);
        wx.hideLoading();
        
        wx.showModal({
          title: '定位失败',
          content: '请授权位置信息权限，以便获取真实地址',
          showCancel: false,
          confirmText: '去授权',
          success: () => {
            wx.openSetting({
              success: settingRes => {
                if (settingRes.authSetting['scope.userLocation']) {
                  // 用户授权后重新获取定位
                  that.onGetCurrentLocation();
                }
              }
            });
          }
        });
      }
    });
  },

  // 切换默认地址
  onToggleDefault(e) {
    this.setData({
      address: {
        ...this.data.address,
        isDefault: e.detail.value
      }
    });
  },

  // 保存地址
  onSave() {
    const address = this.data.address;
    
    // 验证地址信息
    if (!address.poiName || !address.latitude || !address.longitude) {
      wx.showToast({
        title: '请选择完整的地址信息',
        icon: 'none'
      });
      return;
    }
    
    // 地址类型建议（非强制验证）
    let shouldShowSuggestion = false;
    let suggestionTitle = '';
    let suggestionContent = '';
    
    if (address.type === 'community') {
      // 小区地址建议
      const communityKeywords = ['小区', '花园', '园', '苑', '公寓', '家园', '广场', '城', '府', '庄', '院'];
      const hasCommunityKeyword = communityKeywords.some(keyword => address.poiName.includes(keyword));
      
      if (!hasCommunityKeyword) {
        shouldShowSuggestion = true;
        suggestionTitle = '地址类型建议';
        suggestionContent = '您选择的地址可能不是小区类型，建议选择包含"小区"、"花园"、"园"等关键词的地址。是否继续保存？';
      }
    } else {
      // 公司地址建议
      const officeKeywords = ['大厦', '中心', '公司', '写字楼', '企业', '集团', '园区', '科技园', '产业园', '广场'];
      const hasOfficeKeyword = officeKeywords.some(keyword => address.poiName.includes(keyword));
      
      if (!hasOfficeKeyword) {
        shouldShowSuggestion = true;
        suggestionTitle = '地址类型建议';
        suggestionContent = '您选择的地址可能不是公司类型，建议选择包含"大厦"、"中心"、"公司"等关键词的地址。是否继续保存？';
      }
    }
    
    // 根据地址类型和关键词验证结果决定后续逻辑
    if (shouldShowSuggestion) {
      // 显示地址类型建议
      wx.showModal({
        title: suggestionTitle,
        content: suggestionContent,
        confirmText: '继续保存',
        cancelText: '重新选择',
        success: suggestRes => {
          if (suggestRes.confirm) {
            // 用户选择继续保存，执行保存逻辑
            this.performSave(address);
          }
          // 用户选择重新选择，不执行保存逻辑
        }
      });
    } else {
      // 地址类型符合或无需建议，直接执行保存逻辑
      this.performSave(address);
    }
  },
  
  // 执行保存地址的实际逻辑
  performSave(address) {
    // 保存前确认 - 提示用户保存真实地址
    wx.showModal({
      title: '保存确认',
      content: '请确保保存的是真实地址信息，保存后3个月内不允许修改。',
      confirmText: '确认保存',
      cancelText: '再想想',
      success: modalRes => {
        if (modalRes.confirm) {
          wx.showLoading({
            title: '保存中...'
          });
          
          // 根据是否有ID决定是新增还是更新
          const cloudFunctionName = this.data.addressId ? 'updateAddress' : 'addAddress';
          
          wx.cloud.callFunction({
            name: cloudFunctionName,
            data: {
              address: address
            }
          }).then(res => {
            console.log('保存地址成功:', res);
            wx.hideLoading();
            
            wx.showToast({
              title: '地址保存成功',
              icon: 'success'
            });
            
            // 返回地址列表页面
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }).catch(err => {
            console.error('保存地址失败:', err);
            wx.hideLoading();
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
});