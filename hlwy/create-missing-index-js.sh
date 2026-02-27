#!/bin/bash

# 云函数目录路径
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

# 遍历所有云函数目录
for dir in "$CLOUD_FUNCTIONS_DIR"/*; do
  if [ -d "$dir" ]; then
    # 获取云函数名称
    FUNCTION_NAME=$(basename "$dir")
    
    # 检查是否缺少 index.js 文件
    if [ ! -f "$dir/index.js" ]; then
      echo "Creating index.js for $FUNCTION_NAME..."
      
      # 创建基本的 index.js 文件
      cat > "$dir/index.js" << EOF
// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  try {
    // 这里是 $FUNCTION_NAME 云函数的基本实现
    console.log('$FUNCTION_NAME 云函数被调用', event);
    
    return {
      success: true,
      message: '$FUNCTION_NAME 云函数调用成功',
      openid: wxContext.OPENID,
      event: event
    };
  } catch (error) {
    console.error('$FUNCTION_NAME 云函数执行失败:', error);
    return {
      success: false,
      message: '$FUNCTION_NAME 云函数执行失败',
      error: error.message
    };
  }
};
EOF
      
      echo "✓ Created index.js for $FUNCTION_NAME"
    fi
  fi
done

echo "All missing index.js files have been created!"
