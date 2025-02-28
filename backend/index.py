import os
import dotenv
from langchain_community.vectorstores import FAISS
from langchain_fireworks import FireworksEmbeddings
from langchain_fireworks import ChatFireworks
from langchain.chains import RetrievalQA
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Cargar variables de entorno
dotenv.load_dotenv()

# Configuraciones
VECTOR_STORE_PATH = "./faiss_index"
MAX_CHUNK_SIZE = 600
OVERLAP_SIZE = 150

# Prompt
prompt = ChatPromptTemplate.from_template(
    """Eres un asistente encargado de ayudar a usuarios a crear órdenes de compra, bp, solicitud de pedidos, 
    bofa, con rpa en SAP. Responde brevemente, en español, siendo amable, saludando y estrictamente basándote
    en los documentos proporcionados:
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
    """Preparar vector store con documentos"""
    # Dividir documentos en fragmentos
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=MAX_CHUNK_SIZE,
        chunk_overlap=OVERLAP_SIZE
    )
    split_docs = text_splitter.split_documents(documentos)

    # Crear embeddings
    embeddings = FireworksEmbeddings(
        api_key=os.getenv("FIREWORKS_API_KEY"),
        model="nomic-ai/nomic-embed-text-v1.5"
    )

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
    """Crear cadena de recuperación de preguntas y respuestas"""
    # Modelo de chat
    model = ChatFireworks(
        api_key=os.getenv("FIREWORKS_API_KEY"),
        model="accounts/fireworks/models/llama-v3p1-8b-instruct",
        temperature=0.6,
        max_tokens=600,
    )

    # Configurar retriever
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 3,
            "search_type": "similarity"
        }
    )

    # Crear cadena de recuperación
    chain = RetrievalQA.from_chain_type(
        llm=model,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={
            "prompt": prompt,
            "verbose": False
        },
        return_source_documents=False
    )
    return chain

def procesar_pregunta(chain, pregunta):
    try:
        resultado = chain.invoke({"query": pregunta})
        
        return {
            "respuesta": resultado.get('result', 'No pude encontrar una respuesta.'),
        }
    except Exception as error:
        return {
            "respuesta": f"Error al procesar la pregunta: {str(error)}",
        }

def run(pregunta):
    if len(pregunta) > 300:
        return "La pregunta excede el límite de 300 caracteres."

    documentos = cargar_documentos_pdf("./documents")
    
    if not documentos:
        return "No se encontraron documentos PDF."
    
    vector_store = preparar_vector_store(documentos)
    chain = crear_cadena_qa(vector_store)
    resultado = procesar_pregunta(chain, pregunta)
    return resultado['respuesta']