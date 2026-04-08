import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_model.main import predict_image as model_predict

def predict_image(image_path):
    label = model_predict(image_path)

    return [{
        "stage": label,
        "confidence": 1.0  # your model doesn't return confidence
    }]