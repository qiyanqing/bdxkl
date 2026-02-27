# 好邻物语小程序代码注释规范

## 1. 概述

为了提高代码的可读性、可维护性和可扩展性，确保项目团队成员能够快速理解和修改代码，特制定本注释规范。所有项目模块都必须严格遵循本规范。

## 2. 注释类型

### 2.1 文件头部注释

每个文件的头部必须包含详细的注释，说明文件的基本信息和用途。

#### JavaScript 文件
```javascript
// 文件名：index.js
// 文件路径：pages/index/index.js
// 功能描述：首页物品列表加载与展示
// 作者：
// 创建日期：2026-01-19
// 最后修改：2026-01-19
// 版本：1.0.0
// 依赖：
//   - wx.cloud: 云开发API
//   - app.js: 全局数据管理
// 相关文件：
//   - index.wxml: 页面结构
//   - index.wxss: 页面样式
```

#### WXML 文件
```html
<!-- 文件名：index.wxml
     文件路径：pages/index/index.wxml
     功能描述：首页物品列表页面结构
     作者：
     创建日期：2026-01-19
     最后修改：2026-01-19
     版本：1.0.0
     相关文件：
       - index.js: 页面逻辑
       - index.wxss: 页面样式 -->
```

#### WXSS 文件
```css
/* 文件名：index.wxss
   文件路径：pages/index/index.wxss
   功能描述：首页物品列表页面样式
   作者：
   创建日期：2026-01-19
   最后修改：2026-01-19
   版本：1.0.0
   相关文件：
     - index.js: 页面逻辑
     - index.wxml: 页面结构 */
```

### 2.2 函数注释

每个函数（包括全局函数、类方法、事件处理函数等）必须包含详细的注释，说明函数的用途、参数、返回值等。

```javascript
/**
 * 加载物品列表
 * @param {Object} options - 加载选项
 * @param {string} options.scene - 场景类型（all/community/office）
 * @param {string} options.sort - 排序方式（latest/nearest）
 * @param {string} options.keyword - 搜索关键词
 * @param {number} options.page - 页码，默认为1
 * @param {number} options.limit - 每页数量，默认为10
 * @param {string} options.location - 用户位置坐标，用于计算距离
 * @returns {Promise<Object>} - 物品列表和分页信息
 * @resolve {Array} goodsList - 物品列表数组
 * @resolve {number} total - 总记录数
 * @resolve {boolean} hasMore - 是否还有更多数据
 */
async function loadGoodsList(options) {
  // 函数实现...
}
```

### 2.3 变量注释

重要的变量（尤其是常量、配置项、复杂数据结构等）必须添加注释，说明变量的用途、取值范围等。

```javascript
// 常量定义
const MAX_IMAGES_COUNT = 9; // 最多上传9张图片
const COOLING_PERIOD = 30; // 地址修改冷却期（天）
const DEFAULT_PAGE_SIZE = 10; // 默认每页显示10条数据

// 配置项
const SORT_OPTIONS = {
  LATEST: 'latest', // 按最新发布时间排序
  NEAREST: 'nearest' // 按距离最近排序
};

// 复杂数据结构
const GOODS_CATEGORIES = [ // 物品分类列表
  '数码产品',
  '家居用品',
  '服装鞋包',
  '母婴用品',
  '图书音像',
  '运动户外',
  '办公用品',
  '其他'
];
```

### 2.4 代码块注释

复杂的逻辑块、条件判断、循环结构、数据处理等必须添加注释，说明代码的逻辑和用途。

```javascript
// 构建查询条件
const query = {
  status: 'available' // 只显示可交易的物品
};

// 场景筛选
if (scene === 'community') {
  query.addressType = { $in: ['community', 'both'] };
} else if (scene === 'office') {
  query.addressType = { $in: ['office', 'both'] };
}

// 关键词搜索
if (keyword) {
  query.$or = [
    { title: db.RegExp({ regexp: keyword, options: 'i' }) },
    { description: db.RegExp({ regexp: keyword, options: 'i' }) },
    { category: db.RegExp({ regexp: keyword, options: 'i' }) }
  ];
}
```

### 2.5 特殊注释

用于标记特殊情况的注释，如 TODO、FIXME、NOTE 等。

```javascript
// TODO: 待优化：添加距离计算功能
// FIXME: 修复：当网络异常时，应该显示错误提示
// NOTE: 注意：该函数会调用云函数，可能会有延迟
```

## 3. 注释格式要求

### 3.1 注释语言

- 所有注释必须使用中文
- 注释内容要简洁明了，避免冗余和模糊不清的描述
- 专业术语要准确，避免使用口语化表达

### 3.2 注释位置

- 注释必须放在被注释代码的上方或右侧
- 避免在代码中间插入注释，影响代码的可读性
- 同一行代码的注释必须与代码保持一定的间距（至少2个空格）

### 3.3 注释风格

- JavaScript：使用 `//` 进行单行注释，使用 `/** */` 进行多行注释
- WXML：使用 `<!-- -->` 进行注释
- WXSS：使用 `/* */` 进行注释

### 3.4 注释长度

- 单行注释长度不宜超过80个字符
- 多行注释要合理分段，每段长度不宜超过80个字符
- 函数注释要包含完整的参数和返回值说明

## 4. 注释检查与维护

### 4.1 检查要求

- 所有提交的代码必须经过注释检查，确保符合本规范
- 代码审查时，注释质量是重要的审查内容
- 定期进行注释质量检查，发现问题及时修正

### 4.2 维护要求

- 代码修改时，必须同步更新相关注释
- 函数参数、返回值等发生变化时，必须更新函数注释
- 变量用途发生变化时，必须更新变量注释

## 5. 示例代码

### 5.1 完整的JavaScript文件示例

```javascript
// 文件名：index.js
// 文件路径：pages/index/index.js
// 功能描述：首页物品列表加载与展示
// 作者：
// 创建日期：2026-01-19
// 最后修改：2026-01-19
// 版本：1.0.0
// 依赖：
//   - wx.cloud: 云开发API
//   - app.js: 全局数据管理
// 相关文件：
//   - index.wxml: 页面结构
//   - index.wxss: 页面样式

const app = getApp();

// 常量定义
const DEFAULT_PAGE_SIZE = 10; // 默认每页显示10条数据
const SORT_OPTIONS = {
  LATEST: 'latest', // 按最新发布时间排序
  NEAREST: 'nearest' // 按距离最近排序
};

Page({
  data: {
    goodsList: [], // 物品列表数据
    activeScene: 'all', // 当前选中的场景
    activeSort: 'latest', // 当前选中的排序方式
    searchKeyword: '', // 搜索关键词
    page: 1, // 当前页码
    limit: DEFAULT_PAGE_SIZE, // 每页数量
    loading: false, // 加载状态
    hasMore: true // 是否还有更多数据
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    this.loadGoodsList(); // 加载物品列表
  },

  /**
   * 加载物品列表
   * @returns {Promise<void>}
   */
  async loadGoodsList() {
    if (this.data.loading || !this.data.hasMore) {
      return; // 避免重复加载
    }

    this.setData({ loading: true });

    try {
      // 调用云函数获取物品列表
      const res = await wx.cloud.callFunction({
        name: 'getGoodsList',
        data: {
          scene: this.data.activeScene === 'all' ? '' : this.data.activeScene,
          sort: this.data.activeSort,
          keyword: this.data.searchKeyword,
          page: this.data.page,
          limit: this.data.limit
        }
      });

      if (res.result.success) {
        // 更新物品列表数据
        const newList = res.result.goodsList;
        this.setData({
          goodsList: this.data.page === 1 ? newList : [...this.data.goodsList, ...newList],
          hasMore: newList.length === this.data.limit,
          page: this.data.page + 1
        });
      }
    } catch (error) {
      console.error('加载物品列表失败:', error);
      wx.showToast({
        title: '加载失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 场景切换事件处理
   * @param {Object} e - 事件对象
   */
  onSceneChange(e) {
    const scene = e.currentTarget.dataset.scene;
    this.setData({
      activeScene: scene,
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList(); // 重新加载物品列表
  },

  /**
   * 排序方式切换事件处理
   * @param {Object} e - 事件对象
   */
  onSortChange(e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({
      activeSort: sort,
      page: 1,
      hasMore: true,
      goodsList: []
    });
    this.loadGoodsList(); // 重新加载物品列表
  }
});
```

## 6. 附则

- 本规范自发布之日起生效
- 本规范由项目团队共同维护，如有修改需经团队讨论通过
- 所有团队成员必须严格遵守本规范
- 对于违反本规范的代码，将要求修改后才能合并

---

**文档版本**：v1.0
**发布日期**：2026-01-19
**适用项目**：好邻物语小程序
**制定部门**：项目开发团队