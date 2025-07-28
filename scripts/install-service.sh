#!/bin/bash

# This script installs the notifications service as a systemd service

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Get directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Copy service file to systemd directory
cp $SCRIPT_DIR/pension-notifications.service /etc/systemd/system/

# Update paths in service file
sed -i "s|/path/to/pension|$PROJECT_DIR|g" /etc/systemd/system/pension-notifications.service

# Get current user
CURRENT_USER=$(logname)
sed -i "s|User=youruser|User=$CURRENT_USER|g" /etc/systemd/system/pension-notifications.service

# Reload systemd
systemctl daemon-reload

# Enable and start service
systemctl enable pension-notifications.service
systemctl start pension-notifications.service

echo "Service installed and started. Check status with: systemctl status pension-notifications.service" 