FROM node:18-alpine

# Устанавливаем необходимые зависимости
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Копируем файлы приложения
COPY . .

# Устанавливаем зависимости
RUN npm install --force

# Собираем приложение
RUN npm run build

# Открываем порт API
EXPOSE 4000

# Запускаем приложение
CMD ["node", "dist/main"] 
