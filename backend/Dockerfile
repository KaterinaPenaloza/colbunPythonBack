FROM python:3.11-slim

# Directorio de trabajo
WORKDIR /app

COPY . /app

# Instalación de dependencias
RUN pip install -r requirements.txt

# Puerto 80
EXPOSE 80

# Iniciar server.py
CMD ["python", "server.py"]
