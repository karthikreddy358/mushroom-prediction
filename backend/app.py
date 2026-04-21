import os

from flask import Flask
from flask_cors import CORS
from routes.auth_routes import auth_bp
from routes.predict_routes import predict_bp
from utils.helper import ensure_upload_folder

app = Flask(__name__)
CORS(app)

ensure_upload_folder()

# Register routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(predict_bp, url_prefix="/api")

@app.route("/")
def home():
    return {"message": "Smart Mushroom AI API Running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)