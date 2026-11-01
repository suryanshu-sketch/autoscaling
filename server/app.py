import pickle
from flask import send_from_directory
import pandas as pd
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='client', static_url_path='')
CORS(app)


from flask import send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve(path):
    return send_from_directory(os.path.join(BASE_DIR, 'client'), path)

# Load model
with open('model.pkl', 'rb') as f:
    bundle = pickle.load(f)

model = bundle['model']
label_encoder = bundle['label_encoder']
feature_names = bundle['feature_names']

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        required_fields = [
            'cpu_peak', 'cpu_avg', 'variance',
            'pattern', 'duration_hours', 'instance_count'
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        # Create DataFrame
        input_df = pd.DataFrame([data])

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
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))  # IMPORTANT FIX
    app.run(host='0.0.0.0', port=port)
