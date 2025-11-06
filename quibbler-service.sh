#!/bin/bash

# Quibbler Hook Server Service Script
# This script manages the Quibbler hook server as a background service

SERVICE_NAME="com.quibbler.hookserver"
PLIST_PATH="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
LOG_PATH="$HOME/Library/Logs/quibbler-hook-server.log"

start_service() {
    echo "Starting Quibbler hook server service..."

    # Create plist file
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/quibbler</string>
        <string>hook</string>
        <string>server</string>
        <string>8082</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_PATH</string>
    <key>StandardErrorPath</key>
    <string>$LOG_PATH</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

    # Load the service
    launchctl load "$PLIST_PATH"
    echo "✅ Quibbler hook server service started"
    echo "📝 Logs available at: $LOG_PATH"
}

stop_service() {
    echo "Stopping Quibbler hook server service..."
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo "✅ Quibbler hook server service stopped"
}

status_service() {
    if launchctl list | grep -q "$SERVICE_NAME"; then
        echo "✅ Quibbler hook server service is running"
        echo "📝 Check logs at: $LOG_PATH"
    else
        echo "❌ Quibbler hook server service is not running"
    fi
}

case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        start_service
        ;;
    status)
        status_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the Quibbler hook server service"
        echo "  stop    - Stop the Quibbler hook server service"
        echo "  restart - Restart the Quibbler hook server service"
        echo "  status  - Check if the service is running"
        ;;
esac