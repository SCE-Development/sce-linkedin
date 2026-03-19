FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8081
CMD ["node", "api/server.js"]
