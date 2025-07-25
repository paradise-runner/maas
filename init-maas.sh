#!/bin/bash

set -e

echo "🚀 MAAS Initialization Script"
echo "=============================="

# Step 1: Confirm bun is available
echo "📦 Checking for bun availability..."
if ! command -v bun &> /dev/null; then
    echo "❌ Error: bun is not installed or not in PATH"
    echo "Please install bun first: https://bun.sh/"
    exit 1
fi
echo "✅ bun is available"

# Step 2: Get the user's root directory
USER_HOME="$HOME"
echo "🏠 User home directory: $USER_HOME"

# Step 3: Get bun's location using which bun
BUN_PATH=$(which bun)
echo "🔍 bun location: $BUN_PATH"

# Get current project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Run `bun install` to ensure all dependencies are installed
echo "🔧 Running 'bun install' in project directory..."
if ! bun install; then
    echo "❌ Error: 'bun install' failed. Please check your project dependencies."
    exit 1
fi
echo "✅ Dependencies installed successfully"

# Step 4: Generate plist file for maas
PLIST_LABEL="com.maas.dev"
PLIST_FILE="$USER_HOME/Library/LaunchAgents/$PLIST_LABEL.plist"

echo "📝 Generating plist file..."

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$USER_HOME/Library/LaunchAgents"

# Generate the plist content
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$BUN_PATH</string>
        <string>dev</string>
        <string>--port</string>
        <string>6543</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>/tmp/maas.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/maas.error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>6543</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ Plist file created at: $PLIST_FILE"

# Step 5: Load and start the maas service
echo "🔄 Loading and starting MAAS service..."

# Unload if already loaded (ignore errors)
launchctl unload "$PLIST_FILE" 2>/dev/null || true

# Load the service
launchctl load "$PLIST_FILE"
echo "✅ Service loaded"

# Start the service
launchctl start "$PLIST_LABEL"
echo "✅ Service started"

# Wait a moment for the service to start and generate logs
echo "⏳ Waiting for service to start (10 seconds)..."
sleep 10

# Step 6: Parse network URL from log file and open it
echo "🌐 Looking for network URL in log file..."

LOG_FILE="/tmp/maas.log"

if [ -f "$LOG_FILE" ]; then
    # Look for the network URL pattern
    NETWORK_URL=$(grep -o "http://[0-9.]*:[0-9]*" "$LOG_FILE" 2>/dev/null | head -1)
    
    if [ -n "$NETWORK_URL" ]; then
        echo "🎉 Found network URL: $NETWORK_URL"
        echo "🚀 Opening in default browser..."
        open "$NETWORK_URL"
    else
        echo "⚠️  Network URL not found in log file yet"
        echo "📋 Log file contents:"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "Log file is empty or unreadable"
        echo ""
        echo "💡 The service may still be starting. You can check the log manually:"
        echo "   tail -f $LOG_FILE"
    fi
else
    echo "⚠️  Log file not found at $LOG_FILE"
    echo "💡 The service may still be starting. Check again in a few moments."
fi

echo ""
echo "🎯 MAAS Initialization Complete!"
echo "================================="
echo "📂 Project Directory: $PROJECT_DIR"
echo "📋 Plist File: $PLIST_FILE"
echo "📄 Log File: $LOG_FILE"
echo "📄 Error Log: /tmp/maas.error.log"
echo ""
echo "🔧 Useful commands:"
echo "   Check service status: launchctl list | grep $PLIST_LABEL"
echo "   View logs: tail -f $LOG_FILE"
echo "   Restart service: launchctl stop $PLIST_LABEL && launchctl start $PLIST_LABEL"
echo "   Unload service: launchctl unload $PLIST_FILE"