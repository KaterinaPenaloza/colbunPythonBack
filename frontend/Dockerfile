FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

COPY . /app

# Instalar dependencias
RUN npm install

# Construir la app
RUN npm run build

# Servidor
RUN npm install -g serve

# Puerto 81
EXPOSE 81
CMD ["serve", "-s", "build", "-l", "81"]
