# Microservicio Backend A - Inventario (Node.js + Express)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json para aprovechar la caché de capas
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install --production

# Copiar el código fuente
COPY . .

# Puerto expuesto por el microservicio
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Comando de inicio del servidor Node.js
CMD ["npm", "start"]
