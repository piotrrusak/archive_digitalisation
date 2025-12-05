FROM node:20 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ../frontend .
RUN npm run build
