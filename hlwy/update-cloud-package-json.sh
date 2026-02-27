#!/bin/bash

# 云函数目录路径
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

# 正确的 wx-server-sdk 版本
CORRECT_VERSION="^3.0.1"

# 遍历所有云函数目录
for dir in "$CLOUD_FUNCTIONS_DIR"/*; do
  if [ -d "$dir" ]; then
    # 检查是否有package.json文件
    if [ -f "$dir/package.json" ]; then
      # 获取云函数名称
      FUNCTION_NAME=$(basename "$dir")
      
      echo "Updating package.json for $FUNCTION_NAME..."
      
      # 使用jq更新wx-server-sdk版本
      if command -v jq &> /dev/null; then
        # 使用jq工具更新版本
        jq --arg version "$CORRECT_VERSION" '.dependencies."wx-server-sdk" = $version' "$dir/package.json" > "$dir/package.json.tmp"
        mv "$dir/package.json.tmp" "$dir/package.json"
        echo "✓ Updated wx-server-sdk version to $CORRECT_VERSION for $FUNCTION_NAME"
      else
        # 如果没有jq，使用sed替换
        sed -i '' 's/"wx-server-sdk": "~2.30.0"/"wx-server-sdk": "'"$CORRECT_VERSION"'"/' "$dir/package.json"
        echo "✓ Updated wx-server-sdk version to $CORRECT_VERSION for $FUNCTION_NAME"
      fi
    fi
  fi
done

echo "All package.json files have been updated!"
