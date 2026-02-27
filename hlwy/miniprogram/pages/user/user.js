// user.js
// 文件路径：pages/user/user.js
// 功能描述：个人中心页面，包含头像昵称填写登录
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：3.0.0

const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    publishedCount: 0,
    collectedCount: 0,
    dealtCount: 0,
    addresses: [],
    communityAddress: null,
    officeAddress: null,
    // 登录弹窗相关
    showLoginModal: false,
    tempUserInfo: {
      avatarUrl: '',
      nickname: ''
    }
  },

  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo: userInfo,
      isLoggedIn: !!userInfo
    });

    if (this.data.isLoggedIn) {
      // 已登录，获取统计数据
      this.getStatistics();
      this.initAddresses();
    }
  },

  // 初始化地址信息
  initAddresses() {
    wx.cloud.callFunction({
      name: 'getAddresses',
      data: {}
    }).then(res => {
      const addresses = res.result.data || [];
      app.globalData.addresses = addresses;

      const communityAddress = addresses.find(addr => addr.type === 'community');
      const officeAddress = addresses.find(addr => addr.type === 'office');

      this.setData({
        addresses: addresses,
        communityAddress: communityAddress || null,
        officeAddress: officeAddress || null
      });
    }).catch(err => {
      console.error('获取地址列表失败:', err);
    });
  },

  /**
   * 显示登录弹窗
   */
  showLoginModal() {
    this.setData({
      showLoginModal: true,
      tempUserInfo: {
        avatarUrl: '',
        nickname: ''
      }
    });
  },

  /**
   * 隐藏登录弹窗
   */
  hideLoginModal() {
    this.setData({
      showLoginModal: false
    });
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 空函数，用于阻止点击事件冒泡
  },

  /**
   * 选择头像回调
   */
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('选择头像临时路径:', avatarUrl);

    wx.showLoading({
      title: '上传头像中...',
      mask: true
    });

    try {
      // 上传头像到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`,
        filePath: avatarUrl
      });

      const fileID = uploadRes.fileID;
      console.log('头像上传成功，fileID:', fileID);

      // 保存云存储 fileID
      this.setData({
        'tempUserInfo.avatarUrl': fileID
      });

      wx.hideLoading();
      wx.showToast({
        title: '头像上传成功',
        icon: 'success',
        duration: 1500
      });
    } catch (err) {
      console.error('头像上传失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '头像上传失败',
        icon: 'none'
      });
    }
  },

  /**
   * 更换头像
   */
  onChangeAvatar() {
    // 重新触发头像选择
    // 由于 open-type="chooseAvatar" 只能在 button 上使用
    // 这里需要用户再次点击按钮
  },

  /**
   * 昵称输入回调
   */
  onNicknameInput(e) {
    this.setData({
      'tempUserInfo.nickname': e.detail.value
    });
  },

  /**
   * 执行登录
   */
  async doLogin() {
    const { avatarUrl, nickname } = this.data.tempUserInfo;

    console.log('=== 登录调试信息 ===');
    console.log('发送的头像:', avatarUrl);
    console.log('发送的昵称:', nickname);

    if (!avatarUrl || !nickname) {
      wx.showToast({
        title: '请选择头像并设置昵称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    try {
      // 调用登录云函数
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: {
          avatarUrl: avatarUrl,
          nickname: nickname
        }
      });

      console.log('云函数返回结果:', res.result);

      if (res.result.success) {
        const userInfo = res.result.userInfo;

        console.log('解析后的用户信息:', userInfo);
        console.log('用户头像:', userInfo.avatar);
        console.log('用户昵称:', userInfo.nickname);

        // 保存用户信息到全局
        app.setUserInfo(userInfo);

        // 更新页面状态
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          showLoginModal: false
        });

        console.log('setData 完成，当前页面 data:', this.data.userInfo);

        wx.hideLoading();
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });

        // 获取统计数据
        this.getStatistics();
        this.initAddresses();
      } else {
        wx.hideLoading();
        wx.showToast({
          title: res.result.message || '登录失败',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  // 获取统计数据
  getStatistics() {
    // 简化处理：使用本地模拟数据
    this.setData({
      publishedCount: 0,
      collectedCount: 0,
      dealtCount: 0
    });
  },

  // 我的发布
  onMyPublished() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({
      url: '/pages/published/published'
    });
  },

  // 我的收藏
  onMyCollected() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({
      url: '/pages/collected/collected'
    });
  },

  // 我的成交
  onMyDealt() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({
      url: '/pages/dealt/dealt'
    });
  },

  // 添加地址
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  // 积分记录
  onPointsRecord() {
    if (!this.data.isLoggedIn) {
      this.showLoginModal();
      return;
    }
    wx.navigateTo({
      url: '/pages/points/points'
    });
  },

  // 关于我们
  onAboutUs() {
    wx.showModal({
      title: '关于我们',
      content: '好邻物语小程序，专注于社区和园区的闲置物品交换与交易。',
      showCancel: false
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          // 清除全局数据
          app.clearUserInfo();

          // 更新页面状态
          this.setData({
            userInfo: null,
            isLoggedIn: false,
            addresses: [],
            communityAddress: null,
            officeAddress: null
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});
