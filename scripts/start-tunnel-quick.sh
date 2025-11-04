#!/bin/bash

# Быстрый запуск туннеля с автоматическим URL
# Использование: ./scripts/start-tunnel-quick.sh [port]

PORT=${1:-5173}

echo "🚀 Быстрый запуск Cloudflare Tunnel на порту $PORT..."
echo "💡 Этот режим создаст временный URL, который изменится при перезапуске"
echo ""

# Проверка наличия cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared не установлен"
    echo "📥 Установите: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb && sudo dpkg -i cloudflared.deb"
    exit 1
fi

echo "🌐 Туннель запускается. URL будет показан ниже:"
echo "📋 Скопируйте HTTPS URL и добавьте его в WEBAPP_URL в .env файле"
echo ""

# Запуск туннеля с автоматическим URL
cloudflared tunnel --url http://localhost:$PORT

