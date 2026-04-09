# Multi-stage build for React/Vite frontend
FROM node:20-alpine as build

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_API_BASE_URL=/api
ARG VITE_REALTIME_ENABLED=true
ARG VITE_REALTIME_PROVIDER=signalr

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_REALTIME_ENABLED=$VITE_REALTIME_ENABLED
ENV VITE_REALTIME_PROVIDER=$VITE_REALTIME_PROVIDER

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variables
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Which nginx config to use. Defaults to globalcmx layout (nginx.conf).
# For Sercop standalone Docker use: --build-arg NGINX_CONF=nginx.sercop.conf
ARG NGINX_CONF=nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy both nginx configs so the image is self-contained regardless of build arg
COPY nginx.conf /tmp/nginx.globalcmx.conf
COPY nginx.sercop.conf /tmp/nginx.sercop.conf

# Activate the requested config
RUN if [ "$NGINX_CONF" = "nginx.sercop.conf" ]; then \
      cp /tmp/nginx.sercop.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /tmp/nginx.globalcmx.conf /etc/nginx/conf.d/default.conf; \
    fi

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
