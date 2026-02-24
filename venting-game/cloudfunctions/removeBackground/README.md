# 人像抠图云函数

## 功能说明

此云函数用于调用腾讯云人像分割API，去除用户上传照片的背景。

## 配置步骤

### 1. 申请腾讯云密钥

1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 开通"人像分割"服务
3. 获取 `SecretId` 和 `SecretKey`

### 2. 配置环境变量

在微信开发者工具中：

1. 右键点击 `removeBackground` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 在云开发控制台配置环境变量：
   - `TENCENT_SECRET_ID`: 你的腾讯云SecretId
   - `TENCENT_SECRET_KEY`: 你的腾讯云SecretKey

### 3. 启用真实API

编辑 `index.js`，取消注释以下代码：

```javascript
// 在 exports.main 函数中
const result = await callTencentPortraitAPI(imageUrl)
// 将临时返回代码注释掉
// return {
//   errCode: 0,
//   errMsg: 'success',
//   imageUrl: imageUrl,
// }
```

## 备选方案

如果腾讯云API不可用，可以考虑：

1. **阿里云智能抠图**：修改 `callTencentPortraitAPI` 函数调用阿里云API
2. **本地Canvas处理**：在前端使用Canvas进行简单裁剪（效果较差）
3. **跳过抠图**：直接使用原图作为形象

## 费用说明

- 腾讯云人像分割：约 0.01-0.05元/次
- 建议设置每日免费额度以控制成本
