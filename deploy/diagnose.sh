#!/bin/bash
# Диагностика и исправление деплоя
# Запускать как root на сервере

echo "=== Диагностика сервера ==="

# Проверяем, что установлено
echo "Node.js version:"
node --version 2>/dev/null || echo "Node.js не установлен"

echo -e "\nNginx status:"
systemctl status nginx --no-pager -l

echo -e "\nПроверяем пользователя appuser:"
id appuser 2>/dev/null || echo "Пользователь appuser не создан"

echo -e "\nПроверяем папку приложения:"
ls -la /home/appuser/ 2>/dev/null || echo "Папка /home/appuser не существует"

echo -e "\nПроверяем сервис portfolio:"
systemctl status portfolio --no-pager -l 2>/dev/null || echo "Сервис portfolio не найден"

echo -e "\nПроверяем конфигурацию Nginx:"
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

echo -e "\nПроверяем какие сайты активны:"
nginx -T 2>/dev/null | grep "server_name" || echo "Ошибка конфигурации Nginx"

echo -e "\n=== Рекомендуемые действия ==="
echo "1. Если Node.js не установлен - установить"
echo "2. Если appuser не создан - создать"
echo "3. Если приложение не развернуто - клонировать и настроить"
echo "4. Если сервис не создан - создать systemd unit"
echo "5. Если Nginx показывает дефолт - настроить конфигурацию"
