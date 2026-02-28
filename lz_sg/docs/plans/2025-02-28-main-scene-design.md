# 游戏主界面设计文档

**日期**: 2025-02-28
**设计目标**: 创建游戏主界面大厅，作为统一的功能入口

---

## 1. 整体架构

### 场景层级关系
```
SceneSelector (开发选择器)
    └── MainScene (游戏主界面) ← 新增
            ├── MapScene (大富翁关卡)
            ├── BattleScene (战斗场景)
            ├── HeroScene (角色系统)
            ├── BagScene (背包系统)
            └── AchievementScene (成就系统)
```

### 文件结构
```
js/
├── MainScene.js          # 主界面场景（新增）
├── SceneSelector.js      # 修改：增加主界面按钮
├── data/
│   └── playerData.js     # 玩家数据定义（新增）
└── main/                 # 主界面子模块
    ├── TopBar.js         # 顶部信息栏
    ├── MainButton.js     # 中央战斗按钮
    └── BottomTab.js      # 底部功能Tab
```

---

## 2. 顶部信息栏 (TopBar)

### 显示内容
- 玩家头像（默认占位图 50x50px）
- 玩家昵称（默认"玩家_" + 随机数）
- 等级显示
- 资源栏：金币、钻石、体力

### 布局参数
- 高度：80px
- 背景：深蓝色渐变 (#1e3a8a → #1e40af)
- 内边距：左右各15px，上下10px

### 元素分布
```
[头像(50x50)] [昵称 Lv.等级] [spacer] [💰金币] [💎钻石] [⚡体力]
```

---

## 3. 中央战斗按钮 (MainButton)

### 视觉设计
- 位置：屏幕正中央
- 形状：圆形按钮，直径 180px
- 动态呼吸效果（缩放动画）
- 龙珠风格的能量光环

### 按钮文案
- 主文字：「征战」（大字号，金色 #f1c40f）
- 副文字：「关卡模式」（小字号，白色 #ffffff）

### 点击行为
- 点击后直接进入 MapScene（大富翁关卡）
- 带有点击波纹特效
- 过渡动画：按钮放大淡出 → 场景切换

### 动画参数
```javascript
呼吸动画：scale 1.0 ↔ 1.05，周期 2秒
光环旋转：360度，周期 4秒
点击反馈：scale 1.05 → 0.95 → 1.0（200ms）
```

---

## 4. 底部功能 Tab 栏 (BottomTab)

### Tab 项配置（从左到右）
1. **角色** - 查看已获得的角色阵容
2. **羁绊** - 查看史实羁绊组合
3. **背包** - 查看装备和道具
4. **成就** - 查看成就和奖励
5. **更多** - 设置、公告等辅助功能

### 布局参数
- 高度：70px
- 背景：深色半透明 (#16213e，opacity 0.9)
- 选中指示：上方金色线条 + 图标高亮
- 图标大小：32x32px
- 文字大小：12px

### 交互状态
- 未选中：灰白色图标 + 淡文字
- 选中：金色图标 + 高亮文字 + 顶部指示线
- 点击：轻微缩放反馈

### 初始状态
- 默认选中"角色"作为首屏

---

## 5. 场景切换流程

### SceneSelector 修改
```javascript
// 在现有两个按钮下方增加第三个按钮
drawButton('游戏主界面', this.width / 2, 400, '#f39c12');
```

### 进入主界面
```javascript
enterMainScene() {
  console.log('进入游戏主界面');
  this.currentScene = new MainScene(this.canvas, this.width, this.height);
  this.currentScene.init();
}
```

### 从主界面进入关卡
```javascript
// MainScene 中
onBattleButtonClick() {
  // 播放点击动画
  // 场景切换效果
  this.sceneManager.transitionTo('MapScene', {
    level: 1,  // 默认进入第1关
  });
}
```

### 返回机制
- MapScene 右上角增加"返回"按钮
- 点击返回到 MainScene
- 保持关卡状态

---

## 6. 数据流设计

### 玩家数据结构
```javascript
// js/data/playerData.js
export const defaultPlayerData = {
  basicInfo: {
    playerId: 'player_' + timestamp,
    nickname: '玩家_' + randomStr,
    avatar: 'default_avatar.png',
    level: 1,
    exp: 0,
  },
  resources: {
    gold: 1000,      // 初始金币
    gems: 100,       // 初始钻石
    stamina: 100,    // 体力
    maxStamina: 100,
    lastStaminaTime: Date.now(),
  },
  heroes: {
    owned: ['guan_yu'],  // 已拥有的角色ID
    leader: 'guan_yu',   // 当前队长
  },
  bag: {
    equipment: [],  // 已获得装备
    items: [],      // 道具
  },
  levelProgress: {
    maxLevel: 1,    // 已解锁最大关卡
    levelStars: {}, // 各关卡星级 {1: 3, 2: 2}
  },
};
```

### 数据持久化
```javascript
// 使用微信本地存储
wx.setStorageSync('playerData', playerData);
const playerData = wx.getStorageSync('playerData') || defaultPlayerData;
```

### 数据流向
```
MainScene 加载 → 读取本地存储 → 显示玩家信息
    ↓
点击战斗 → 传递角色数据到 MapScene
    ↓
战斗结束 → 更新关卡进度 → 保存到本地
    ↓
返回 MainScene → 刷新显示
```

---

## 7. 错误处理

### 异常场景处理
```javascript
// 1. 本地存储读取失败
try {
  playerData = wx.getStorageSync('playerData');
} catch (e) {
  console.error('读取存档失败，使用默认数据');
  playerData = defaultPlayerData;
}

// 2. 场景切换失败
if (!MapScene) {
  console.error('MapScene 加载失败');
  this.showToast('场景加载失败，请重试');
  return;
}

// 3. 资源加载失败
avatarImage.onerror = () => {
  console.error('头像加载失败，使用默认头像');
  this.drawDefaultAvatar();
};
```

### 友好提示
- 使用 Toast 提示用户错误信息
- 不直接暴露技术细节
- 提供重试选项

---

## 8. 测试计划

### 测试用例
1. 点击主界面按钮 → 正确进入 MainScene
2. 显示正确的玩家信息（头像、昵称、资源）
3. 点击中央战斗按钮 → 正确进入 MapScene
4. 点击各个 Tab → 显示对应占位界面或功能
5. 从 MapScene 返回 → 正确返回 MainScene
6. 数据保存/读取 → 关卡进度正确持久化
7. 网络异常 → 优雅降级，使用本地数据

---

## 9. 实现优先级

### Phase 1 - 核心框架
- [ ] 创建 MainScene.js 基础结构
- [ ] 创建 playerData.js 数据模块
- [ ] 修改 SceneSelector.js 增加入口
- [ ] 实现场景切换逻辑

### Phase 2 - 顶部信息栏
- [ ] 创建 TopBar.js
- [ ] 显示玩家基本信息
- [ ] 显示资源信息

### Phase 3 - 中央战斗按钮
- [ ] 创建 MainButton.js
- [ ] 实现呼吸动画效果
- [ ] 实现点击进入 MapScene

### Phase 4 - 底部 Tab 栏
- [ ] 创建 BottomTab.js
- [ ] 实现 Tab 切换逻辑
- [ ] 创建占位子场景

### Phase 5 - 数据持久化
- [ ] 实现本地存储读写
- [ ] 实现关卡进度保存
- [ ] 返回主界面时刷新数据

### Phase 6 - 返回按钮
- [ ] 在 MapScene 添加返回按钮
- [ ] 实现返回 MainScene 逻辑
