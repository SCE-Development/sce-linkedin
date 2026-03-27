FROM node:alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for Vite build)
RUN npm install

# Copy source files
COPY . .

# Build React app
RUN npx vite build

# Remove dev dependencies to slim down image (optional)
# RUN npm prune --production

EXPOSE 8081
CMD ["node", "api/server.js"]
