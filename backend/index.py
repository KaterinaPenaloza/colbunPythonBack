import os
import dotenv
import logging
from langchain_community.vectorstores import FAISS
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Cargar variables de entorno
dotenv.load_dotenv()

# Configuraciones de Azure OpenAI
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_INSTANCE = os.getenv("AZURE_OPENAI_API_INSTANCE_NAME")
AZURE_OPENAI_API_DEPLOYMENT = os.getenv("AZURE_OPENAI_API_DEPLOYMENT_NAME")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME")



VECTOR_STORE_PATH = "./faiss_index"
MAX_CHUNK_SIZE = 300
OVERLAP_SIZE = 100

# Prompt
prompt = ChatPromptTemplate.from_template(
    """Eres un asistente experto en órdenes de compra, BP, solicitud de pedidos y BOFA en SAP con RPA. 
    Responde brevemente, en español, saludando y basándote solo en los documentos proporcionados:

    Contexto: {context}
    Pregunta: {question}
    Respuesta:"""
)

def cargar_documentos_pdf(ruta_directorio):
    """Cargar documentos PDF de un directorio"""
    documentos = []
    try:
        for archivo in os.listdir(ruta_directorio):
            if archivo.endswith('.pdf'):
                ruta_completa = os.path.join(ruta_directorio, archivo)
                loader = PyPDFLoader(ruta_completa)
                documentos.extend(loader.load())
        return documentos
    except Exception as e:
        print(f"Error cargando documentos: {e}")
        return []

def preparar_vector_store(documentos):
    """Preparar vector store con documentos y embeddings de Azure"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=MAX_CHUNK_SIZE,
        chunk_overlap=OVERLAP_SIZE
    )
    split_docs = text_splitter.split_documents(documentos)

    # Embeddings con Azure OpenAI
    embeddings = AzureOpenAIEmbeddings(
        azure_deployment=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        azure_endpoint=AZURE_OPENAI_API_INSTANCE,
        api_key=AZURE_OPENAI_API_KEY,
        api_version=AZURE_OPENAI_API_VERSION
    )
    try:
        test_embedding = embeddings.embed_query("prueba")
        logging.info(f"Embeddings generados correctamente: {test_embedding[:5]}")  # Muestra los primeros valores
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

def crear_cadena_qa(vector_store):
    """Crear la cadena de preguntas y respuestas con Azure OpenAI"""
    try:
        # Configuración del modelo
        model = AzureChatOpenAI(
            azure_deployment=AZURE_OPENAI_API_DEPLOYMENT,
            azure_endpoint=AZURE_OPENAI_API_INSTANCE,
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            temperature=0.5,
            max_tokens=600,
        )

        # Configuración del retriever
        retriever = vector_store.as_retriever(
            search_kwargs={
                "k": 2, 
                "search_type": "similarity"
            }
        )

        # Crear cadena QA con manejo de entrada más flexible
        chain = RetrievalQA.from_chain_type(
            llm=model,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={
                "prompt": prompt, 
                "verbose": True
            },
            return_source_documents=False  # Cambio clave
        )
        logging.info("Cadena QA creada exitosamente")

        return chain

    except Exception as e:
        logging.error(f"Error al crear la cadena QA: {e}", exc_info=True)
        raise

def procesar_pregunta(chain, pregunta):
    try:
        logging.info(f"Procesando pregunta: {pregunta}")
        
        # Método de invocación directo
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
            logging.error(f"Error al invocar la cadena: {invoke_error}", exc_info=True)  # Agregué exc_info para más detalles
            return {"respuesta": f"Error al procesar la pregunta: {repr(invoke_error)}"}  # Usé repr para más claridad
    
    except Exception as error:
        logging.error(f"Error inesperado al procesar pregunta: {error}", exc_info=True)
        return {"respuesta": f"Ocurrió un error al procesar su pregunta: {repr(error)}"}
    


def run(pregunta):
    try:
        # Validaciones iniciales
        if not pregunta:
            return "La pregunta no puede estar vacía."
        if len(pregunta) > 300:
            return "La pregunta excede el límite de 300 caracteres."

        # Cargar documentos
        documentos = cargar_documentos_pdf("./documents")
        
        if not documentos:
            logging.warning("No se encontraron documentos PDF")
            return "No se encontraron documentos PDF para realizar la búsqueda."

        # Preparar vector store
        vector_store = preparar_vector_store(documentos)
        
        # Crear cadena QA
        chain = crear_cadena_qa(vector_store)
        
        # Procesar pregunta
        resultado = procesar_pregunta(chain, pregunta)
        
        return resultado['respuesta']

    except Exception as error:
        logging.error(f"Error crítico en la ejecución: {error}", exc_info=True)
        return f"Ocurrió un error inesperado: {str(error)}"


# Agrega este bloque al final de tu script para probar la función sin frontend
if __name__ == "__main__":
    # Aquí puedes probar con la pregunta que desees
    pregunta = "¿que transaccion se utiliza??"

    # Llama a la función 'run' con la pregunta
    respuesta = run(pregunta)

    # Muestra la respuesta en la consola
    print(f"Respuesta: {respuesta}")