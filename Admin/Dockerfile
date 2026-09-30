# Admin/Dockerfile
# Build Stage
FROM node:20-alpine AS build

WORKDIR /workspace

# Copy root configs, shared directory, and Admin package configs
COPY package*.json ./
COPY shared/ ./shared/
COPY Admin/package*.json ./Admin/

# Install dependencies
RUN npm --prefix Admin install

# Copy Admin source code
COPY Admin/ ./Admin/

# Build production bundle
RUN npm --prefix Admin run build

# Production Nginx Stage
FROM nginx:alpine

COPY Admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/Admin/dist /usr/share/nginx/html

EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
