from flask import Flask, request, send_file, jsonify
import numpy as np
import cv2
from PIL import Image
import io, datetime, os
import tensorflow as tf
from huggingface_hub import snapshot_download
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://artifice-nexus-1.onrender.com"}})  # Allow React to call Flask

os.makedirs("outputs", exist_ok=True)

# Load model once
model_path = snapshot_download("sayakpaul/whitebox-cartoonizer")
cartoonizer_model = tf.saved_model.load(model_path)

def preprocess_image(img: np.ndarray) -> tf.Tensor:
    h, w, _ = img.shape
    max_dim = 720
    if min(h, w) > max_dim:
        if h > w:
            new_h = int(max_dim * h / w)
            new_w = max_dim
        else:
            new_h = max_dim
            new_w = int(max_dim * w / h)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    h2 = (img.shape[0] // 8) * 8
    w2 = (img.shape[1] // 8) * 8
    img = img[:h2, :w2, :].astype(np.float32) / 127.5 - 1.0
    img = np.expand_dims(img, axis=0)
    return tf.constant(img)

def postprocess(tensor: tf.Tensor) -> Image.Image:
    arr = tensor.numpy()[0]
    arr = (arr + 1.0) * 127.5
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    arr = cv2.cvtColor(arr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(arr)

def pencil_sketch(img_rgb):
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    inv = 255 - gray
    blur = cv2.GaussianBlur(inv, (21, 21), 0)
    sketch = cv2.divide(gray, 255 - blur, scale=256)
    return Image.fromarray(sketch)

def oil_painting_soft(img_rgb):
    img_bilateral = cv2.bilateralFilter(img_rgb, 9, 100, 100)
    img_edge = cv2.edgePreservingFilter(img_bilateral, flags=1, sigma_s=80, sigma_r=0.3)
    img_soft = cv2.detailEnhance(img_edge, sigma_s=10, sigma_r=0.15)
    return Image.fromarray(img_soft)

@app.route("/stylize", methods=["POST"])
def stylize():
    file = request.files["image"]
    style = request.form.get("style", "White-box Cartoonizer")

    img = Image.open(file).convert("RGB")
    img_np = np.array(img)

    if style == "White-box Cartoonizer":
        img_input = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        tensor_input = preprocess_image(img_input)
        out = cartoonizer_model.signatures["serving_default"](tensor_input)["final_output:0"]
        output_img = postprocess(out)
    elif style == "Pencil Sketch":
        output_img = pencil_sketch(img_np)
    else:
        output_img = oil_painting_soft(img_np)

    buf = io.BytesIO()
    output_img.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png")

@app.route("/")
def home():
    return jsonify({"message": "AI Artifice Nexus Backend Running 🚀"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
