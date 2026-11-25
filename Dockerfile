# Microservicio Backend A - Inventario (Node.js + Express)
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json para aprovechar la caché de capas
COPY package*.json ./

# Instalar solo las dependencias de producción, exactamente las del package-lock.json
RUN npm ci --omit=dev

# Copiar el código fuente (.dockerignore excluye node_modules, .env y tests)
COPY . .

# Puerto expuesto por el microservicio
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Comando de inicio del servidor Node.js
CMD ["npm", "start"]
