# App/Dockerfile
# Build Stage
FROM node:20-alpine AS build

WORKDIR /workspace

# Copy package configurations and shared module
COPY package*.json ./
COPY shared/ ./shared/
COPY App/package*.json ./App/

# Install dependencies
RUN npm --prefix App install

# Copy App source code
COPY App/ ./App/

# Build PWA
RUN npm --prefix App run build

# Production Nginx Stage
FROM nginx:alpine

COPY App/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/App/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
