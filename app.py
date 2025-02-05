import streamlit as st
import requests
import os
from PIL import Image
import PyPDF2
import docx
import io
import base64
import logging
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# Configure page
st.set_page_config(
    page_title="AI Sales Agent Backend Demo/Test",
    page_icon="🤖",
    layout="wide"
)

# Custom CSS
st.markdown("""
    <style>
    .stApp {
        max-width: 1200px;
        margin: 0 auto;
    }
    .upload-section {
        padding: 2rem;
        border-radius: 0.5rem;
        background-color: #f8f9fa;
        margin-bottom: 2rem;
    }
    .chat-section {
        padding: 2rem;
        border-radius: 0.5rem;
        background-color: #f8f9fa;
    }
    </style>
""", unsafe_allow_html=True)

def extract_text_from_pdf(pdf_file):
    """Extract text from PDF file"""
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(docx_file):
    """Extract text from DOCX file"""
    doc = docx.Document(docx_file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def extract_text_from_image(image_file):
    """Extract text from image using OCR (placeholder for now)"""
    # TODO: Implement OCR
    return "Image text extraction not implemented yet"

def process_uploaded_file(uploaded_file):
    """Process uploaded file and extract text"""
    if uploaded_file is None:
        return None
        
    # Get file extension
    file_extension = os.path.splitext(uploaded_file.name)[1].lower()
    
    try:
        if file_extension == '.pdf':
            return extract_text_from_pdf(uploaded_file)
        elif file_extension == '.docx':
            return extract_text_from_docx(uploaded_file)
        elif file_extension in ['.jpg', '.jpeg', '.png']:
            return extract_text_from_image(uploaded_file)
        elif file_extension == '.txt':
            return uploaded_file.getvalue().decode('utf-8')
        else:
            st.error(f"Unsupported file type: {file_extension}")
            return None
    except Exception as e:
        st.error(f"Error processing file: {str(e)}")
        return None

# Main app layout
st.title("AI Sales Agent Backend Demo/Test")

# File upload section
st.header("📄 Document Upload")
with st.container():
    st.markdown("""
        Upload documents to train the AI agent. Supported formats:
        - PDF (.pdf)
        - Word (.docx)
        - Text (.txt)
        - Images (.jpg, .jpeg, .png)
    """)
    
    uploaded_file = st.file_uploader(
        "Choose a file",
        type=['pdf', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
        help="Upload a document to add to the knowledge base"
    )
    
    if uploaded_file:
        with st.spinner("Processing document..."):
            # Extract text from the uploaded file
            extracted_text = process_uploaded_file(uploaded_file)
            
            if extracted_text:
                st.success("Document processed successfully!")
                
                # Show preview
                with st.expander("Preview extracted text"):
                    st.text_area("Extracted content:", extracted_text, height=200)
                
                # Update knowledge base
                try:
                    response = requests.post(
                        "http://localhost:8000/admin/update-knowledge",
                        json={
                            "content": extracted_text,
                            "filename": uploaded_file.name
                        },
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        st.success("Knowledge base updated successfully!")
                    else:
                        try:
                            error_data = response.json()
                            if isinstance(error_data, dict) and 'detail' in error_data:
                                error_msg = error_data['detail'].get('message', str(error_data['detail']))
                            else:
                                error_msg = str(error_data)
                        except:
                            error_msg = response.text
                        st.error(f"Error updating knowledge base: {error_msg}")
                        logger = logging.getLogger(__name__)
                        logger.error(f"Server error response: {error_msg}")
                except requests.exceptions.Timeout:
                    st.error("Request timed out. The server took too long to respond.")
                except requests.exceptions.ConnectionError:
                    st.error("Could not connect to the server. Make sure the backend is running.")
                except Exception as e:
                    st.error(f"Error connecting to backend: {str(e)}")
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error during API call: {str(e)}")

# Chat section
st.header("💬 Chat with AI Agent")
with st.container():
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []

    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Ask a question about the uploaded documents"):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Get AI response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    response = requests.post(
                        "http://localhost:8000/retrieve/",
                        json={"query": prompt}
                    )
                    
                    if response.status_code == 200:
                        ai_response = response.json()["response"]
                        st.markdown(ai_response)
                        # Add AI response to chat history
                        st.session_state.messages.append({"role": "assistant", "content": ai_response})
                    else:
                        st.error(f"Error getting response: {response.json()}")
                except Exception as e:
                    st.error(f"Error connecting to backend: {str(e)}")

# Add a clear chat button
if st.button("Clear Chat"):
    st.session_state.messages = []
    st.experimental_rerun()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    origin = websocket.headers.get('origin')
    if origin not in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        await websocket.close(code=403)
        return
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            response = process_ai_request(data)
            await websocket.send_text(response)
    except WebSocketDisconnect:
        logging.info('WebSocket disconnected')
