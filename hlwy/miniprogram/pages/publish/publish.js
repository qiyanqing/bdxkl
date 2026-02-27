// publish.js
// 文件路径：pages/publish/publish.js
// 功能描述：发布物品页面，需要登录才能访问
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

const app = getApp();

Page({
  data: {
    images: [],
    title: '',
    categoryIndex: 0,
    categories: ['数码产品', '家居用品', '服装鞋包', '母婴用品', '图书音像', '运动户外', '办公用品', '其他'],
    conditionIndex: 2,
    conditions: ['全新', '九成新', '八成新', '七成新', '六成新以下'],
    addressType: 'community',
    price: 0,
    exchangeItem: '',
    description: '',
    isPublishing: false
  },

  // 选择图片
  onChooseImage() {
    const that = this;
    const maxCount = 3 - this.data.images.length;
    
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        that.setData({
          images: [...that.data.images, ...tempFilePaths]
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({
      images
    });
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    });
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      categoryIndex: e.detail.value
    });
  },

  // 新旧程度选择
  onConditionChange(e) {
    this.setData({
      conditionIndex: e.detail.value
    });
  },

  // 地址类型选择
  onAddressTypeChange(e) {
    this.setData({
      addressType: e.detail.value
    });
  },

  // 价格输入
  onPriceInput(e) {
    const price = parseFloat(e.detail.value) || 0;
    this.setData({
      price
    });
  },

  // 互换物品输入
  onExchangeItemInput(e) {
    this.setData({
      exchangeItem: e.detail.value
    });
  },

  // 描述输入
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
  },

  /**
   * 页面显示时执行
   */
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }

    // 检查登录状态，未登录会自动跳转到个人中心
    if (!app.requireLogin()) {
      return;
    }
  },

  /**
   * 发布物品
   */
  onPublish() {
    // 检查登录状态
    if (!app.requireLogin()) {
      return;
    }

    // 表单验证
    if (!this.data.title) {
      wx.showToast({
        title: '请输入物品标题',
        icon: 'none'
      });
      return;
    }

    if (this.data.images.length === 0) {
      wx.showToast({
        title: '请至少上传一张图片',
        icon: 'none'
      });
      return;
    }

    if (this.data.images.length > 3) {
      wx.showToast({
        title: '最多只能上传3张图片',
        icon: 'none'
      });
      return;
    }

    if (!this.data.categories[this.data.categoryIndex]) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none'
      });
      return;
    }

    if (!this.data.conditions[this.data.conditionIndex]) {
      wx.showToast({
        title: '请选择新旧程度',
        icon: 'none'
      });
      return;
    }

    if (!this.data.addressType) {
      wx.showToast({
        title: '请选择展示范围',
        icon: 'none'
      });
      return;
    }

    if (this.data.price === '' || this.data.price === undefined) {
      wx.showToast({
        title: '请输入期望出售价格',
        icon: 'none'
      });
      return;
    }

    if (!this.data.description) {
      wx.showToast({
        title: '请输入物品描述',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isPublishing: true
    });

    // 构造表单数据
    const formData = {
      title: this.data.title,
      description: this.data.description,
      category: this.data.categories[this.data.categoryIndex],
      condition: ['new', 'likeNew', 'good', 'fair', 'poor'][this.data.conditionIndex],
      addressType: this.data.addressType,
      price: this.data.price,
      exchangeItem: this.data.exchangeItem,
      status: 'available'
    };

    // 上传图片
    this.uploadImages(this.data.images).then(imageUrls => {
      // 提交表单
      return this.submitForm({ ...formData, images: imageUrls });
    }).then(() => {
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
      // 跳转回首页列表页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1000);
    }).catch(error => {
      console.error('发布失败:', error);
      wx.showToast({
        title: '发布失败，请稍后重试',
        icon: 'none'
      });
    }).finally(() => {
      this.setData({
        isPublishing: false
      });
    });
  },

  // 上传图片到云存储
  uploadImages(images) {
    const that = this;
    const uploadPromises = [];

    for (let i = 0; i < images.length; i++) {
      uploadPromises.push(new Promise((resolve, reject) => {
        // 生成唯一文件名
        const cloudPath = `goods-images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${images[i].match(/\.(\w+)$/)[1]}`;
        
        // 上传到云存储
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: images[i],
          success: res => {
            // 返回云文件ID
            resolve(res.fileID);
          },
          fail: err => {
            console.error('上传图片失败:', err);
            reject(err);
          }
        });
      }));
    }

    return Promise.all(uploadPromises);
  },

  // 提交表单到云函数
  submitForm(formData) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'publishGoods',
        data: formData,
        success(res) {
          if (res.result.success) {
            resolve();
          } else {
            reject(new Error(res.result.message));
          }
        },
        fail(err) {
          console.error('发布物品失败:', err);
          reject(err);
        }
      });
    });
  }
});