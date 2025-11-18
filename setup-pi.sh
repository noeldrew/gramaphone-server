#!/bin/bash
# Setup script for Raspberry Pi 5

echo "=== Gramaphone Server - Raspberry Pi 5 Setup ==="
echo ""

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ]; then
    echo "Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update package list
echo "Updating package list..."
sudo apt update

# Install Chromium
if ! command -v chromium-browser &> /dev/null; then
    echo "Installing Chromium browser with codecs..."
    sudo apt install -y chromium-browser chromium-codecs-ffmpeg-extra
else
    echo "Chromium is already installed"
    echo "Installing extra codecs for MP3 support..."
    sudo apt install -y chromium-codecs-ffmpeg-extra
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js is already installed ($(node -v))"
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To test OSC messages:"
echo "  npm run test:osc"
echo ""
