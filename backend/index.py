import os
import dotenv
import logging
from langchain_community.vectorstores import FAISS
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from azure.storage.blob import BlobServiceClient

# Variables de entorno
dotenv.load_dotenv()
# Configuraciones de Azure OpenAI
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_INSTANCE = os.getenv("AZURE_OPENAI_API_INSTANCE_NAME")
AZURE_OPENAI_API_DEPLOYMENT = os.getenv("AZURE_OPENAI_API_DEPLOYMENT_NAME")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME")
# Configuraciones de Blob Storage
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
CONTAINER_NAME = os.getenv("BLOB_CONTAINER_NAME")
# Vectorización
VECTOR_STORE_PATH = "./faiss_index"
MAX_CHUNK_SIZE = 600
OVERLAP_SIZE = 150
# Configuración modelo
MAX_TOKENS = 600
TEMPERATURE = 0.5

# Prompt
prompt = ChatPromptTemplate.from_template(
    """
    Eres un asistente experto en órdenes de compra, BP, solicitud de pedidos y BOFA en SAP con RPA. 
    Responde brevemente, en español, saludando y basándote solo en los documentos proporcionados:

    Contexto: {context}
    Pregunta: {question}
    Respuesta:
    """
)



""" Cargar documentos PDF de un directorio, en este caso localmente desde la carpeta ./documents"""
def cargar_documentos(ruta_directorio):
    documentos = []
    try:
        for archivo in os.listdir(ruta_directorio):
            if archivo.endswith('.pdf'):
                ruta_completa = os.path.join(ruta_directorio, archivo)
                loader = PyPDFLoader(ruta_completa)
                documentos.extend(loader.load())
        return documentos
    except Exception as e:
        print(f"Error al cargar documentos: {e}")
        return []

""" Preparar vector store con los documentos cargados y embeddings de Azure """
def crear_vector_store(documentos):
    # Crear chunks de texto
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=MAX_CHUNK_SIZE,
        chunk_overlap=OVERLAP_SIZE
    )
    split_docs = text_splitter.split_documents(documentos)

    # Embeddings de Azure OpenAI
    embeddings = AzureOpenAIEmbeddings(
        azure_deployment=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        azure_endpoint=AZURE_OPENAI_API_INSTANCE,
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION
    )

    # Test de embeddings
    try:
        test_embedding = embeddings.embed_query("prueba")
        logging.info(f"Embeddings generados correctamente: {test_embedding[:5]}")
    except Exception as e:
        logging.error(f"Error al generar embeddings: {e}", exc_info=True)
        raise

    # Crear o cargar vector store
    if os.path.exists(VECTOR_STORE_PATH):
        try:
            vector_store = FAISS.load_local(
                VECTOR_STORE_PATH, 
                embeddings,
                allow_dangerous_deserialization=True
            )
        except:
            vector_store = FAISS.from_documents(split_docs, embeddings)
            vector_store.save_local(VECTOR_STORE_PATH)
    else:
        vector_store = FAISS.from_documents(split_docs, embeddings)
        vector_store.save_local(VECTOR_STORE_PATH)
    return vector_store

""" Crear la cadena de preguntas y respuestas """
def crear_cadena_qa(vector_store):
    try:
        # Configuración del modelo
        model = AzureChatOpenAI(
            azure_deployment=AZURE_OPENAI_API_DEPLOYMENT,
            azure_endpoint=AZURE_OPENAI_API_INSTANCE,
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )

        # Configuración del retriever
        retriever = vector_store.as_retriever(
            search_kwargs={
                "k": 2, 
                "search_type": "similarity"
            }
        )

        # Crear cadena QA
        chain = RetrievalQA.from_chain_type(
            llm=model,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={
                "prompt": prompt, 
                "verbose": True
            },
            return_source_documents=False
        )
        return chain

    except Exception as e:
        logging.error(f"Error al crear la cadena QA: {e}", exc_info=True)
        raise

def procesar_pregunta(chain, pregunta):
    try:
        logging.info(f"Procesando pregunta: {pregunta}")
        try:
            resultado = chain.invoke({"query": pregunta})
            
            # Extraer respuesta
            if isinstance(resultado, dict):
                respuesta = resultado.get('result', 'No se pudo generar respuesta')
            else:
                respuesta = str(resultado)
            
            logging.info(f"Respuesta generada: {respuesta}")
            return {"respuesta": respuesta}
        
        except Exception as invoke_error:
            logging.error(f"Error al invocar la cadena: {invoke_error}", exc_info=True)
            return {"respuesta": f"Error al procesar la pregunta: {repr(invoke_error)}"}
        
    except Exception as error:
        logging.error(f"Error inesperado al procesar pregunta: {error}", exc_info=True)
        return {"respuesta": f"Ocurrió un error al procesar su pregunta: {repr(error)}"}


# Implementación de caché para preguntas
def consultar_cache(pregunta):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=pregunta)
        stream = blob_client.download_blob()
        return stream.readall().decode("utf-8")
    except Exception as e:
        return None

def guardar_en_cache(pregunta, respuesta):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=pregunta)
        blob_client.upload_blob(respuesta.encode("utf-8"), overwrite=True)
    except Exception as e:
        logging.error(f"Error al guardar en caché: {e}", exc_info=True)



def run(pregunta):
    try:
        # Validaciones preguntas
        if not pregunta:
            return "La pregunta no puede estar vacía."
        if len(pregunta) > 300:
            return "La pregunta excede el límite de 300 caracteres."

        # Verificar caché
        respuesta_cache = consultar_cache(pregunta)
        if respuesta_cache:
            logging.info(f"Respuesta encontrada en caché: {respuesta_cache}")
            return respuesta_cache

        # Cargar documentos
        documentos = cargar_documentos("./documents")
        if not documentos:
            logging.warning("No se encontraron documentos PDF")
            return "No se encontraron documentos PDF para realizar la búsqueda."

        # Preparar vector store
        vector_store = crear_vector_store(documentos)
        # Crear cadena QA
        chain = crear_cadena_qa(vector_store)
        # Procesar pregunta
        resultado = procesar_pregunta(chain, pregunta)
        respuesta = resultado['respuesta']

        # Guardar en caché
        guardar_en_cache(pregunta, respuesta)

        return respuesta

    except Exception as error:
        logging.error(f"Error crítico en la ejecución: {error}", exc_info=True)
        return f"Ocurrió un error inesperado: {str(error)}"



# probar el code sin frontend
""" if __name__ == "__main__":
    pregunta = "¿que transacción se utiliza??"
    respuesta = run(pregunta)
    print(f"Respuesta: {respuesta}") """


