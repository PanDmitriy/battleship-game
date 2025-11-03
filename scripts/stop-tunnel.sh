#!/bin/bash

# Остановка Cloudflare Tunnel

if [ -f .tunnel.pid ]; then
    TUNNEL_PID=$(cat .tunnel.pid)
    if ps -p $TUNNEL_PID > /dev/null; then
        echo "🛑 Остановка туннеля (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID
        rm .tunnel.pid
        echo "✅ Туннель остановлен"
    else
        echo "⚠️  Процесс туннеля не найден"
        rm .tunnel.pid
    fi
else
    echo "⚠️  Файл .tunnel.pid не найден"
    echo "💡 Попробуйте найти процесс вручную: ps aux | grep cloudflared"
fi

