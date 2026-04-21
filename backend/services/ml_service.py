import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

def predict_image(image_path):
    try:
        from ml_model.main import predict_image as model_predict
    except ModuleNotFoundError as exc:
        missing_module = getattr(exc, "name", None) or str(exc)
        raise RuntimeError(
            f"Prediction dependencies are not installed or failed to import: {missing_module}. "
            "Install the optional ML stack to use /api/predict."
        ) from exc

    label = model_predict(image_path)

    return [{
        "stage": label,
        "confidence": 1.0  # your model doesn't return confidence
    }]