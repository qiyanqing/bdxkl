#!/bin/bash

# 云函数目录路径
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

# 遍历所有云函数目录
for dir in "$CLOUD_FUNCTIONS_DIR"/*; do
  if [ -d "$dir" ]; then
    # 检查是否有package.json文件
    if [ -f "$dir/package.json" ]; then
      # 获取云函数名称
      FUNCTION_NAME=$(basename "$dir")
      
      echo "Installing dependencies for $FUNCTION_NAME..."
      # 进入云函数目录并安装依赖
      cd "$dir" && npm install
      
      if [ $? -eq 0 ]; then
        echo "✓ Successfully installed dependencies for $FUNCTION_NAME"
      else
        echo "✗ Failed to install dependencies for $FUNCTION_NAME"
      fi
      
      # 返回项目根目录
      cd - > /dev/null
    fi
  fi
done

echo "All dependencies installation completed!"
