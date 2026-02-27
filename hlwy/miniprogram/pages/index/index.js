// index.js
// 文件路径：pages/index/index.js
// 功能描述：首页物品列表加载与展示，包含搜索功能增强
// 创建日期：2026-01-28
// 最后修改：2026-01-28
// 版本：2.0.0

const app = getApp();

// 常量定义
const STORAGE_KEY_SEARCH_HISTORY = 'search_history'; // 搜索历史存储key
const MAX_HISTORY_COUNT = 10; // 最多保存10条历史记录
const HOT_SEARCH_KEYWORDS = [ // 热门搜索关键词
  '手机', '笔记本电脑', '书桌', '自行车', '耳机',
  '健身器材', '收纳箱', '台灯', '椅子', '小家电'
];
const GOODS_CATEGORIES = [ // 商品分类
  { id: '', name: '全部' },
  { id: '数码产品', name: '数码产品' },
  { id: '家居用品', name: '家居用品' },
  { id: '服装鞋包', name: '服装鞋包' },
  { id: '母婴用品', name: '母婴用品' },
  { id: '图书音像', name: '图书音像' },
  { id: '运动户外', name: '运动户外' },
  { id: '办公用品', name: '办公用品' },
  { id: '其他', name: '其他' }
];
const CONDITION_OPTIONS = [ // 新旧程度选项
  { id: '', name: '不限' },
  { id: '全新', name: '全新' },
  { id: '几乎全新', name: '几乎全新' },
  { id: '轻微使用', name: '轻微使用' },
  { id: '明显使用痕迹', name: '明显使用痕迹' }
];

Page({
  data: {
    goodsList: [],
    activeScene: 'all',
    activeSort: 'latest',
    searchKeyword: '',
    loading: false,
    page: 1,
    hasMore: true,
    // 搜索相关
    showSearchPanel: false, // 是否显示搜索面板
    searchHistory: [], // 搜索历史记录
    hotSearchKeywords: HOT_SEARCH_KEYWORDS, // 热门搜索
    // 分类筛选相关
    showFilterPanel: false, // 是否显示筛选面板
    activeCategory: '', // 当前选中分类
    activeCondition: '', // 当前选中成色
    minPrice: '', // 最低价格
    maxPrice: '', // 最高价格
    categories: GOODS_CATEGORIES, // 分类列表
    conditions: CONDITION_OPTIONS // 成色列表
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    // 检查登录状态
    if (!app.requireLogin()) {
      return;
    }
    this.loadGoodsList();
    this.loadSearchHistory(); // 加载搜索历史
  },

  onShow() {
    // 每次显示时检查登录状态
    if (!app.requireLogin()) {
      return;
    }
    // 页面显示时刷新数据
    this.setData({
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList();
    
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  /**
   * 加载物品列表
   */
  loadGoodsList() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    // 使用云函数获取物品列表
    wx.cloud.callFunction({
      name: 'getGoodsList',
      data: {
        scene: this.data.activeScene === 'all' ? '' : this.data.activeScene,
        sort: this.data.activeSort,
        keyword: this.data.searchKeyword,
        category: this.data.activeCategory, // 分类筛选
        condition: this.data.activeCondition, // 成色筛选
        minPrice: this.data.minPrice, // 最低价格
        maxPrice: this.data.maxPrice, // 最高价格
        page: this.data.page,
        limit: 10,
        location: ''
      },
      success: res => {
        if (res.result.success) {
          const newList = res.result.goodsList;
          this.setData({
            goodsList: this.data.page === 1 ? newList : [...this.data.goodsList, ...newList],
            hasMore: newList.length === 10,
            page: this.data.page + 1
          });
        }
      },
      fail: err => {
        console.error('加载物品列表失败:', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  /**
   * 加载搜索历史记录
   */
  loadSearchHistory() {
    const history = wx.getStorageSync(STORAGE_KEY_SEARCH_HISTORY) || [];
    this.setData({ searchHistory: history });
  },

  /**
   * 保存搜索历史记录
   * @param {string} keyword - 搜索关键词
   */
  saveSearchHistory(keyword) {
    if (!keyword || !keyword.trim()) return;

    let history = this.data.searchHistory;
    // 移除已存在的相同关键词
    history = history.filter(item => item !== keyword);
    // 将新搜索添加到开头
    history.unshift(keyword);
    // 限制历史记录数量
    if (history.length > MAX_HISTORY_COUNT) {
      history = history.slice(0, MAX_HISTORY_COUNT);
    }

    this.setData({ searchHistory: history });
    wx.setStorageSync(STORAGE_KEY_SEARCH_HISTORY, history);
  },

  /**
   * 清除搜索历史
   */
  clearSearchHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清除搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ searchHistory: [] });
          wx.removeStorageSync(STORAGE_KEY_SEARCH_HISTORY);
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  },

  /**
   * 搜索框获取焦点 - 显示搜索面板
   */
  onSearchFocus() {
    this.setData({ showSearchPanel: true });
  },

  /**
   * 点击搜索面板 - 不关闭
   */
  onSearchPanelTap() {
    // 阻止冒泡，不关闭搜索面板
  },

  /**
   * 点击搜索面板外部 - 关闭搜索面板
   */
  onCloseSearchPanel() {
    this.setData({ showSearchPanel: false });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 点击历史/热门搜索标签
   */
  onSearchTagTap(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword,
      showSearchPanel: false
    });
    this.doSearch(keyword);
  },

  /**
   * 执行搜索
   * @param {string} keyword - 搜索关键词
   */
  doSearch(keyword) {
    // 保存搜索历史
    this.saveSearchHistory(keyword);
    // 重置列表并加载
    this.setData({
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList();
  },

  /**
   * 搜索按钮点击
   */
  onSearch() {
    const keyword = this.data.searchKeyword;
    if (!keyword || !keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    this.setData({ showSearchPanel: false });
    this.doSearch(keyword);
  },

  // 场景切换
  onSceneChange(e) {
    const scene = e.currentTarget.dataset.scene;
    this.setData({
      activeScene: scene,
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList();
  },

  // 排序切换
  onSortChange(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({
      activeSort: sort,
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList();
  },

  // 物品点击
  onGoodsTap(e) {
    const goodsId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${goodsId}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadGoodsList();
  },

  /**
   * 显示筛选面板
   */
  onShowFilter() {
    this.setData({ showFilterPanel: true });
  },

  /**
   * 关闭筛选面板
   */
  onCloseFilter() {
    this.setData({ showFilterPanel: false });
  },

  /**
   * 分类选择
   */
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
  },

  /**
   * 成色选择
   */
  onConditionSelect(e) {
    const condition = e.currentTarget.dataset.condition;
    this.setData({ activeCondition: condition });
  },

  /**
   * 价格输入
   */
  onPriceInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  /**
   * 重置筛选条件
   */
  onResetFilter() {
    this.setData({
      activeCategory: '',
      activeCondition: '',
      minPrice: '',
      maxPrice: ''
    });
  },

  /**
   * 应用筛选
   */
  onApplyFilter() {
    // 验证价格区间
    if (this.data.minPrice && this.data.maxPrice) {
      const min = parseFloat(this.data.minPrice);
      const max = parseFloat(this.data.maxPrice);
      if (min > max) {
        wx.showToast({
          title: '最低价不能大于最高价',
          icon: 'none'
        });
        return;
      }
    }

    this.setData({
      showFilterPanel: false,
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList();
  }
});