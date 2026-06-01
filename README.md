## Mvskoke Tools
For searching text, audio, and more.  Work in progress.

## Run Backend
Install python.  
Make & start virtual environment:  
`python -m venv .venv`  
`source .venv/bin/activate`  

Install requirements, i.e.:  
`python -m pip install -r requirements.txt`  

run the backend:  
`fastapi dev` 
or  
`uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`

## Run Frontend
`cd frontend/`  
`npm start`
