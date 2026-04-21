# Smart Mushroom AI - Intelligent Mushroom Farming System

An AI-powered web application for mushroom farmers to analyze mushroom growth stages, track farming analytics, and receive environment recommendations for optimal cultivation conditions.

## Features

Core Features:
- User Authentication - Secure login/register with JWT token-based auth
- AI Image Analysis - Analyze mushroom images to determine growth stage (Immature/Mature/Harvest Ready)
- Analytics Dashboard - Track analysis history with statistics (total analyses, harvest-ready count, immature count, average confidence)
- Data Persistence - All user data stored in Supabase PostgreSQL
- Environment Recommendations - Temperature & humidity guidelines by growth stage
- Responsive Design - Works seamlessly on desktop, tablet, and mobile devices
- Dark Theme UI - Eye-friendly interface with green accents

## Project Structure

mushroom-prediction/
- backend/ - Flask REST API
  - app.py, config.py, extensions.py
  - routes/ - auth_routes.py, predict_routes.py
  - services/ - supabase_service.py, ml_service.py, cloudinary_service.py
  - utils/ - helper.py
  - uploads/ - temporary file storage
- frontend/ - React + Vite SPA
  - src/
    - App.jsx, main.jsx
    - pages/ - LandingPage.jsx, LoginPage.jsx, Dashboard.jsx, EnvironmentRecommendation.jsx
    - services/ - api.js
  - package.json, vite.config.js, index.html
- ml_model/ - PyTorch ML Model
  - main.py, data_split.py
  - models/ - trained model files

## Quick Start

Prerequisites:
- Python 3.8+ (for backend)
- Node.js 16+ (for frontend)
- Git

Backend Setup:
1. Navigate to backend directory
2. Create and activate virtual environment
3. Install dependencies (pip install -r requirements.txt)
4. Configure environment variables in .env file
5. Run backend server (python app.py)
6. Server runs on http://localhost:5000

Frontend Setup:
1. Navigate to frontend directory
2. Install dependencies (npm install)
3. Run development server (npm run dev)
4. App opens at http://localhost:5173

## Environment Variables

Backend requires:
- SUPABASE_URL - Supabase project URL
- SUPABASE_KEY - Supabase API key
- CLOUDINARY_CLOUD_NAME - Cloudinary cloud name
- CLOUDINARY_API_KEY - Cloudinary API key
- CLOUDINARY_API_SECRET - Cloudinary API secret
