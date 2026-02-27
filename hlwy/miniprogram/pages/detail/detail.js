// detail.js
// 文件路径：pages/detail/detail.js
// 功能描述：物品详情页面，包含订阅消息请求功能
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

const app = getApp();

// 订阅消息模板ID（需在微信公众平台配置）
const TEMPLATE_IDS = [
  'YOUR_TEMPLATE_ID_SOLD',      // 商品已售出
  'YOUR_TEMPLATE_ID_PURCHASED', // 购买成功
  'YOUR_TEMPLATE_ID_STATUS',    // 状态变更
  'YOUR_TEMPLATE_ID_CHAT'       // 新消息
];

Page({
  data: {
    goodsId: '',
    goods: {},
    isCollected: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        goodsId: options.id
      });
      this.fetchGoodsDetail(options.id);
      this.checkCollectionStatus(options.id);
    }
  },

  // 获取物品详情
  fetchGoodsDetail(id) {
    wx.cloud.callFunction({
      name: 'getGoodsDetail',
      data: { id },
      success: res => {
        if (res.result.success) {
          this.setData({
            goods: res.result.goods
          });
        } else {
          wx.showToast({
            title: '获取物品详情失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('获取物品详情失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 检查收藏状态
  checkCollectionStatus(id) {
    wx.cloud.callFunction({
      name: 'getMyCollectedGoods',
      data: {
        page: 1,
        limit: 100 // 获取足够多的收藏记录进行检查
      },
      success: res => {
        if (res.result.success) {
          const isCollected = res.result.goodsList.some(goods => goods._id === id);
          this.setData({
            isCollected
          });
        }
      },
      fail: err => {
        console.error('检查收藏状态失败:', err);
      }
    });
  },

  // 格式化时间
  formatTime(time) {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes + '分钟前';
      } else {
        return hours + '小时前';
      }
    } else if (days < 7) {
      return days + '天前';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  },

  // 收藏/取消收藏
  onCollect() {
    const that = this;
    const cloudFunctionName = this.data.isCollected ? 'cancelCollectGoods' : 'collectGoods';
    
    wx.cloud.callFunction({
      name: cloudFunctionName,
      data: { goodsId: this.data.goodsId },
      success: res => {
        if (res.result.success) {
          that.setData({
            isCollected: !that.data.isCollected
          });
          wx.showToast({
            title: that.data.isCollected ? '收藏成功' : '取消收藏成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.message,
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('收藏操作失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 进入聊天页面
  onChat() {
    wx.navigateTo({
      url: `/pages/chat/chat?userId=${this.data.goods.userId._id}&goodsId=${this.data.goodsId}&userName=${this.data.goods.userId.nickname}&userAvatar=${this.data.goods.userId.avatar}&goodsTitle=${this.data.goods.title}`
    });
  },

  /**
   * 请求订阅消息权限
   * @param {string} scene - 场景：contact联系/chat聊天
   */
  requestSubscribeMessage(scene = 'contact') {
    return new Promise((resolve, reject) => {
      wx.requestSubscribeMessage({
        tmplIds: TEMPLATE_IDS,
        success: (res) => {
          console.log('订阅消息授权结果:', res);
          // 检查授权结果
          const hasAuth = TEMPLATE_IDS.some(id => res[id] === 'accept');
          if (hasAuth) {
            wx.showToast({
              title: '订阅成功，将及时通知您',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '您已拒绝订阅消息',
              icon: 'none'
            });
          }
          resolve(res);
        },
        fail: (err) => {
          console.error('请求订阅消息失败:', err);
          // 用户拒绝或取消，不影响继续操作
          if (err.errCode === 20004) {
            wx.showToast({
              title: '您已关闭订阅消息',
              icon: 'none'
            });
          }
          resolve(err);
        }
      });
    });
  },

  /**
   * 立即联系（请求订阅消息后进入聊天）
   */
  async onContact() {
    // 先请求订阅消息权限
    await this.requestSubscribeMessage('contact');
    // 然后进入聊天页面
    this.onChat();
  },

  /**
   * 发送交易状态通知
   * @param {string} toUserOpenid - 接收者openid
   * @param {string} messageType - 消息类型
   * @param {object} data - 通知数据
   */
  sendTransactionNotify(toUserOpenid, messageType, data = {}) {
    wx.cloud.callFunction({
      name: 'sendSubscribeMessage',
      data: {
        toUserOpenid,
        messageType,
        goodsId: this.data.goodsId,
        goodsTitle: this.data.goods.title,
        goodsPrice: this.data.goods.price ? `¥${this.data.goods.price}` : '免费',
        status: data.status,
        buyerName: data.buyerName,
        sellerName: data.sellerName,
        dealTime: data.dealTime
      },
      success: (res) => {
        console.log('发送订阅消息成功:', res);
      },
      fail: (err) => {
        console.error('发送订阅消息失败:', err);
      }
    });
  }
});