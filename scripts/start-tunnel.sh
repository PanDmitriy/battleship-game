#!/bin/bash

# Скрипт для запуска Cloudflare Tunnel и сервера приложения
# Использование: ./scripts/start-tunnel.sh [tunnel-name]

set -e

TUNNEL_NAME=${1:-"battleship"}
PORT=${PORT:-5173}

echo "🚀 Запуск Cloudflare Tunnel..."

# Проверка наличия cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared не установлен"
    echo "📥 Установите: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb && sudo dpkg -i cloudflared.deb"
    exit 1
fi

# Проверка, существует ли туннель
if ! cloudflared tunnel list | grep -q "$TUNNEL_NAME"; then
    echo "📝 Туннель '$TUNNEL_NAME' не существует. Создаю..."
    cloudflared tunnel create "$TUNNEL_NAME"
    echo "✅ Туннель создан. Теперь настройте маршруты в ~/.cloudflared/config.yml"
    exit 0
fi

# Запуск туннеля в фоне
echo "🌐 Запуск туннеля '$TUNNEL_NAME' на порту $PORT..."
cloudflared tunnel run "$TUNNEL_NAME" &
TUNNEL_PID=$!

# Сохранение PID для остановки
echo $TUNNEL_PID > .tunnel.pid

echo "✅ Туннель запущен (PID: $TUNNEL_PID)"
echo "📋 Используйте './scripts/stop-tunnel.sh' для остановки"
echo ""
echo "⏳ Ожидание инициализации туннеля..."
sleep 3

# Получение URL из логов (если используется авто-URL)
if [ -z "$WEBAPP_URL" ]; then
    echo "⚠️  WEBAPP_URL не установлен в .env"
    echo "💡 Получите URL из вывода cloudflared или настройте постоянный домен"
fi

wait $TUNNEL_PID

