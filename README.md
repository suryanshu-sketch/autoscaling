# Intelligent Auto-Scaling Strategy Evaluation System

An ML-powered web application that analyzes cloud workload characteristics and recommends optimal auto-scaling strategies using a trained Random Forest model.

---

## 1. Project Overview & Architecture

### System Architecture

The application is containerized as a single unified service for local environments, Docker, and Google Cloud Run:

```
[ Client Browser ]
        │  (HTTP / HTTPS)
        ▼
[ Gunicorn / Flask Web Server (Port 8080) ]
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
* **Target Cloud**: Google Cloud Run (fully managed serverless container platform).

---

## 2. Key Architecture Distinction: Platform Scaling vs. ML Recommendation

> [!IMPORTANT]
> **Advisory ML Model vs. Cloud Run Autoscaling**:
> * **Platform Autoscaling (Google Cloud Run)**: Manages instances of this web application itself, scaling automatically between `min-instances` (0 to save costs) and `max-instances` (e.g. 5) based on concurrent HTTP requests.
> * **ML Recommendation Engine (`model.pkl`)**: An advisory decision-support model. It evaluates workload characteristics (`cpu_peak`, `cpu_avg`, `variance`, `pattern`, `duration_hours`, `instance_count`) and recommends which cloud scaling strategy (`predictive`, `reactive`, `scheduled`, `hybrid`, `queue-based`) an engineer should apply to their own cloud workloads.

---

## 3. Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port on which the Gunicorn server listens (automatically injected by Cloud Run). |
| `FLASK_ENV` | `production` | Running environment mode. |
| `PYTHONUNBUFFERED` | `1` | Enables instantaneous output of Python logs without stream buffering. |

---

## 4. Local Installation & Execution (Direct Python)

### Prerequisites
* Python 3.11+
* Git

### Step-by-Step
```bash
# 1. Clone repository
git clone https://github.com/suryanshu-sketch/autoscaling.git
cd autoscaling

# 2. Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run application
python server/app.py
```
Open `http://localhost:8080` in your browser.

---

## 5. Docker Containerization & Local Testing

### Prerequisites
* Docker Engine / Docker Desktop installed and running.

### Build and Run with Docker
```bash
# Build the Docker image
docker build -t autoscaling-ml-system:latest .

# Run container listening on port 8080
docker run --rm -p 8080:8080 -e PORT=8080 autoscaling-ml-system:latest
```

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

## 6. API Reference & Sample Payloads

### 1. Health Check
* **Endpoint**: `GET /health`
* **Response**:
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
curl -X POST http://localhost:8080/predict \
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
curl -X POST http://localhost:8080/predict \
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

#### Error Handling Examples
* **Missing Fields (400 Bad Request)**:
  ```json
  {"error": "Missing field: cpu_avg"}
  ```
* **Invalid Logic - Peak < Average (400 Bad Request)**:
  ```json
  {"error": "cpu_peak must be greater than or equal to cpu_avg"}
  ```

---

## 7. Google Cloud Run Deployment Guide

### Prerequisites
1. **Google Cloud Account**: Active account with billing enabled.
2. **Google Cloud SDK (`gcloud`)**: Installed and initialized (`gcloud init`).

### Step-by-Step Cloud Deployment

#### 1. Set Google Cloud Project & Region
```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
gcloud config set project $PROJECT_ID
```

#### 2. Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
```

#### 3. Method A: One-Command Source Deployment (Recommended)
Google Cloud Run can build and deploy the container directly from the source repository via Cloud Build:
```bash
gcloud run deploy autoscaling-ml-system \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80
```

#### 4. Method B: Artifact Registry Image Deployment
```bash
# Create repository in Artifact Registry
gcloud artifacts repositories create autoscaling-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for autoscaling system"

# Configure local Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build & Push
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/autoscaling-repo/autoscaling-ml-system:v1 .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/autoscaling-repo/autoscaling-ml-system:v1

# Deploy to Cloud Run
gcloud run deploy autoscaling-ml-system \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/autoscaling-repo/autoscaling-ml-system:v1 \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80
```

### Verification
Upon completion, Cloud Run outputs the public URL:
```bash
# Verify health
curl -f https://<YOUR-CLOUD-RUN-URL>/health

# Verify prediction
curl -X POST https://<YOUR-CLOUD-RUN-URL>/predict \
  -H "Content-Type: application/json" \
  -d '{"cpu_peak":85,"cpu_avg":40,"variance":"high","pattern":"spiky","duration_hours":24,"instance_count":5}'
```

---

## 8. Continuous Deployment (CI/CD) with GitHub Actions

The repository includes a ready-to-use workflow at [`.github/workflows/deploy-cloud-run.yml`](.github/workflows/deploy-cloud-run.yml).

### Setup with Workload Identity Federation (Keyless Security)
1. In Google Cloud Console, configure Workload Identity Federation for your GitHub repository.
2. Grant the service account the `roles/run.admin` and `roles/artifactregistry.writer` roles.
3. Add the following GitHub Repository Secrets:
   * `GCP_PROJECT_ID`: Your Google Cloud Project ID.
   * `GCP_WORKLOAD_IDENTITY_PROVIDER`: `projects/<PROJECT_NUM>/locations/global/workloadIdentityPools/...`
   * `GCP_SERVICE_ACCOUNT`: Service account email.

---

## 9. Cloud Cost & Security Considerations

* **Scale-to-Zero (`min-instances 0`)**: Idle costs are \$0.00. You are only billed when HTTP requests are actively processed.
* **Tier Allowance**: Cloud Run includes 2 million free requests and 360,000 GB-seconds of compute monthly under the Google Cloud Free Tier.
* **Non-Root Container**: Container runs under user `appuser` (UID 1000) rather than root.
* **Memory & CPU Limits**: Capped at 512MiB RAM and 1 vCPU, preventing unexpected resource spikes.

---

## 10. Troubleshooting & Common Errors

* **Error: `InconsistentVersionWarning`**:
  * *Cause*: Pickled model was exported with a different scikit-learn minor version.
  * *Resolution*: Scikit-learn 1.5+ unpickles the bundle without issue. For zero-warning operation, re-export the bundle with the current scikit-learn version.
* **Error: `400 Missing field`**:
  * Ensure all 6 required fields (`cpu_peak`, `cpu_avg`, `variance`, `pattern`, `duration_hours`, `instance_count`) are provided.
* **Error: `cpu_peak must be greater than or equal to cpu_avg`**:
  * Peak utilization cannot be lower than average utilization. Validate form inputs before submission.
