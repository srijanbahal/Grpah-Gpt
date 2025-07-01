# AI-Powered Multi-Tool Agent with Real-Time Streaming

This project is a full-stack AI application that combines a Python FastAPI backend with a modern Next.js frontend. It features an intelligent agent powered by Google's Gemini 1.5 Flash model, capable of answering questions using built-in math tools and real-time web search, with responses streamed live to the user interface.

## Features
- **AI Agent**: Uses Gemini 1.5 Flash for natural language understanding and reasoning
- **Math Tools**: Addition, subtraction, multiplication, exponentiation
- **Web Search**: Real-time Google search via SerpAPI
- **Streaming Responses**: See answers and reasoning steps in real time
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Getting Started

### 1. Backend (API)
- Go to the `api` directory:
  ```bash
  cd api
  ```
- Install dependencies (recommended: use a virtual environment):
  ```bash
  pip install -r requirements.txt
  ```
- Set your API keys in a `.env` file:
  ```env
  GEMINI_API_KEY=your_gemini_api_key
  SERPAPI_API_KEY=your_serpapi_api_key
  ```
- Start the API server:
  ```bash
  uvicorn main:app --reload
  ```
- API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (Web App)
- Go to the `app` directory:
  ```bash
  cd app
  ```
- Install dependencies:
  ```bash
  npm install
  ```
- Start the development server:
  ```bash
  npm run dev
  ```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Usage
- Ask questions like:
  - "What is 5+5?"
  - "Tell me the latest world news."
  - "Multiply 7 by 8 and add 10."
- The app will show each reasoning step and the final answer, with sources for web results.

## Notebooks
- `serapi-tool.ipynb`: Prototyping and testing the SerpAPI tool
- `streaming-test.ipynb`: Testing the API's streaming response

## Tech Stack
- **Backend**: Python, FastAPI, LangChain, Gemini API, SerpAPI
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS

---
Feel free to use, modify, and extend this project for your own AI-powered applications!
