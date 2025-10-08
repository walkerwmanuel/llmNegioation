# Project 38: Building Value-Aligned Large Language Models for Cross-Cultural Negotiation

This README provides setup and run instructions for **Project 38**, including how to install the required Python packages and start the frontend/backend server. It serves as a quick-start guide to help you configure the environment, install dependencies, and run the negotiation platform locally for development or testing.


## Installing Packages

Before installing packages, make sure [Python 3](https://www.python.org/downloads/) is installed. This will ensure that Python-based packages can install and execute properly. Verify that Python is installed by running the following command in your terminal: 

```bash
python --version
``` 

There are four packages required to run the environment:
- openai: Official OpenAI library for interacting with OpenAI's API
- fastapi: Web framework for building APIs with Python
- python-dotenv: Loads environment variables from a `.env` file, keeping API keys and configuration secure.
- uvicorn: Server used to run FastAPI applications


To install all packages, run this command in your VS Code terminal: 
```bash
pip install openai fastapi python-dotenv uvicorn
```

## Running Frontend
Before launching the frontend server, ensure that Node Package Manager (npm) is installed. Also note the installation command only has to be run once:

```bash
npm i 
```

Proceed to launch the frontend server:

```bash
npm run dev
```

## Running Backend 
If you're launching the backend for the very first time, a virtual environment `.venv` must be created. This can be done by running the command respective to your operating system: 

```bash
py -m venv .venv              # Windows 
python3 -m venv .venv         # MacOS
```

Activate your virtual environment:

```bash
.\.venv\Scripts\activate.bat. # Windows 
source .venv/bin/activate.    # MacOS 
```

Finally, launch the backend server:

```bash
python -m uvicorn main:app --reload --port 8025
```