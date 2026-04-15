#!/bin/bash
# Keep-alive script that restarts the Next.js dev server if it dies
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server not responding, starting..." >> /home/z/my-project/server-monitor.log
    # Kill any existing next process
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
    npx next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
    NPID=$!
    echo "[$(date)] Started server PID=$NPID" >> /home/z/my-project/server-monitor.log
    sleep 20
  fi
  sleep 10
done
