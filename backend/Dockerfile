# Usamos la imagen oficial de Python
FROM python:3.11-slim

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos necesarios
COPY ./backend /app

# Instalamos dependencias (cuando tengas el requirements.txt)
# RUN pip install -r requirements.txt

# Para probar, instalamos Flask directamente
RUN pip install flask

# Exponemos el puerto 80
EXPOSE 80

# Corremos el server.py
CMD ["python", "server.py"]
