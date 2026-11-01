# Intelligent Auto-Scaling Strategy Evaluation System

An ML-powered web application that analyzes cloud workload characteristics and recommends optimal auto-scaling strategies using a trained Random Forest model.

---

## 1. Project Overview & Architecture

### System Architecture

The application is containerized as a single unified service for local environments, Docker, and Render:

```
[ Client Browser ]
        │  (HTTPS)
        ▼
[ Render Cloud / Gunicorn Web Server ]
        ├── /               ──> client/index.html (Master Shell)
        ├── /style.css      ──> client/style.css
        ├── /script.js      ──> client/script.js
        ├── /*.html         ──> client/public/*.html (Guided, Expert, Result modular views)
        ├── GET  /health    ──> Health check probe {"status": "healthy", ...}
        └── POST /predict   ──> Scikit-Learn ML Inference Engine (model.pkl)
                                      │
                                      ▼
                      [ RandomForestClassifier (10 features) ]
                                      │
                                      ▼
                      Returns: Recommended strategy, confidence,
                               and full probability distribution
```

### Technology Stack
* **Backend API**: Python 3.11, Flask, Flask-CORS, Gunicorn WSGI.
* **ML Model**: Scikit-Learn `RandomForestClassifier`, Joblib/Pickle, Pandas, NumPy.
* **Frontend**: Vanilla HTML5, CSS3, JavaScript (modular single-page interface with Guided questionnaire and Expert metric inputs).
* **Containerization**: Docker, Docker Compose, Linux non-root container user (`appuser`).
* **Cloud Platform**: [Render](https://render.com) (Automated Docker deployment with health probes and zero-config SSL).

---

## 2. Docker Containerization & Local Testing

### Prerequisites
* Docker Engine / Docker Desktop installed and running.

### Build and Run with Docker
```bash
# 1. Build the Docker image
docker build -t autoscaling-ml-system:latest .

# 2. Run container listening on port 8080
docker run --rm -p 8080:8080 -e PORT=8080 autoscaling-ml-system:latest
```
Access the application at `http://localhost:8080`.

### Run with Docker Compose
```bash
# Start container in detached mode
docker compose up -d

# Check health and status
docker compose ps

# View live logs
docker compose logs -f

# Stop container
docker compose down
```

---

## 3. Render Deployment Guide (Docker Runtime)

The repository includes a production [`render.yaml`](render.yaml) Blueprint and a hardened [`Dockerfile`](Dockerfile) ready for 1-click deployment on Render.

### Method 1: Deploy with Render Blueprint (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/suryanshu-sketch/autoscaling`.
4. Render will automatically detect [`render.yaml`](render.yaml).
5. Click **Apply**. Render will:
   * Build the Docker container.
   * Configure port routing dynamically.
   * Monitor health at `/health`.
   * Assign a public HTTPS URL (e.g. `https://autoscaling-ml-system.onrender.com`).

### Method 2: Deploy as a Standard Docker Web Service
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository `suryanshu-sketch/autoscaling`.
3. Choose the **Docker** environment (Render detects `Dockerfile` at the root).
4. Set the **Region** (e.g. Oregon or Frankfurt).
5. Set the **Health Check Path** to `/health`.
6. Select the **Free** instance type.
7. Click **Create Web Service**.

### Continuous Deployment
Every subsequent `git push origin main` to your GitHub repository automatically triggers a Docker build and rolling redeploy on Render with zero downtime.

---

## 4. API Reference & Sample Payloads

### 1. Health Check
* **Endpoint**: `GET /health`
* **Response (200 OK)**:
```json
{
  "features_count": 10,
  "model_loaded": true,
  "status": "healthy",
  "strategies": [
    "hybrid",
    "predictive",
    "queue-based",
    "reactive",
    "scheduled"
  ]
}
```

### 2. Strategy Prediction
* **Endpoint**: `POST /predict`
* **Headers**: `Content-Type: application/json`

#### Example 1: Spiky Workload (Recommends Predictive)
```bash
curl -X POST https://<YOUR-RENDER-URL>/predict \
  -H "Content-Type: application/json" \
  -d '{
    "cpu_peak": 85,
    "cpu_avg": 40,
    "variance": "high",
    "pattern": "spiky",
    "duration_hours": 24,
    "instance_count": 5
  }'
```
**Response (200 OK)**:
```json
{
  "confidence": 0.91,
  "predicted_strategy": "predictive",
  "probabilities": {
    "hybrid": 0.0,
    "predictive": 0.91,
    "queue-based": 0.01,
    "reactive": 0.01,
    "scheduled": 0.07
  }
}
```

#### Example 2: Stable Workload (Recommends Scheduled)
```bash
curl -X POST https://<YOUR-RENDER-URL>/predict \
  -H "Content-Type: application/json" \
  -d '{
    "cpu_peak": 50,
    "cpu_avg": 30,
    "variance": "low",
    "pattern": "stable",
    "duration_hours": 24,
    "instance_count": 2
  }'
```
**Response (200 OK)**:
```json
{
  "confidence": 0.83,
  "predicted_strategy": "scheduled",
  "probabilities": {
    "hybrid": 0.0,
    "predictive": 0.0,
    "queue-based": 0.16,
    "reactive": 0.01,
    "scheduled": 0.83
  }
}
```

---

## 5. Local Direct Python Execution

```bash
# 1. Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start development server
python server/app.py
```
Open `http://localhost:8080` in your web browser.

---

## 6. Key Architecture Distinction: Platform Scaling vs. ML Recommendation

> [!IMPORTANT]
> **Advisory ML Model vs. Cloud Autoscaling**:
> * **Platform Autoscaling (Render)**: Dynamically scales web service instances or manages request queues for the application containers.
> * **ML Recommendation Engine (`model.pkl`)**: An advisory decision-support model. It evaluates workload characteristics (`cpu_peak`, `cpu_avg`, `variance`, `pattern`, `duration_hours`, `instance_count`) and recommends which cloud scaling strategy (`predictive`, `reactive`, `scheduled`, `hybrid`, `queue-based`) should be applied to target infrastructure.
