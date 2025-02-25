# Usar una imagen de Node
FROM node:20-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY . /app

# Instalar dependencias
RUN npm install

# Construir la app
RUN npm run build

# Instalar un servidor simple para servir el frontend
RUN npm install -g serve

# Exponer el puerto 81
EXPOSE 81

# Servir la app
CMD ["serve", "-s", "build", "-l", "81"]
