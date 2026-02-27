#!/bin/bash

# 云函数目录路径
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

# 检查每个云函数的配置
for dir in "$CLOUD_FUNCTIONS_DIR"/*; do
  if [ -d "$dir" ]; then
    FUNCTION_NAME=$(basename "$dir")
    echo "\n=== 检查云函数: $FUNCTION_NAME ==="
    
    # 检查是否有 index.js 文件
    if [ -f "$dir/index.js" ]; then
      echo "✓ 存在 index.js 文件"
    else
      echo "✗ 缺少 index.js 文件"
    fi
    
    # 检查是否有 package.json 文件
    if [ -f "$dir/package.json" ]; then
      echo "✓ 存在 package.json 文件"
      # 检查 wx-server-sdk 依赖
      SDK_VERSION=$(grep -oP '"wx-server-sdk": "\K[^"]+' "$dir/package.json")
      if [ -n "$SDK_VERSION" ]; then
        echo "✓ wx-server-sdk 版本: $SDK_VERSION"
      else
        echo "✗ package.json 中缺少 wx-server-sdk 依赖"
      fi
    else
      echo "✗ 缺少 package.json 文件"
    fi
    
    # 检查是否有 node_modules 目录
    if [ -d "$dir/node_modules" ]; then
      echo "✓ 存在 node_modules 目录"
      # 检查 wx-server-sdk 是否安装
      if [ -d "$dir/node_modules/wx-server-sdk" ]; then
        echo "✓ wx-server-sdk 已安装在本地"
      else
        echo "✗ node_modules 中缺少 wx-server-sdk"
      fi
    else
      echo "✗ 缺少 node_modules 目录"
    fi
  fi
done

echo "\n=== 检查完成 ==="
