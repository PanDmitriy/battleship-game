# 🌐 Настройка глобального доступа к приложению

Для работы Telegram WebApp необходим HTTPS URL. Существует несколько способов настроить глобальный доступ с домашнего ноутбука.

## 🚀 Вариант 1: Cloudflare Tunnel (Рекомендуется)

Cloudflare Tunnel - самый простой и надежный способ для домашнего использования.

### Преимущества:
- ✅ Бесплатный
- ✅ Не нужен статический IP адрес
- ✅ Автоматический SSL сертификат (HTTPS)
- ✅ Не нужно настраивать роутер
- ✅ Можно использовать свой домен или бесплатный от Cloudflare

### Установка и настройка:

#### 1. Установка Cloudflared на Linux Mint

```bash
# Скачайте и установите cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

#### 2. Регистрация в Cloudflare (если еще не зарегистрированы)

1. Зайдите на [cloudflare.com](https://cloudflare.com) и создайте бесплатный аккаунт
2. Добавьте ваш домен (если есть) или используйте бесплатный домен от Cloudflare Workers

#### 3. Авторизация cloudflared

```bash
cloudflared tunnel login
```

Откроется браузер для авторизации. Выберите домен, который хотите использовать.

#### 4. Создание туннеля

```bash
# Создайте туннель с именем battleship
cloudflared tunnel create battleship
```

#### 5. Настройка маршрута (routing)

Для использования бесплатного домена от Cloudflare (формат: `your-tunnel-name.trycloudflare.com`):

**Вариант А: Через конфигурационный файл (для постоянного домена)**

Создайте файл `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_ID>  # Получите через: cloudflared tunnel list
credentials-file: /home/<ваш_пользователь>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: <ваш-домен>.workers.dev  # или ваш домен
    service: http://localhost:5173     # Frontend порт в dev режиме
  - hostname: api.<ваш-домен>.workers.dev
    service: http://localhost:3000      # Backend порт
  - service: http_status:404
```

**Вариант Б: Через DNS маршрут (для временного URL)**

Запустите туннель и он автоматически создаст временный URL:

```bash
cloudflared tunnel --url http://localhost:5173
```

Получите URL из вывода команды (формат: `https://xxxxx.trycloudflare.com`)

#### 6. Запуск туннеля

```bash
# Для постоянного запуска
cloudflared tunnel run battleship

# Или для одноразового запуска с автоматическим URL
cloudflared tunnel --url http://localhost:5173
```

#### 7. Настройка .env файла

Используйте полученный HTTPS URL:

```env
WEBAPP_URL=https://your-tunnel-name.trycloudflare.com
# или ваш домен: https://your-domain.com
PORT=3000
NODE_ENV=production
```

#### 8. Настройка автозапуска (systemd service)

Создайте файл `/etc/systemd/system/cloudflared.service`:

```ini
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=your_username
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/your_username/.cloudflared/config.yml run battleship
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Включите автозапуск:

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 🎯 Вариант 2: ngrok (Простой, но с ограничениями)

### Установка:

```bash
# Скачайте ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Зарегистрируйтесь на ngrok.com и получите токен авторизации
ngrok config add-authtoken YOUR_TOKEN
```

### Запуск:

```bash
# Запустите туннель для frontend (порт 5173)
ngrok http 5173
```

Получите HTTPS URL из вывода (например: `https://xxxx-xxxx-xxxx.ngrok-free.app`)

### Ограничения бесплатной версии:
- URL меняется при каждом перезапуске
- Лимит на количество запросов
- Требуется регистрация

---

## 🔧 Вариант 3: Проброс портов + DDNS + SSL (Полноценная настройка)

### Требования:
- Доступ к настройкам роутера
- Динамический DNS сервис (No-IP, DuckDNS и т.д.)

### Шаги:

1. **Настройка DDNS** (например, через DuckDNS):
```bash
# Установка DuckDNS скрипта
mkdir -p ~/duckdns
cd ~/duckdns
echo 'echo url="https://www.duckdns.org/update?domains=your-domain&token=your-token&ip=" | curl -k -o ~/duckdns/duck.log -K -'
chmod +x duck.sh

# Добавление в crontab для обновления каждые 5 минут
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
```

2. **Проброс портов на роутере**:
   - Войдите в панель управления роутером
   - Настройте проброс портов 80 и 443 на внутренний IP ноутбука

3. **Установка Nginx и SSL сертификата**:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Настройка Nginx как reverse proxy
sudo nano /etc/nginx/sites-available/battleship
```

Конфигурация Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.duckdns.org;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/battleship /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.duckdns.org
```

---

## 📝 Рекомендации

1. **Для разработки/тестирования**: Используйте Cloudflare Tunnel с автоматическим URL (`cloudflared tunnel --url`)
2. **Для продакшена**: Настройте постоянный домен через Cloudflare или вариант 3
3. **Безопасность**: Убедитесь, что ваш сервер защищен файрволом
4. **Мониторинг**: Используйте `systemctl status cloudflared` для проверки статуса туннеля

## 🔒 Настройка файрвола

Для варианта 3 (проброс портов) настройте файрвол:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Для Cloudflare Tunnel файрвол настраивать не нужно - весь трафик идет через Cloudflare.

