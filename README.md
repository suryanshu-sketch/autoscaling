# Intelligent Autoscaling Strategy Evaluation System

An ML-powered web application for evaluating and predicting intelligent cloud autoscaling strategies based on workload patterns, CPU utilization metrics, and instance metrics.

## Features

- **Workload Analysis**: Analyze CPU peaks, average utilization, variance, workload patterns, and duration.
- **ML Evaluation Engine**: Pre-trained machine learning model (`model.pkl`) to recommend optimal autoscaling strategies.
- **Interactive Web Interface**: Guided and expert evaluation workflows with intuitive UI.
- **Flask Backend & Modern Frontend**: Lightweight Python Flask API serving predictions alongside web client assets.

## Architecture & Project Structure

- `client/`: Frontend application files (HTML, JS, CSS, and React/Vite components).
- `server/`: Backend server code (`app.py`) and prediction endpoints.
- `model.pkl`: Serialized machine learning model and pre-processing pipeline.
- `requirements.txt`: Python backend dependencies.
- `package.json`: Node.js frontend tooling and dependencies.

## Getting Started

### 1. Backend Setup (Flask API)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the Flask server
cd server
python app.py
```

### 2. Frontend Setup (Optional / Dev Server)

```bash
pnpm install
pnpm dev
```
