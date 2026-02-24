# 发泄情绪游戏实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一款微信小程序端的情绪发泄游戏，用户可创建虚拟形象（上传照片或选择卡通角色），通过多种攻击方式进行发泄，并生成统计分享海报。

**架构：** 微信小程序前端 + 云开发后端 + Spine 2D动画引擎 + AI抠图API，采用云函数处理敏感操作，本地存储统计数据降低成本。

**技术栈：** 微信小程序原生开发、Spine运行库、Canvas、云开发（云函数/云存储/云数据库）、腾讯云人像分割API

---

## 前置准备

### Task 0: 环境搭建

**目标：** 配置小程序开发环境和云开发环境

**Step 1: 安装微信开发者工具**

下载并安装最新版微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

**Step 2: 创建小程序项目**

```bash
# 在 worktree 中创建项目目录
mkdir -p /Users/a58/code/md/bdxkl-worktree/venting-game
cd /Users/a58/code/md/bdxkl-worktree/venting-game
```

在微信开发者工具中：
1. 选择"小程序项目"
2. 项目目录：`/Users/a58/code/md/bdxkl-worktree/venting-game`
3. AppID：使用测试号或已有AppID
4. 项目名称：发泄小游戏
5. 开发模式：小程序
6. 后端服务：开通云开发

**Step 3: 初始化云开发**

在微信开发者工具中：
1. 点击工具栏"云开发"按钮
2. 创建云开发环境（选择按量付费）
3. 记录环境ID（后续配置使用）

**Step 4: 安装Spine运行库**

```bash
cd /Users/a58/code/md/bdxkl-worktree/venting-game
npm install spine-wx-miniprogram
```

**Step 5: 初始化项目结构**

```bash
# 创建目录结构
mkdir -p pages/index pages/create pages/attack pages/share
mkdir -p components/target-card components/skill-button components/spine-view components/share-poster
mkdir -p utils models config
mkdir -p cloudfunctions/removeBackground
```

**Step 6: 初始化 Git**

```bash
cd /Users/a58/code/md/bdxkl-worktree/venting-game
git init
git add .
git commit -m "chore: 初始化小程序项目结构"
```

---

## Phase 1: 基础框架搭建（3-5天）

### Task 1: 小程序配置文件

**目标：** 配置小程序基础配置

**Files:**
- Create: `app.json`
- Create: `app.js`
- Create: `app.wxss`

**Step 1: 创建 app.json**

```json
{
  "pages": [
    "pages/index/index",
    "pages/create/create",
    "pages/attack/attack",
    "pages/share/share"
  ],
  "window": {
    "navigationBarTitleText": "我的出气筒",
    "navigationBarBackgroundColor": "#1a1a2e",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#16213e"
  },
  "cloud": true,
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

**Step 2: 创建 app.js**

```javascript
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'your-env-id', // TODO: 替换为实际环境ID
        traceUser: true
      })
    }

    // 获取用户openid
    this.getOpenid()
  },

  getOpenid() {
    const that = this
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      that.globalData.openid = res.result.openid
    })
  },

  globalData: {
    openid: null,
    currentTarget: null,
    currentSession: {
      userOpenid: null,
      currentTargetId: null,
      sessionStats: {
        totalAttacks: 0,
        attacks: {},
        startTime: Date.now()
      }
    },
    myTargets: []
  }
})
```

**Step 3: 创建 app.wxss**

```css
/* 全局样式 */
page {
  background-color: #16213e;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 通用按钮 */
.btn-primary {
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  color: #ffffff;
  border-radius: 50rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(233, 69, 96, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-radius: 50rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

/* 卡片样式 */
.card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  backdrop-filter: blur(10px);
}
```

**Step 4: 创建 sitemap.json**

```json
{
  "desc": "关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
```

**Step 5: 提交**

```bash
git add app.json app.js app.wxss sitemap.json
git commit -m "feat: 配置小程序基础文件"
```

---

### Task 2: 云函数 - 登录获取openid

**目标：** 创建云函数获取用户openid

**Files:**
- Create: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/login/package.json`

**Step 1: 创建云函数入口**

```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID
  }
}
```

**Step 2: 创建云函数配置**

```json
{
  "name": "login",
  "version": "1.0.0",
  "description": "获取用户openid",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

**Step 3: 部署云函数**

在微信开发者工具中：
1. 右键 `cloudfunctions/login` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

**Step 4: 提交**

```bash
git add cloudfunctions/login/
git commit -m "feat: 添加登录云函数"
```

---

### Task 3: 工具函数封装

**目标：** 创建通用工具函数

**Files:**
- Create: `utils/storage.js`
- Create: `utils/util.js`

**Step 1: 创建存储工具**

```javascript
// utils/storage.js

/**
 * 保存用户所有形象列表
 */
function saveMyTargets(targets) {
  wx.setStorageSync('myTargets', targets)
}

/**
 * 获取用户所有形象列表
 */
function getMyTargets() {
  return wx.getStorageSync('myTargets') || []
}

/**
 * 保存当前选中的形象
 */
function saveCurrentTarget(target) {
  wx.setStorageSync('currentTarget', target)
}

/**
 * 获取当前选中的形象
 */
function getCurrentTarget() {
  return wx.getStorageSync('currentTarget')
}

/**
 * 清空当前会话统计
 */
function clearSessionStats() {
  const stats = {
    totalAttacks: 0,
    attacks: {},
    startTime: Date.now()
  }
  wx.setStorageSync('sessionStats', stats)
  return stats
}

/**
 * 获取当前会话统计
 */
function getSessionStats() {
  return wx.getStorageSync('sessionStats') || clearSessionStats()
}

/**
 * 更新会话统计
 */
function updateSessionStats(skillType) {
  const stats = getSessionStats()
  stats.totalAttacks++
  stats.attacks[skillType] = (stats.attacks[skillType] || 0) + 1
  wx.setStorageSync('sessionStats', stats)
  return stats
}

module.exports = {
  saveMyTargets,
  getMyTargets,
  saveCurrentTarget,
  getCurrentTarget,
  clearSessionStats,
  getSessionStats,
  updateSessionStats
}
```

**Step 2: 创建通用工具函数**

```javascript
// utils/util.js

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 震动反馈
 */
function vibrate(type = 'short') {
  if (type === 'short') {
    wx.vibrateShort({ type: 'heavy' })
  } else if (type === 'long') {
    wx.vibrateLong()
  }
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  formatTime,
  vibrate,
  generateId,
  deepClone
}
```

**Step 3: 提交**

```bash
git add utils/
git commit -m "feat: 添加工具函数"
```

---

### Task 4: 配置常量定义

**目标：** 定义游戏配置常量

**Files:**
- Create: `config/game.config.js`

**Step 1: 创建游戏配置**

```javascript
// config/game.config.js

/**
 * 技能配置
 */
const SKILL_CONFIG = {
  // 物理攻击
  slap: {
    id: 'slap',
    name: '扇耳手',
    damage: 10,
    cd: 0,
    category: 'physical',
    icon: '/assets/icons/slap.png'
  },
  punch: {
    id: 'punch',
    name: '拳打',
    damage: 30,
    cd: 1000,
    category: 'physical',
    icon: '/assets/icons/punch.png'
  },
  kick: {
    id: 'kick',
    name: '飞踢',
    damage: 50,
    cd: 3000,
    category: 'physical',
    icon: '/assets/icons/kick.png'
  },

  // 道具攻击
  throw_egg: {
    id: 'throw_egg',
    name: '扔鸡蛋',
    damage: 20,
    cd: 2000,
    category: 'item',
    icon: '/assets/icons/egg.png'
  },
  splash: {
    id: 'splash',
    name: '泼水',
    damage: 25,
    cd: 2000,
    category: 'item',
    icon: '/assets/icons/water.png'
  },
  throw_shoe: {
    id: 'throw_shoe',
    name: '扔鞋子',
    damage: 60,
    cd: 4000,
    category: 'item',
    icon: '/assets/icons/shoe.png'
  },

  // 魔法攻击
  fireball: {
    id: 'fireball',
    name: '火球术',
    damage: 40,
    cd: 3000,
    category: 'magic',
    icon: '/assets/icons/fire.png'
  },
  lightning: {
    id: 'lightning',
    name: '雷击',
    damage: 80,
    cd: 5000,
    category: 'magic',
    icon: '/assets/icons/lightning.png'
  },
  freeze: {
    id: 'freeze',
    name: '冰冻',
    damage: 70,
    cd: 4000,
    category: 'magic',
    icon: '/assets/icons/ice.png'
  },

  // 言语攻击
  text_barrage: {
    id: 'text_barrage',
    name: '弹幕吐槽',
    damage: 15,
    cd: 0,
    category: 'speech',
    icon: '/assets/icons/text.png'
  },
  voice: {
    id: 'voice',
    name: '语音喊话',
    damage: 35,
    cd: 5000,
    category: 'speech',
    icon: '/assets/icons/voice.png'
  },
  text_bomb: {
    id: 'text_bomb',
    name: '文字轰炸',
    damage: 50,
    cd: 8000,
    category: 'speech',
    icon: '/assets/icons/bomb.png'
  }
}

/**
 * 技能分类（用于UI展示）
 */
const SKILL_CATEGORIES = {
  physical: {
    name: '物理攻击',
    skills: ['slap', 'punch', 'kick']
  },
  item: {
    name: '道具攻击',
    skills: ['throw_egg', 'splash', 'throw_shoe']
  },
  magic: {
    name: '魔法攻击',
    skills: ['fireball', 'lightning', 'freeze']
  },
  speech: {
    name: '言语攻击',
    skills: ['text_barrage', 'voice', 'text_bomb']
  }
}

/**
 * 分享触发阈值
 */
const SHARE_THRESHOLD = {
  perSkill: 100,    // 单技能触发次数
  perTotal: 100     // 总攻击触发次数
}

/**
 * 卡通角色配置
 */
const CARTOON_CHARS = {
  male: [
    { id: 'm1', name: '帅气小哥', preview: '/assets/cartoon/m1.png' },
    { id: 'm2', name: '憨厚大叔', preview: '/assets/cartoon/m2.png' },
    { id: 'm3', name: '霸道总裁', preview: '/assets/cartoon/m3.png' }
  ],
  female: [
    { id: 'f1', name: '可爱少女', preview: '/assets/cartoon/f1.png' },
    { id: 'f2', name: '温柔姐姐', preview: '/assets/cartoon/f2.png' },
    { id: 'f3', name: '高冷女神', preview: '/assets/cartoon/f3.png' }
  ]
}

module.exports = {
  SKILL_CONFIG,
  SKILL_CATEGORIES,
  SHARE_THRESHOLD,
  CARTOON_CHARS
}
```

**Step 2: 提交**

```bash
git add config/
git commit -m "feat: 添加游戏配置常量"
```

---

### Task 5: 首页（我的形象列表）- 页面结构

**目标：** 创建首页基础结构和UI

**Files:**
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`
- Create: `pages/index/index.js`

**Step 1: 创建首页WXML**

```xml
<!-- pages/index/index.wxml -->
<view class="container">
  <!-- 顶部标题 -->
  <view class="header">
    <text class="title">我的出气筒</text>
    <text class="subtitle">创建你的发泄对象，尽情释放压力</text>
  </view>

  <!-- 形象列表 -->
  <view class="target-list">
    <block wx:for="{{myTargets}}" wx:key="id">
      <view
        class="target-card"
        bindtap="selectTarget"
        data-id="{{item.id}}"
        bindlongpress="showMenu"
        data-id="{{item.id}}"
      >
        <image class="target-avatar" src="{{item.type === 'photo' ? item.imageUrl : item.preview}}" mode="aspectFill"></image>
        <view class="target-info">
          <text class="target-name">{{item.name}}</text>
          <text class="target-count">被攻击 {{item.lifetimeStats.totalAttacks}} 次</text>
        </view>
      </view>
    </block>

    <!-- 新建按钮 -->
    <view class="target-card add-card" bindtap="createTarget">
      <view class="add-icon">+</view>
      <text class="add-text">创建新形象</text>
    </view>
  </view>

  <!-- 长按菜单弹窗 -->
  <view class="menu-popup {{showMenu ? 'show' : ''}}" catchtap="hideMenu">
    <view class="menu-content" catchtap="stopPropagation">
      <text class="menu-title">操作</text>
      <button class="menu-btn" catchtap="editTarget">编辑</button>
      <button class="menu-btn danger" catchtap="deleteTarget">删除</button>
      <button class="menu-btn cancel" catchtap="hideMenu">取消</button>
    </view>
  </view>
</view>
```

**Step 2: 创建首页WXSS**

```css
/* pages/index/index.wxss */
.container {
  min-height: 100vh;
  padding: 40rpx;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.target-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.target-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.target-card:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.12);
}

.target-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  margin-bottom: 24rpx;
  background: rgba(255, 255, 255, 0.1);
}

.target-info {
  text-align: center;
}

.target-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.target-count {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.add-card {
  border: 2rpx dashed rgba(255, 255, 255, 0.3);
  justify-content: center;
}

.add-icon {
  font-size: 80rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16rpx;
}

.add-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 菜单弹窗 */
.menu-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  z-index: 1000;
}

.menu-popup.show {
  opacity: 1;
  visibility: visible;
}

.menu-content {
  background: #252538;
  border-radius: 24rpx;
  padding: 48rpx;
  width: 500rpx;
}

.menu-title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 32rpx;
}

.menu-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: none;
}

.menu-btn.danger {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.menu-btn.cancel {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}
```

**Step 3: 创建首页JS**

```javascript
// pages/index/index.js
const { getMyTargets, saveMyTargets, saveCurrentTarget, clearSessionStats } = require('../../utils/storage.js')

Page({
  data: {
    myTargets: [],
    showMenu: false,
    selectedTargetId: null
  },

  onLoad() {
    this.loadTargets()
  },

  onShow() {
    this.loadTargets()
  },

  // 加载形象列表
  loadTargets() {
    const targets = getMyTargets()
    this.setData({ myTargets: targets })
  },

  // 选择形象
  selectTarget(e) {
    const targetId = e.currentTarget.dataset.id
    const target = this.data.myTargets.find(t => t.id === targetId)

    if (target) {
      saveCurrentTarget(target)
      clearSessionStats()

      wx.navigateTo({
        url: '/pages/attack/attack'
      })
    }
  },

  // 创建新形象
  createTarget() {
    wx.navigateTo({
      url: '/pages/create/create'
    })
  },

  // 显示菜单
  showMenu(e) {
    const targetId = e.currentTarget.dataset.id
    this.setData({
      showMenu: true,
      selectedTargetId: targetId
    })
  },

  // 隐藏菜单
  hideMenu() {
    this.setData({
      showMenu: false,
      selectedTargetId: null
    })
  },

  // 阻止冒泡
  stopPropagation() {},

  // 编辑形象
  editTarget() {
    // TODO: 实现编辑功能
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    })
    this.hideMenu()
  },

  // 删除形象
  deleteTarget() {
    const that = this
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个形象吗？',
      success(res) {
        if (res.confirm) {
          const targets = getMyTargets().filter(t => t.id !== that.data.selectedTargetId)
          saveMyTargets(targets)
          that.setData({ myTargets: targets })
          that.hideMenu()

          wx.showToast({
            title: '已删除',
            icon: 'success'
          })
        }
      }
    })
  }
})
```

**Step 4: 创建首页JSON配置**

```json
{
  "navigationBarTitleText": "我的出气筒",
  "enablePullDownRefresh": false
}
```

**Step 5: 提交**

```bash
git add pages/index/
git commit -m "feat: 实现首页（我的形象列表）"
```

---

### Task 6: 创建形象页面 - 页面结构

**目标：** 创建形象选择和创建流程

**Files:**
- Create: `pages/create/create.wxml`
- Create: `pages/create/create.wxss`
- Create: `pages/create/create.js`
- Create: `pages/create/create.json`

**Step 1: 创建形象WXML**

```xml
<!-- pages/create/create.wxml -->
<view class="container">
  <!-- 步骤指示器 -->
  <view class="steps">
    <view class="step {{currentStep >= 1 ? 'active' : ''}}">1</view>
    <view class="step-line {{currentStep >= 2 ? 'active' : ''}}"></view>
    <view class="step {{currentStep >= 2 ? 'active' : ''}}">2</view>
    <view class="step-line {{currentStep >= 3 ? 'active' : ''}}"></view>
    <view class="step {{currentStep >= 3 ? 'active' : ''}}">3</view>
  </view>

  <!-- 步骤1: 选择性别 -->
  <view class="step-content" wx:if="{{currentStep === 1}}">
    <text class="step-title">选择性别</text>
    <view class="gender-options">
      <view
        class="gender-option {{gender === 'male' ? 'selected' : ''}}"
        bindtap="selectGender"
        data-gender="male"
      >
        <image class="gender-icon" src="/assets/icons/male.png"></image>
        <text class="gender-name">男</text>
      </view>
      <view
        class="gender-option {{gender === 'female' ? 'selected' : ''}}"
        bindtap="selectGender"
        data-gender="female"
      >
        <image class="gender-icon" src="/assets/icons/female.png"></image>
        <text class="gender-name">女</text>
      </view>
    </view>
  </view>

  <!-- 步骤2: 选择来源 -->
  <view class="step-content" wx:if="{{currentStep === 2}}">
    <text class="step-title">选择形象来源</text>
    <view class="source-options">
      <view class="source-option" bindtap="selectPhoto">
        <view class="source-icon">📷</view>
        <text class="source-name">上传照片</text>
        <text class="source-desc">AI处理后生成虚拟形象</text>
      </view>
      <view class="source-option" bindtap="selectCartoon">
        <view class="source-icon">🎨</view>
        <text class="source-name">选择卡通</text>
        <text class="source-desc">使用预设卡通角色</text>
      </view>
    </view>

    <!-- 卡通角色选择 -->
    <view class="cartoon-list" wx:if="{{showCartoonList}}">
      <block wx:for="{{cartoonChars}}" wx:key="id">
        <view
          class="cartoon-item {{cartoonId === item.id ? 'selected' : ''}}"
          bindtap="selectCartoonChar"
          data-id="{{item.id}}"
        >
          <image class="cartoon-preview" src="{{item.preview}}" mode="aspectFill"></image>
          <text class="cartoon-name">{{item.name}}</text>
        </view>
      </block>
    </view>
  </view>

  <!-- 步骤3: 确认创建 -->
  <view class="step-content" wx:if="{{currentStep === 3}}">
    <text class="step-title">输入名称</text>
    <input
      class="name-input"
      placeholder="给TA起个名字"
      value="{{targetName}}"
      bindinput="onNameInput"
      maxlength="10"
    />

    <view class="preview-container">
      <image
        class="preview-image"
        src="{{type === 'photo' ? photoPreview : cartoonPreview}}"
        mode="aspectFill"
      ></image>
      <text class="preview-name">{{targetName || '未命名'}}</text>
    </view>
  </view>

  <!-- 底部按钮 -->
  <view class="footer">
    <button class="btn-secondary" wx:if="{{currentStep > 1}}" bindtap="prevStep">上一步</button>
    <button class="btn-primary" bindtap="nextStep" disabled="{{!canNext}}">
      {{currentStep === 3 ? '创建' : '下一步'}}
    </button>
  </view>
</view>
```

**Step 2: 创建形象WXSS**

```css
/* pages/create/create.wxss */
.container {
  min-height: 100vh;
  padding: 40rpx;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* 步骤指示器 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 80rpx;
}

.step {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
}

.step.active {
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  color: #ffffff;
}

.step-line {
  width: 80rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 16rpx;
}

.step-line.active {
  background: linear-gradient(90deg, #e94560 0%, #ff6b6b 100%);
}

/* 步骤内容 */
.step-content {
  flex: 1;
}

.step-title {
  display: block;
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 60rpx;
}

/* 性别选择 */
.gender-options {
  display: flex;
  gap: 32rpx;
  justify-content: center;
}

.gender-option {
  flex: 1;
  max-width: 300rpx;
  padding: 48rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.gender-option.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.gender-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 24rpx;
}

.gender-name {
  font-size: 32rpx;
  font-weight: bold;
}

/* 来源选择 */
.source-options {
  display: flex;
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.source-option {
  flex: 1;
  padding: 40rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.source-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.source-name {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.source-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

/* 卡通列表 */
.cartoon-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.cartoon-item {
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2rpx solid transparent;
}

.cartoon-item.selected {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.cartoon-preview {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.1);
}

.cartoon-name {
  font-size: 24rpx;
  text-align: center;
}

/* 名称输入 */
.name-input {
  width: 100%;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 32rpx;
  color: #ffffff;
  margin-bottom: 48rpx;
}

/* 预览 */
.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
}

.preview-image {
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  margin-bottom: 24rpx;
  background: rgba(255, 255, 255, 0.1);
}

.preview-name {
  font-size: 40rpx;
  font-weight: bold;
}

/* 底部按钮 */
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx 40rpx;
  background: rgba(22, 33, 62, 0.95);
  display: flex;
  gap: 24rpx;
}

.footer button {
  flex: 1;
}

.footer button[disabled] {
  opacity: 0.5;
}
```

**Step 3: 创建形象JS**

```javascript
// pages/create/create.js
const { getMyTargets, saveMyTargets } = require('../../utils/storage.js')
const { CARTOON_CHARS } = require('../../config/game.config.js')
const { generateId } = require('../../utils/util.js')

Page({
  data: {
    currentStep: 1,
    gender: null,
    type: null,
    photoPreview: '',
    cartoonId: null,
    cartoonPreview: '',
    showCartoonList: false,
    cartoonChars: [],
    targetName: '',
    canNext: false
  },

  onLoad() {
    // 加载图片（临时占位）
    this.setData({
      photoPreview: '/assets/icons/placeholder.png'
    })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({
      gender,
      cartoonChars: CARTOON_CHARS[gender]
    })
    this.checkCanNext()
  },

  // 选择上传照片
  selectPhoto() {
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0]
        that.setData({
          type: 'photo',
          photoPreview: tempFilePath,
          showCartoonList: false
        })
        that.goToStep(3)
      }
    })
  },

  // 选择卡通
  selectCartoon() {
    this.setData({
      type: 'cartoon',
      showCartoonList: true
    })
  },

  // 选择具体卡通角色
  selectCartoonChar(e) {
    const id = e.currentTarget.dataset.id
    const char = this.data.cartoonChars.find(c => c.id === id)
    this.setData({
      cartoonId: id,
      cartoonPreview: char.preview
    })
    this.goToStep(3)
  },

  // 输入名称
  onNameInput(e) {
    this.setData({
      targetName: e.detail.value
    })
    this.checkCanNext()
  },

  // 检查是否可以下一步
  checkCanNext() {
    let canNext = false

    switch (this.data.currentStep) {
      case 1:
        canNext = !!this.data.gender
        break
      case 3:
        canNext = this.data.targetName.trim().length > 0
        break
    }

    this.setData({ canNext })
  },

  // 下一步
  nextStep() {
    if (this.data.currentStep === 3) {
      this.createTarget()
    } else {
      this.goToStep(this.data.currentStep + 1)
    }
  },

  // 跳转到指定步骤
  goToStep(step) {
    this.setData({
      currentStep: step,
      canNext: false
    })
    this.checkCanNext()
  },

  // 上一步
  prevStep() {
    if (this.data.currentStep > 1) {
      this.goToStep(this.data.currentStep - 1)
    }
  },

  // 创建形象
  async createTarget() {
    wx.showLoading({ title: '创建中...' })

    try {
      let imageUrl = ''

      // 如果是照片类型，需要调用AI处理
      if (this.data.type === 'photo') {
        // TODO: 调用云函数处理照片
        imageUrl = this.data.photoPreview
      } else {
        imageUrl = this.data.cartoonPreview
      }

      const newTarget = {
        id: generateId(),
        name: this.data.targetName,
        type: this.data.type,
        gender: this.data.gender,
        imageUrl: imageUrl,
        cartoonId: this.data.cartoonId || null,
        preview: this.data.type === 'cartoon' ? this.data.cartoonPreview : imageUrl,
        createdAt: Date.now(),
        lifetimeStats: {
          totalAttacks: 0,
          attacks: {}
        }
      }

      const targets = getMyTargets()
      targets.push(newTarget)
      saveMyTargets(targets)

      wx.hideLoading()

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      })
      console.error('创建形象失败:', error)
    }
  }
})
```

**Step 4: 创建形象JSON配置**

```json
{
  "navigationBarTitleText": "创建形象",
  "enablePullDownRefresh": false
}
```

**Step 5: 提交**

```bash
git add pages/create/
git commit -m "feat: 实现创建形象页面"
```

---

## Phase 2: 虚拟形象系统（5-7天）

### Task 7: 云函数 - 人像抠图API

**目标：** 实现云函数调用腾讯云人像分割API

**Files:**
- Create: `cloudfunctions/removeBackground/index.js`
- Create: `cloudfunctions/removeBackground/package.json`

**Step 1: 创建云函数**

```javascript
// cloudfunctions/removeBackground/index.js
const cloud = require('wx-server-sdk')
const tcb = require('@cloudbase/node-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 腾讯云API配置（需要替换为实际配置）
const TENCENT_CLOUD_CONFIG = {
  secretId: 'your-secret-id', // TODO: 替换
  secretKey: 'your-secret-key', // TODO: 替换
  region: 'ap-guangzhou',
  endpoint: 'iai.tencentcloudapi.com'
}

/**
 * 调用腾讯云人像分割API
 */
async function removeBackground(imageUrl) {
  const { secretId, secretKey, region, endpoint } = TENCENT_CLOUD_CONFIG

  // TODO: 实现腾讯云API调用
  // 这里需要根据腾讯云人像分割API文档实现
  // 暂时返回原图
  return imageUrl
}

exports.main = async (event, context) => {
  const { imageUrl } = event

  try {
    const result = await removeBackground(imageUrl)

    return {
      code: 0,
      data: {
        originalUrl: imageUrl,
        processedUrl: result
      }
    }
  } catch (error) {
    return {
      code: -1,
      message: error.message
    }
  }
}
```

**Step 2: 创建云函数配置**

```json
{
  "name": "removeBackground",
  "version": "1.0.0",
  "description": "人像抠图API",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3",
    "@cloudbase/node-sdk": "^2.5.0",
    "axios": "^0.24.0"
  }
}
```

**Step 3: 部署云函数**

在微信开发者工具中：
1. 右键 `cloudfunctions/removeBackground` 文件夹
2. 选择"上传并部署：云端安装依赖"

**Step 4: 提交**

```bash
git add cloudfunctions/removeBackground/
git commit -m "feat: 添加人像抠图云函数（待配置API密钥）"
```

---

### Task 8: Spine动画组件封装

**目标：** 封装Spine动画组件

**Files:**
- Create: `components/spine-view/spine-view.js`
- Create: `components/spine-view/spine-view.json`
- Create: `components/spine-view/spine-view.wxml`
- Create: `components/spine-view/spine-view.wxss`

**Step 1: 创建Spine组件JS**

```javascript
// components/spine-view/spine-view.js
import { spine } from 'spine-wx-miniprogram'

Component({
  properties: {
    // Spine数据文件路径
    skeletonData: {
      type: String,
      value: ''
    },
    // Atlas文件路径
    atlasData: {
      type: String,
      value: ''
    },
    // 初始动画
    animation: {
      type: String,
      value: 'Idle'
    },
    // 是否循环
    loop: {
      type: Boolean,
      value: true
    },
    // 头部贴图URL
    headTexture: {
      type: String,
      value: ''
    }
  },

  data: {
    canvasWidth: 375,
    canvasHeight: 500
  },

  lifetimes: {
    attached() {
      this.initSpine()
    },

    detached() {
      this.cleanup()
    }
  },

  methods: {
    // 初始化Spine
    initSpine() {
      const query = wx.createSelectorQuery().in(this)
      query.select('#spine-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res[0]) return

          const canvas = res[0].node
          const context = canvas.getContext('2d')

          // 设置canvas尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          context.scale(dpr, dpr)

          this.setData({
            canvasWidth: res[0].width,
            canvasHeight: res[0].height
          })

          // TODO: 初始化Spine实例
          // 需要等待Spine资源加载完成后初始化
          this.spineCanvas = canvas
          this.spineContext = context
        })
    },

    // 播放动画
    playAnimation(animationName, loop = true) {
      // TODO: 实现Spine动画切换
      console.log('播放动画:', animationName, loop)
    },

    // 清理资源
    cleanup() {
      if (this.spine) {
        this.spine.dispose()
        this.spine = null
      }
    }
  }
})
```

**Step 2: 创建Spine组件JSON**

```json
{
  "component": true,
  "usingComponents": {}
}
```

**Step 3: 创建Spine组件WXML**

```xml
<!-- components/spine-view/spine-view.wxml -->
<canvas
  type="2d"
  id="spine-canvas"
  class="spine-canvas"
  style="width: {{canvasWidth}}px; height: {{canvasHeight}}px;"
></canvas>
```

**Step 4: 创建Spine组件WXSS**

```css
/* components/spine-view/spine-view.wxss */
.spine-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
```

**Step 5: 提交**

```bash
git add components/spine-view/
git commit -m "feat: 添加Spine动画组件（基础结构）"
```

---

### Task 9: 攻击场景页面 - 基础结构

**目标：** 创建攻击场景页面基础UI

**Files:**
- Create: `pages/attack/attack.wxml`
- Create: `pages/attack/attack.wxss`
- Create: `pages/attack/attack.js`
- Create: `pages/attack/attack.json`

**Step 1: 创建攻击场景WXML**

```xml
<!-- pages/attack/attack.wxml -->
<view class="container">
  <!-- 顶部信息栏 -->
  <view class="header">
    <view class="target-info">
      <text class="target-name">{{currentTarget.name}}</text>
      <text class="attack-count">本次攻击 {{sessionStats.totalAttacks}} 次</text>
    </view>
    <button class="share-btn" bindtap="goToShare">
      <text>分享</text>
    </button>
  </view>

  <!-- 虚拟形象展示区 -->
  <view class="scene">
    <spine-view
      class="spine-view"
      animation="{{currentAnimation}}"
      headTexture="{{currentTarget.imageUrl}}"
    ></spine-view>

    <!-- 伤害飘字 -->
    <view class="damage-text {{damageVisible ? 'show' : ''}}" style="top: {{damageTop}}px; left: {{damageLeft}}px;">
      -{{damageNumber}}
    </view>
  </view>

  <!-- 技能按钮区 -->
  <view class="skills-container">
    <!-- 分类标签 -->
    <scroll-view class="category-tabs" scroll-x>
      <block wx:for="{{categories}}" wx:key="key">
        <view
          class="category-tab {{currentCategory === item.key ? 'active' : ''}}"
          bindtap="switchCategory"
          data-key="{{item.key}}"
        >
          {{item.name}}
        </view>
      </block>
    </scroll-view>

    <!-- 技能按钮 -->
    <scroll-view class="skills-grid" scroll-x>
      <block wx:for="{{currentSkills}}" wx:key="id">
        <view
          class="skill-btn {{cooldowns[item.id] > 0 ? 'cooldown' : ''}}"
          bindtap="useSkill"
          data-skill="{{item}}"
        >
          <image class="skill-icon" src="{{item.icon}}" mode="aspectFit"></image>
          <text class="skill-name">{{item.name}}</text>
          <text class="skill-damage">-{{item.damage}}</text>
          <view class="cooldown-mask" wx:if="{{cooldowns[item.id] > 0}}" style="height: {{cooldownPercent(item.id)}}%;">
            <text class="cooldown-text">{{cooldowns[item.id] / 1000}}s</text>
          </view>
        </view>
      </block>
    </scroll-view>
  </view>
</view>
```

**Step 2: 创建攻击场景WXSS**

```css
/* pages/attack/attack.wxss */
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部信息栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: rgba(0, 0, 0, 0.3);
}

.target-info {
  flex: 1;
}

.target-name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.attack-count {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.share-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  border-radius: 50rpx;
  font-size: 28rpx;
  color: #ffffff;
  border: none;
}

/* 场景区域 */
.scene {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spine-view {
  width: 600rpx;
  height: 800rpx;
}

/* 伤害飘字 */
.damage-text {
  position: absolute;
  font-size: 80rpx;
  font-weight: bold;
  color: #ff4757;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.5);
  opacity: 0;
  transform: translateY(0);
  transition: all 0.8s;
}

.damage-text.show {
  opacity: 1;
  transform: translateY(-100rpx);
}

/* 技能区域 */
.skills-container {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 32rpx 32rpx 0 0;
  padding: 24rpx;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  white-space: nowrap;
  margin-bottom: 24rpx;
}

.category-tab {
  display: inline-block;
  padding: 16rpx 32rpx;
  margin-right: 16rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
}

.category-tab.active {
  background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
  color: #ffffff;
}

/* 技能按钮网格 */
.skills-grid {
  display: flex;
  white-space: nowrap;
}

.skill-btn {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: 160rpx;
  margin-right: 16rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
}

.skill-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

.skill-btn.cooldown {
  opacity: 0.5;
}

.skill-icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 16rpx;
}

.skill-name {
  font-size: 24rpx;
  margin-bottom: 8rpx;
}

.skill-damage {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff6b6b;
}

/* 冷却遮罩 */
.cooldown-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 0 0 16rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.1s linear;
}

.cooldown-text {
  font-size: 20rpx;
  color: #ffffff;
}
```

**Step 3: 创建攻击场景JS**

```javascript
// pages/attack/attack.js
const { getCurrentTarget } = require('../../utils/storage.js')
const { getSessionStats, updateSessionStats } = require('../../utils/storage.js')
const { SKILL_CONFIG, SKILL_CATEGORIES } = require('../../config/game.config.js')
const { vibrate } = require('../../utils/util.js')

Page({
  data: {
    currentTarget: null,
    sessionStats: null,
    currentAnimation: 'Idle',
    currentCategory: 'physical',
    categories: [],
    currentSkills: [],
    cooldowns: {},
    damageVisible: false,
    damageNumber: 0,
    damageTop: 300,
    damageLeft: 187
  },

  onLoad() {
    // 获取当前形象
    const target = getCurrentTarget()
    if (!target) {
      wx.showToast({
        title: '请先选择形象',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    // 初始化分类列表
    const categories = Object.keys(SKILL_CATEGORIES).map(key => ({
      key,
      name: SKILL_CATEGORIES[key].name
    }))

    this.setData({
      currentTarget: target,
      sessionStats: getSessionStats(),
      categories,
      currentSkills: this.getSkillsByCategory('physical')
    })
  },

  // 切换技能分类
  switchCategory(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      currentCategory: key,
      currentSkills: this.getSkillsByCategory(key)
    })
  },

  // 获取分类下的技能列表
  getSkillsByCategory(category) {
    const skillIds = SKILL_CATEGORIES[category]?.skills || []
    return skillIds.map(id => SKILL_CONFIG[id]).filter(Boolean)
  },

  // 计算冷却百分比
  cooldownPercent(skillId) {
    const skill = SKILL_CONFIG[skillId]
    const cooldown = this.data.cooldowns[skillId] || 0
    if (!skill.cd || cooldown <= 0) return 0
    return ((skill.cd - cooldown) / skill.cd) * 100
  },

  // 使用技能
  useSkill(e) {
    const skill = e.currentTarget.dataset.skill
    const currentCooldown = this.data.cooldowns[skill.id]

    // 检查冷却
    if (currentCooldown > 0) {
      wx.showToast({
        title: '技能冷却中',
        icon: 'none'
      })
      return
    }

    // 播放攻击动画
    this.playAttackAnimation(skill)

    // 更新统计
    updateSessionStats(skill.id)
    this.setData({
      sessionStats: getSessionStats()
    })

    // 设置冷却
    if (skill.cd > 0) {
      this.setCooldown(skill.id, skill.cd)
    }
  },

  // 播放攻击动画
  playAttackAnimation(skill) {
    // 根据伤害值选择受击动画
    let hitAnimation = 'Hit_Light'
    if (skill.damage >= 70) {
      hitAnimation = 'Hit_Heavy'
    } else if (skill.damage >= 30) {
      hitAnimation = 'Hit_Medium'
    }

    // 更新动画
    this.setData({
      currentAnimation: hitAnimation
    })

    // 播放受击动画后恢复
    setTimeout(() => {
      this.setData({
        currentAnimation: 'Idle'
      })
    }, 800)

    // 震动反馈
    if (skill.damage >= 50) {
      vibrate('long')
    } else {
      vibrate('short')
    }

    // 显示伤害数字
    this.showDamageNumber(skill.damage)

    // TODO: 播放音效
    // TODO: 显示特效
  },

  // 显示伤害数字
  showDamageNumber(damage) {
    // 随机位置
    const left = 150 + Math.random() * 100
    const top = 250 + Math.random() * 50

    this.setData({
      damageNumber: damage,
      damageTop: top,
      damageLeft: left,
      damageVisible: true
    })

    setTimeout(() => {
      this.setData({
        damageVisible: false
      })
    }, 800)
  },

  // 设置技能冷却
  setCooldown(skillId, duration) {
    const cooldowns = { ...this.data.cooldowns }
    cooldowns[skillId] = duration
    this.setData({ cooldowns })

    // 倒计时
    const timer = setInterval(() => {
      const current = this.data.cooldowns[skillId] - 100
      if (current <= 0) {
        clearInterval(timer)
        const newCooldowns = { ...this.data.cooldowns }
        delete newCooldowns[skillId]
        this.setData({ cooldowns: newCooldowns })
      } else {
        const newCooldowns = { ...this.data.cooldowns }
        newCooldowns[skillId] = current
        this.setData({ cooldowns: newCooldowns })
      }
    }, 100)
  },

  // 跳转分享页
  goToShare() {
    wx.navigateTo({
      url: '/pages/share/share'
    })
  }
})
```

**Step 4: 创建攻击场景JSON配置**

```json
{
  "navigationBarTitleText": "攻击",
  "navigationStyle": "custom",
  "usingComponents": {
    "spine-view": "/components/spine-view/spine-view"
  }
}
```

**Step 5: 提交**

```bash
git add pages/attack/
git commit -m "feat: 实现攻击场景页面（不含Spine动画和音效）"
```

---

## Phase 3: 攻击与反馈系统（7-10天）

### Task 10: 分享页面 - 海报生成

**目标：** 创建分享预览页面和海报生成逻辑

**Files:**
- Create: `pages/share/share.wxml`
- Create: `pages/share/share.wxss`
- Create: `pages/share/share.js`
- Create: `pages/share/share.json`

**Step 1: 创建分享页面WXML**

```xml
<!-- pages/share/share.wxml -->
<view class="container">
  <text class="title">解压报告</text>

  <!-- 海报预览 -->
  <view class="poster-container">
    <canvas type="2d" id="poster-canvas" class="poster-canvas"></canvas>
    <image wx:if="{{posterUrl}}" class="poster-image" src="{{posterUrl}}" mode="widthFix"></image>
  </view>

  <!-- 统计数据 -->
  <view class="stats-list">
    <block wx:for="{{statsList}}" wx:key="skill">
      <view class="stat-item">
        <text class="stat-name">{{item.name}}</text>
        <text class="stat-count">×{{item.count}}</text>
        <text class="stat-fire" wx:if="{{item.isHighest}}">🔥 最高频</text>
      </view>
    </block>
    <view class="stat-item total">
      <text class="stat-name">总攻击</text>
      <text class="stat-count">×{{totalAttacks}}次</text>
    </view>
  </view>

  <!-- 操作按钮 -->
  <view class="actions">
    <button class="btn-primary" bindtap="saveToAlbum">保存到相册</button>
    <button class="btn-secondary" open-type="share">转发给好友</button>
    <button class="btn-secondary" bindtap="goBack">返回继续</button>
  </view>
</view>
```

**Step 2: 创建分享页面WXSS**

```css
/* pages/share/share.wxss */
.container {
  min-height: 100vh;
  padding: 40rpx;
  box-sizing: border-box;
}

.title {
  display: block;
  text-align: center;
  font-size: 48rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}

/* 海报容器 */
.poster-container {
  width: 600rpx;
  height: 800rpx;
  margin: 0 auto 40rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  overflow: hidden;
}

.poster-canvas {
  width: 100%;
  height: 100%;
}

.poster-image {
  width: 100%;
  height: 100%;
}

/* 统计列表 */
.stats-list {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item.total {
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
  margin-top: 16rpx;
  padding-top: 24rpx;
}

.stat-name {
  flex: 1;
  font-size: 32rpx;
}

.stat-count {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b6b;
  margin-right: 16rpx;
}

.stat-fire {
  font-size: 24rpx;
}

/* 操作按钮 */
.actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.actions button {
  width: 100%;
}
```

**Step 3: 创建分享页面JS**

```javascript
// pages/share/share.js
const { getCurrentTarget, getSessionStats } = require('../../utils/storage.js')
const { SKILL_CONFIG } = require('../../config/game.config.js')

Page({
  data: {
    posterUrl: '',
    statsList: [],
    totalAttacks: 0
  },

  onLoad() {
    this.generateStats()
    this.generatePoster()
  },

  // 生成统计数据
  generateStats() {
    const stats = getSessionStats()
    const target = getCurrentTarget()

    // 转换为数组并排序
    const list = Object.keys(stats.attacks)
      .map(key => ({
        skill: key,
        name: SKILL_CONFIG[key]?.name || key,
        count: stats.attacks[key]
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)

    // 标记最高频
    if (list.length > 0) {
      list[0].isHighest = true
    }

    this.setData({
      statsList: list,
      totalAttacks: stats.totalAttacks
    })
  },

  // 生成海报
  async generatePoster() {
    wx.showLoading({ title: '生成中...' })

    const query = wx.createSelectorQuery()
    query.select('#poster-canvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res[0]) {
          wx.hideLoading()
          return
        }

        const canvas = res[0].node
        const context = canvas.getContext('2d')

        // 设置canvas尺寸（2倍清晰度）
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = 600 * dpr
        canvas.height = 800 * dpr
        context.scale(dpr, dpr)

        // 绘制背景
        this.drawBackground(context)

        // 绘制形象
        await this.drawImage(context)

        // 绘制统计数据
        this.drawStats(context)

        // 绘制文案
        this.drawTitle(context)

        // 导出图片
        const posterUrl = canvas.toDataURL('image/png')
        this.setData({ posterUrl })

        wx.hideLoading()
      })
  },

  // 绘制背景
  drawBackground(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 800)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 600, 800)
  },

  // 绘制形象
  async drawImage(ctx) {
    const target = getCurrentTarget()
    // TODO: 绘制用户形象
    // 这里需要将用户头像绘制到canvas上
  },

  // 绘制统计数据
  drawStats(ctx) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('本次解压报告', 300, 80)

    const startY = 150
    const lineHeight = 70

    this.data.statsList.forEach((item, index) => {
      const y = startY + index * lineHeight
      ctx.font = '32px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillText(item.name, 100, y)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#ff6b6b'
      ctx.fillText(`×${item.count}`, 500, y)

      if (item.isHighest) {
        ctx.font = '24px sans-serif'
        ctx.fillStyle = '#ffa502'
        ctx.fillText('🔥 最高频', 500, y + 30)
      }
    })

    // 总计
    ctx.font = 'bold 36px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('总攻击', 100, startY + this.data.statsList.length * lineHeight + 60)
    ctx.textAlign = 'right'
    ctx.fillText(`×${this.data.totalAttacks}次`, 500, startY + this.data.statsList.length * lineHeight + 60)
  },

  // 绘制标题文案
  drawTitle(ctx) {
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#e94560'
    ctx.fillText('你也太狠了！角色已经熟了', 300, 750)
  },

  // 保存到相册
  saveToAlbum() {
    if (!this.data.posterUrl) {
      wx.showToast({
        title: '海报生成中...',
        icon: 'none'
      })
      return
    }

    // 将base64转换为临时文件
    const fs = wx.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/poster_${Date.now()}.png`

    try {
      // base64数据去掉前缀
      const base64 = this.data.posterUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = wx.base64ToArrayBuffer(base64)
      fs.writeFileSync(filePath, buffer)

      // 保存到相册
      wx.saveImageToPhotosAlbum({
        filePath,
        success() {
          wx.showToast({
            title: '已保存到相册',
            icon: 'success'
          })
        },
        fail(err) {
          if (err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要授权保存图片到相册',
              success(res) {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
          }
        }
      })
    } catch (error) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      console.error('保存失败:', error)
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: '我发泄了' + this.data.totalAttacks + '次，快来一起解压！',
      path: '/pages/index/index',
      imageUrl: this.data.posterUrl
    }
  }
})
```

**Step 4: 创建分享页面JSON配置**

```json
{
  "navigationBarTitleText": "分享",
  "enablePullDownRefresh": false
}
```

**Step 5: 提交**

```bash
git add pages/share/
git commit -m "feat: 实现分享页面和海报生成（待完善形象绘制）"
```

---

## 收尾工作

### Task 11: 项目配置和文档

**目标：** 完善项目配置和文档

**Files:**
- Create: `README.md`
- Create: `project.config.json`
- Create: `.gitignore`

**Step 1: 创建README**

```markdown
# 发泄情绪小游戏

一款微信小程序端的情绪发泄游戏，用户可以创建虚拟形象（上传照片或选择卡通角色），通过多种攻击方式进行发泄。

## 功能特性

- ✅ 虚拟形象系统：支持上传照片AI处理和默认卡通角色
- ✅ 多形象管理：用户可创建多个形象，独立统计
- ✅ 四类攻击技能：物理/道具/魔法/言语
- ✅ 受击反馈：动画+震动+音效+特效
- ✅ 统计分享：生成解压报告海报

## 技术栈

- 微信小程序原生开发
- Spine 2D动画引擎
- 云开发（云函数/云存储/云数据库）
- 腾讯云人像分割API

## 开发

\`\`\`bash
# 安装依赖
npm install

# 使用微信开发者工具打开项目
\`\`\`

## 配置

需要配置以下内容：
- 云开发环境ID
- 腾讯云API密钥（人像分割）
- Spine动画资源

## 设计文档

详细设计文档请查看：[docs/plans/2026-02-24-venting-game-design.md](docs/plans/2026-02-24-venting-game-design.md)

## License

MIT
```

**Step 2: 创建项目配置**

```json
{
  "description": "发泄情绪小游戏",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "useIsolateContext": false,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "touristappid",
  "projectname": "venting-game",
  "debugOptions": {
    "hidedInDevtools": []
  },
  "scripts": {},
  "staticServerOptions": {
    "baseURL": "",
    "servePath": ""
  },
  "isGameTourist": false,
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate",
  "condition": {
    "search": {
      "list": []
    },
    "conversation": {
      "list": []
    },
    "game": {
      "list": []
    },
    "plugin": {
      "list": []
    },
    "gamePlugin": {
      "list": []
    },
    "miniprogram": {
      "list": []
    }
  }
}
```

**Step 3: 创建.gitignore**

```
# Dependencies
node_modules/

# Wechat Miniprogram
.miniprogram-cache/
.private/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
*.temp

# Build output
dist/
build/
```

**Step 4: 提交**

```bash
git add README.md project.config.json .gitignore
git commit -m "docs: 添加项目文档和配置"
```

---

### Task 12: 最终提交和推送

**目标：** 完成所有代码提交并推送到远程

**Step 1: 查看所有提交**

```bash
git log --oneline
```

**Step 2: 推送到远程仓库**

```bash
# 添加远程仓库（如果尚未添加）
git remote add origin <your-repo-url>

# 推送到远程分支
git push -u origin feature/venting-game
```

**Step 3: 清理worktree（可选）**

```bash
# 返回主目录
cd /Users/a58/code/md

# 删除worktree（开发完成后）
git worktree remove /Users/a58/code/md/bdxkl-worktree
```

---

## 实施计划总结

### 已完成模块

| 阶段 | 模块 | 状态 |
|------|------|------|
| Phase 1 | 基础框架 | ✅ |
| | 小程序配置 | ✅ |
| | 云函数-登录 | ✅ |
| | 工具函数 | ✅ |
| | 游戏配置常量 | ✅ |
| | 首页-形象列表 | ✅ |
| | 创建形象页面 | ✅ |
| Phase 2 | 虚拟形象系统 | ⚠️ |
| | 云函数-抠图API | ⚠️ 需配置API密钥 |
| | Spine动画组件 | ⚠️ 需完善 |
| | 攻击场景页面 | ⚠️ 需集成Spine |
| Phase 3 | 攻击与反馈系统 | ⚠️ |
| | 技能系统 | ⚠️ 需完善音效和特效 |
| | 受击反馈 | ⚠️ 需完善动画 |
| Phase 4 | 分享系统 | ⚠️ |
| | 海报生成 | ⚠️ 需完善形象绘制 |

### 待完善事项

1. **Spine动画资源**
   - 需要美术制作2.5D模型（男女各一套）
   - 包含Idle、Hit_Light、Hit_Medium、Hit_Heavy、Knockdown、GetUp动画

2. **音效资源**
   - 打击音效（扇耳手、拳打、飞踢等）
   - 受击声音（轻度、中度、重度）
   - 魔法音效（火球、雷击、冰冻）

3. **API配置**
   - 腾讯云人像分割API密钥
   - 云开发环境ID

4. **测试和优化**
   - 性能测试
   - 兼容性测试
   - 用户体验优化

### 下一步

1. 准备美术资源（Spine模型、音效、图标）
2. 配置腾讯云API密钥
3. 完善Spine动画组件
4. 添加音效和特效
5. 全面测试
6. 提交审核

---

**实施计划完成时间预估：** 21-32天（不含美术资源制作）
