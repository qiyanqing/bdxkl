// review.js
// 文件路径：pages/review/review.js
// 功能描述：评价页面
// 创建日期：2026-01-28
// 版本：1.0.0

const app = getApp();

// 评价标签
const REVIEW_TAGS = [
  '沟通顺畅', '回复及时', '商品符合描述',
  '性价比高', '发货迅速', '态度友好',
  '诚信可靠', '包装完好'
];

Page({
  data: {
    goodsId: '',         // 商品ID
    toUserId: '',        // 被评价用户ID
    toUserName: '',      // 被评价用户昵称
    goods: {},           // 商品信息
    rating: 5,           // 当前评分
    selectedTags: [],    // 已选标签
    content: '',         // 评价内容
    submitting: false    // 提交中
  },

  onLoad(options) {
    if (options.goodsId && options.toUserId && options.toUserName) {
      this.setData({
        goodsId: options.goodsId,
        toUserId: options.toUserId,
        toUserName: decodeURIComponent(options.toUserName)
      });
      this.loadGoodsDetail(options.goodsId);
    }
  },

  /**
   * 加载商品详情
   */
  loadGoodsDetail(goodsId) {
    wx.cloud.callFunction({
      name: 'getGoodsDetail',
      data: { id: goodsId },
      success: (res) => {
        if (res.result.success) {
          this.setData({
            goods: res.result.goods
          });
        }
      }
    });
  },

  /**
   * 评分选择
   */
  onRatingSelect(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    this.setData({ rating });
  },

  /**
   * 标签选择
   */
  onTagToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    let selectedTags = [...this.data.selectedTags];

    const index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      if (selectedTags.length >= 4) {
        wx.showToast({
          title: '最多选择4个标签',
          icon: 'none'
        });
        return;
      }
      selectedTags.push(tag);
    }

    this.setData({ selectedTags });
  },

  /**
   * 评价内容输入
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  /**
   * 提交评价
   */
  async onSubmitReview() {
    if (this.data.submitting) return;

    // 验证评分
    if (this.data.rating < 1) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    wx.showLoading({
      title: '提交中...',
      mask: true
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'createReview',
        data: {
          goodsId: this.data.goodsId,
          toUserId: this.data.toUserId,
          rating: this.data.rating,
          content: this.data.content,
          tags: this.data.selectedTags
        }
      });

      wx.hideLoading();

      if (res.result.success) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.result.message || '评价失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('提交评价失败:', err);
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
