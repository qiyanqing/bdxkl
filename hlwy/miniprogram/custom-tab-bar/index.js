// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页'
      },
      {
        pagePath: '/pages/publish/publish',
        text: '发布'
      },
      {
        pagePath: '/pages/user/user',
        text: '我的'
      }
    ]
  },

  attached() {
    // 初始化时设置当前选中的tab
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route) {
        const currentPath = currentPage.route;
        
        const index = this.data.list.findIndex(item => {
          const pagePath = item.pagePath.replace(/^\//, '');
          return pagePath === currentPath;
        });
        
        if (index !== -1) {
          this.setData({
            selected: index
          });
        }
      }
    }
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 更新选中状态
      const index = this.data.list.findIndex(item => item.pagePath === url);
      this.setData({
        selected: index
      });
      
      // 跳转到对应页面
      wx.switchTab({
        url
      });
    }
  }
});