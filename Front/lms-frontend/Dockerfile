# Giai đoạn 1: Build React/Vite app
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
# Cần copy biến môi trường nếu có. Vite chạy build tạo /dist
RUN npm run build && npm cache clean --force 

# Giai đoạn 2: Serve bằng Nginx
FROM nginx:1.27-alpine
# Copy file build từ giai đoạn 1 sang thư mục html của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sẽ map cấu hình nginx từ bên ngoài docker-compose
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
