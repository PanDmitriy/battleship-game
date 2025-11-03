import { Bot } from 'grammy';
import { config } from 'dotenv';

config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env файле');
  process.exit(1);
}

export const bot = new Bot(BOT_TOKEN);

// URL вашего WebApp (замените на ваш домен)
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

// Проверка, является ли URL HTTPS
const isHttps = (url: string): boolean => {
  return url.startsWith('https://');
};

// Команда /start
bot.command('start', async (ctx) => {
  try {
    const isProduction = isHttps(WEBAPP_URL);
    
    // В разработке используем обычную URL кнопку, в продакшене - WebApp
    const button = isProduction
      ? {
          text: '🚢 Играть',
          web_app: { url: WEBAPP_URL },
        }
      : {
          text: '🚢 Открыть игру',
          url: WEBAPP_URL,
        };

    await ctx.reply(
      '🎮 Добро пожаловать в игру "Морской бой"!\n\n' +
      'Нажмите на кнопку ниже, чтобы начать игру:',
      {
        reply_markup: {
          inline_keyboard: [
            [button],
          ],
        },
      }
    );
  } catch (error: any) {
    console.error('Ошибка отправки сообщения:', error);
    await ctx.reply(
      '❌ Произошла ошибка. Попробуйте позже.\n\n' +
      'Для локальной разработки используйте прямую ссылку:\n' +
      WEBAPP_URL
    );
  }
});

// Команда /help
bot.command('help', async (ctx) => {
  await ctx.reply(
    '🎯 Правила игры "Морской бой":\n\n' +
    '1. Разместите свои корабли на поле\n' +
    '2. По очереди стреляйте по клеткам противника\n' +
    '3. Побеждает тот, кто первым потопит все корабли врага\n\n' +
    'Корабли:\n' +
    '• 1 авианосец (5 клеток)\n' +
    '• 1 линкор (4 клетки)\n' +
    '• 2 крейсера (3 клетки)\n' +
    '• 1 эсминец (2 клетки)\n\n' +
    'Используйте /start для начала игры!'
  );
});

// Команда /stats (получить статистику)
bot.command('stats', async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) {
    await ctx.reply('Не удалось определить пользователя');
    return;
  }

  // Здесь можно добавить получение статистики из БД
  await ctx.reply('Статистика пока не доступна. Играйте и побеждайте! 🎮');
});

// Обработка неизвестных команд
bot.on('message', async (ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith('/')) {
    await ctx.reply(
      'Неизвестная команда. Используйте /start для начала игры или /help для помощи.'
    );
  }
});

// Обработчик ошибок
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`);
  const e = err.error;
  
  if (!e) {
    console.error('Ошибка: неизвестная ошибка (null)');
    return;
  }
  
  if (e instanceof Error) {
    console.error('Ошибка:', e.message);
  } else if (typeof e === 'object' && 'description' in e) {
    console.error('Ошибка Telegram API:', (e as any).description);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
});

export async function setupBot() {
  // Проверка токена
  try {
    await bot.api.getMe();
    console.log('✅ Telegram бот успешно подключен');
    
    // Проверка типа URL
    if (!isHttps(WEBAPP_URL)) {
      console.log('⚠️  Используется HTTP URL - WebApp кнопка недоступна');
      console.log('⚠️  Для разработки будет использоваться обычная URL кнопка');
      console.log('⚠️  Для продакшена укажите HTTPS URL в переменной WEBAPP_URL');
    }
    
    // В режиме разработки используем polling
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 Запуск бота в режиме polling...');
      bot.start();
    }
    // В продакшене используется webhook (настроить отдельно)
  } catch (error) {
    console.error('❌ Ошибка подключения бота:', error);
    throw error;
  }
}

