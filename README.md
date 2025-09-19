Backend Run Command:
for windows virtual enviorment:  
Creates it py -m venv .venv

activates it .\.venv\Scripts\activate.bat

for windows virtual enviorment: 
Creates it python3 -m venv .venv

source .venv/bin/activate

python -m uvicorn main:app --reload --port 8025

Frontend Run Command:

npm i
npm run dev