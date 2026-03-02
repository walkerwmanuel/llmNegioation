# Project 38: Building Value-Aligned Large Language Models for Cross-Cultural Negotiation

This README provides setup and run instructions for **Project 38**, including how to install the required Python packages and start the frontend/backend server. It serves as a quick-start guide to help you configure the environment, install dependencies, and run the negotiation platform locally for development or testing.

## Direct Access Web Link
[Vercel Link](https://llm-negioation-oijz.vercel.app/)

## Environment Setup

### Frontend Environment Files

The frontend uses Vite with environment-specific configuration:

- `.env.development` - Used when running `npm run dev`
- `.env.production` - Used when running `npm run prod` or `npm run build:prod`

**Required environment variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `your_client_id.apps.googleusercontent.com` |
| `VITE_APP_NAME` | Application display name | `AI Negotiations` |
| `VITE_FRONTEND_THEME` | Optional theme override (see Theme Customization) | `""` |

### Backend Environment Files

The backend uses environment-specific configuration:

- `.env.development` - Development settings
- `.env.production` - Production settings
- `.env` - Active environment (gitignored, copy from template)

**Required environment variables:**

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `JWT_SECRET_KEY` | Secret key for JWT token signing |
| `FRONTEND_URL` | Frontend URL for CORS |
| `OPENAI_API_KEY` | OpenAI API key for AI features |

### Theme Customization

You can customize the app's theme colors by setting `VITE_FRONTEND_THEME`:

**Option 1: JSON string**
```env
VITE_FRONTEND_THEME='{"primary":"#CC0000","accent":"#CC0000","authBg":"#CC0000","authFg":"#fff"}'
```

**Option 2: URL to theme JSON**
```env
VITE_FRONTEND_THEME=https://example.com/theme.json
```

**Theme JSON format:**
```json
{
  "primary": "#CC0000",
  "accent": "#CC0000",
  "muted": "#a7b0c6",
  "authBg": "#CC0000",
  "authFg": "#ffffff"
}
```

## Installing Packages for User Hosted Sessions

Before installing packages, make sure [Python 3](https://www.python.org/downloads/) is installed. This will ensure that Python-based packages can install and execute properly. Verify that Python is installed by running the following command in your terminal:

```bash
python --version
```

There are six packages required to run the environment:
- **fastapi**: Web framework for building APIs with Python
- **openai**: Official OpenAI library for interacting with OpenAI's API
- **python-dotenv**: Loads environment variables from a `.env` file, keeping API keys and configuration secure
- **python-multipart**: Handles file data and form uploads
- **uvicorn**: Server used to run FastAPI applications
- **vite**: Provides development server for frontend


To install all packages, run this command in your VS Code terminal:
```bash
pip install fastapi openai python-dotenv python-multipart uvicorn vite
```

## Running Frontend

Before launching the frontend server, ensure that [Node Package Manager (npm)](https://nodejs.org/en/download) is installed.

### Install Dependencies (first time only)
```bash
cd frontend
npm install
```

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with hot reload (uses `.env.development`) |
| `npm run prod` | Build and preview production (uses `.env.production`, serves on port 5000) |
| `npm run build` | Build for production |
| `npm run build:prod` | Build with production mode explicitly |
| `npm run lint` | Run ESLint |

### Development Mode
```bash
npm run dev
```
Opens at http://localhost:5173 with hot module replacement.

### Production Preview
```bash
npm run prod
```
Builds the app and serves at http://localhost:5000.

## Running Backend

### First-Time Setup

Create a virtual environment:
```bash
cd backend
python3 -m venv .venv         # macOS/Linux
py -m venv .venv              # Windows
```

Activate your virtual environment:
```bash
source .venv/bin/activate     # macOS/Linux
.\.venv\Scripts\activate.bat  # Windows
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Copy environment template:
```bash
cp .env.development .env
# Edit .env with your actual values
```

### Start the Server
```bash
python -m uvicorn main:app --reload --port 8025
```

## CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Builds and lints the frontend
- Installs backend dependencies
- Deploys on push to main branch

Required GitHub Secrets for deployment:
- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `PROD_API_URL`
