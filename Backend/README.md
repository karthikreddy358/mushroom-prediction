# Smart Mushroom AI - Backend

FastAPI backend with PostgreSQL database.

## Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE mushroom_db;
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run Server

```bash
python run.py
```

Or using uvicorn directly:

```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info (protected)

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
