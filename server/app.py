import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
CLIENT_DIR = os.path.join(PROJECT_ROOT, 'client')
PUBLIC_DIR = os.path.join(CLIENT_DIR, 'public')

app = Flask(__name__, static_folder=None)
CORS(app)

# Load model from server/ or project root
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(PROJECT_ROOT, 'model.pkl')

with open(MODEL_PATH, 'rb') as f:
    bundle = pickle.load(f)

model = bundle['model']
label_encoder = bundle['label_encoder']
feature_names = bundle['feature_names']


@app.route('/')
def home():
    return send_from_directory(CLIENT_DIR, 'index.html')


@app.route('/<path:path>')
def serve(path):
    """
    Unified static file router serving both client root assets (index.html,
    style.css, script.js) and modular views in client/public/ (guided.html,
    expert.html, result.html).
    """
    # Sub-page fragment requested by index.html loadPages()
    if path == 'index.html':
        if (request.headers.get('X-Page-Fragment') == 'true' or
                request.headers.get('Sec-Fetch-Dest') == 'empty' or
                request.headers.get('X-Requested-With') == 'XMLHttpRequest'):
            public_index = os.path.join(PUBLIC_DIR, 'index.html')
            if os.path.isfile(public_index):
                return send_from_directory(PUBLIC_DIR, 'index.html')
        return send_from_directory(CLIENT_DIR, 'index.html')

    # Check client/ first (for style.css, script.js, etc.)
    client_file = os.path.join(CLIENT_DIR, path)
    if os.path.isfile(client_file):
        return send_from_directory(CLIENT_DIR, path)

    # Check client/public/ (for guided.html, expert.html, result.html, etc.)
    public_file = os.path.join(PUBLIC_DIR, path)
    if os.path.isfile(public_file):
        return send_from_directory(PUBLIC_DIR, path)

    # Fallback to main shell
    index_file = os.path.join(CLIENT_DIR, 'index.html')
    if os.path.isfile(index_file):
        return send_from_directory(CLIENT_DIR, 'index.html')

    return jsonify({'error': f'Resource {path} not found'}), 404


@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({'error': 'No input data provided or invalid JSON'}), 400

        required_fields = [
            'cpu_peak', 'cpu_avg', 'variance',
            'pattern', 'duration_hours', 'instance_count'
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        # Validate and cast numeric fields
        try:
            cpu_peak = float(data['cpu_peak'])
            cpu_avg = float(data['cpu_avg'])
            duration_hours = float(data['duration_hours'])
            instance_count = float(data['instance_count'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid numeric field value'}), 400

        if cpu_peak < cpu_avg:
            return jsonify({'error': 'cpu_peak must be greater than or equal to cpu_avg'}), 400

        # Create DataFrame
        input_df = pd.DataFrame([{
            'cpu_peak': cpu_peak,
            'cpu_avg': cpu_avg,
            'variance': str(data['variance']),
            'pattern': str(data['pattern']),
            'duration_hours': duration_hours,
            'instance_count': instance_count
        }])

        # One-hot encode
        input_encoded = pd.get_dummies(input_df)

        # Match training features
        input_encoded = input_encoded.reindex(columns=feature_names, fill_value=0)

        # Predict
        pred_encoded = model.predict(input_encoded)[0]
        pred_proba = model.predict_proba(input_encoded)[0]

        confidence = float(max(pred_proba))
        strategy = label_encoder.inverse_transform([pred_encoded])[0]

        return jsonify({
            'predicted_strategy': strategy,
            'confidence': confidence,
            'probabilities': {
                label_encoder.inverse_transform([i])[0]: float(prob)
                for i, prob in enumerate(pred_proba)
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'features_count': len(feature_names),
        'strategies': list(label_encoder.classes_)
    }), 200


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
