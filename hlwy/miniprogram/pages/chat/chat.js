// chat.js
const app = getApp();

Page({
  data: {
    userId: '', // 对方用户ID
    goodsId: '', // 物品ID
    userName: '', // 对方用户名
    userAvatar: '', // 对方头像
    goodsTitle: '', // 物品标题
    myAvatar: '', // 自己的头像
    chatHistory: [], // 聊天记录
    inputValue: '', // 输入框内容
    page: 1, // 分页
    hasMore: true, // 是否有更多消息
    loading: false // 是否正在加载
  },

  onLoad(options) {
    const that = this;
    
    // 获取页面参数
    this.setData({
      userId: options.userId,
      goodsId: options.goodsId,
      userName: options.userName,
      userAvatar: options.userAvatar,
      goodsTitle: options.goodsTitle,
      myAvatar: app.globalData.userInfo.avatar
    });
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: options.userName
    });
    
    // 加载聊天记录
    this.loadChatHistory();
  },

  // 加载聊天记录
  loadChatHistory() {
    if (this.data.loading || !this.data.hasMore) return;
    
    const that = this;
    this.setData({ loading: true });
    
    wx.request({
      url: `${app.globalData.baseUrl}/chat/history`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        otherUserId: this.data.userId,
        goodsId: this.data.goodsId,
        page: this.data.page,
        limit: 20
      },
      success: res => {
        if (res.data.success) {
          const chatHistory = res.data.chatHistory;
          that.setData({
            chatHistory: that.data.page === 1 ? chatHistory : [...chatHistory, ...that.data.chatHistory],
            hasMore: chatHistory.length === 20,
            page: that.data.page + 1
          });
        }
      },
      fail: err => {
        console.error('加载聊天记录失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      },
      complete: () => {
        that.setData({ loading: false });
      }
    });
  },

  // 加载更多消息
  loadMoreMessages() {
    this.loadChatHistory();
  },

  // 格式化时间
  formatTime(time) {
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 选择图片
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 这里可以实现图片发送功能
        this.sendImageMessage(tempFilePath);
      }
    });
  },

  // 发送图片消息
  sendImageMessage(imagePath) {
    // 上传图片到服务器
    wx.uploadFile({
      url: `${app.globalData.baseUrl}/chat/upload`,
      filePath: imagePath,
      name: 'image',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success: res => {
        const data = JSON.parse(res.data);
        if (data.success) {
          // 发送图片消息
          this.sendMessage(data.imageUrl, 'image');
        } else {
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('图片上传失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 发送消息
  sendMessage(content, contentType = 'text') {
    const that = this;
    
    wx.request({
      url: `${app.globalData.baseUrl}/chat/send`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      data: {
        toUserId: that.data.userId,
        goodsId: that.data.goodsId,
        content: content,
        contentType: contentType
      },
      success: res => {
        if (res.data.success) {
          // 添加到聊天记录
          that.setData({
            chatHistory: [...that.data.chatHistory, res.data.chat],
            inputValue: ''
          });
          // 滚动到底部
          that.scrollToBottom();
        } else {
          wx.showToast({
            title: res.data.message,
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('发送消息失败:', err);
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 发送文本消息
  onSendMessage() {
    const content = this.data.inputValue.trim();
    if (!content) return;
    
    this.sendMessage(content);
  },

  // 滚动到底部
  scrollToBottom() {
    wx.createSelectorQuery().select('.chat-list').boundingClientRect(function(rect) {
      wx.pageScrollTo({
        scrollTop: rect.height,
        duration: 300
      });
    }).exec();
  }
});