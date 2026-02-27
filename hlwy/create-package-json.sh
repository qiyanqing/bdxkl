#!/bin/bash

# 云函数目录路径
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

# 遍历所有云函数目录
for dir in "$CLOUD_FUNCTIONS_DIR"/*; do
  if [ -d "$dir" ]; then
    # 检查是否已有package.json文件
    if [ ! -f "$dir/package.json" ]; then
      # 获取云函数名称
      FUNCTION_NAME=$(basename "$dir")
      
      # 创建package.json文件
      cat > "$dir/package.json" << EOF
{
  "name": "$FUNCTION_NAME",
  "version": "1.0.0",
  "description": "$FUNCTION_NAME cloud function",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "MIT",
  "dependencies": {
    "wx-server-sdk": "~2.30.0"
  }
}
EOF
      
      echo "Created package.json for $FUNCTION_NAME"
    fi
  fi
done

echo "All package.json files have been created!"