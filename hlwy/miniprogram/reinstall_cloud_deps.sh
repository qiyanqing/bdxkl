#!/bin/bash

# Cloud functions directory
CLOUD_FUNCTIONS_DIR="/Users/a58/code/md/ershou/miniprogram/cloudfunctions"

echo "Starting dependency reinstallation for cloud functions..."

# Check if directory exists
if [ ! -d "$CLOUD_FUNCTIONS_DIR" ]; then
  echo "Error: Directory $CLOUD_FUNCTIONS_DIR does not exist."
  exit 1
fi

# Navigate to the directory
cd "$CLOUD_FUNCTIONS_DIR"

# Loop through each subdirectory
for dir in */; do
  if [ -d "$dir" ]; then
    echo "--------------------------------------------------"
    echo "Processing $dir..."
    cd "$dir"

    # Check if package.json exists
    if [ -f "package.json" ]; then
      echo "Found package.json. Reinstalling dependencies..."
      
      # Remove node_modules and package-lock.json
      rm -rf node_modules package-lock.json
      
      # Install dependencies
      npm install
      
      if [ $? -eq 0 ]; then
        echo "Successfully installed dependencies for $dir"
      else
        echo "Failed to install dependencies for $dir"
      fi
    else
      echo "No package.json found in $dir. Skipping."
    fi

    # Go back to parent directory
    cd ..
  fi
done

echo "--------------------------------------------------"
echo "All cloud functions processed."
