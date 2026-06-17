from ultralytics import YOLO
from flask import Flask, request, jsonify
import requests
from PIL import Image
from io import BytesIO
from flask_cors import CORS
import traceback

app = Flask(__name__)
CORS(app)

# Load YOLO model once when application starts
model = YOLO("yolov8n.pt")


@app.route("/detect-person", methods=["POST"])
def detect_person():
    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "JSON body required"
            }), 400

        image_url = data.get("image_url")

        if not image_url:
            return jsonify({
                "success": False,
                "message": "image_url is required"
            }), 400

        print("\n==============================")
        print("IMAGE URL:", image_url)

        response = requests.get(
            image_url,
            timeout=30
        )

        print("STATUS:", response.status_code)
        print(
            "CONTENT TYPE:",
            response.headers.get("content-type")
        )
        print(
            "CONTENT LENGTH:",
            len(response.content)
        )

        # Show first 200 chars for debugging
        try:
            preview = response.text[:200]
            print("PREVIEW:", preview)
        except:
            pass

        if response.status_code != 200:
            return jsonify({
                "success": False,
                "message": f"Failed to download image ({response.status_code})"
            }), 400

        content_type = response.headers.get(
            "content-type",
            ""
        )

        if not content_type.startswith("image"):
            return jsonify({
                "success": False,
                "message": f"URL is not an image. Content-Type: {content_type}"
            }), 400

        image = Image.open(
            BytesIO(response.content)
        )

        results = model(image)

        count = 0

        for box in results[0].boxes:

            cls = int(box.cls[0])

            # COCO class 0 = person
            if cls == 0:
                count += 1

        print("PERSON COUNT:", count)

        return jsonify({
            "success": True,
            "jumlah_orang": count
        })

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "YOLO Face Detector",
        "status": "running"
    })

@app.route("/detect-live", methods=["POST"])
def detect_live():

    try:

        print("\n===== LIVE DETECT =====")

        file = request.files["image"]

        image = Image.open(file)

        results = model(image)

        count = 0

        for box in results[0].boxes:

            cls = int(box.cls[0])

            if cls == 0:
                count += 1

        print("LIVE PERSON:", count)

        return jsonify({
            "success": True,
            "jumlah_orang": count
        })

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    try:

        print("DETECT LIVE HIT")

        file = request.files["image"]

        image = Image.open(file)

        print("IMAGE SIZE:", image.size)

        results = model(image)

        count = 0

        for box in results[0].boxes:

            cls = int(box.cls[0])

            if cls == 0:
                count += 1

        print("PERSON COUNT:", count)

        return jsonify({
            "success": True,
            "jumlah_orang": count
        })

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
    try:

        file = request.files["image"]

        image = Image.open(file)

        results = model(image)

        count = 0

        for box in results[0].boxes:

            cls = int(box.cls[0])

            if cls == 0:
                count += 1

        return jsonify({
            "success": True,
            "jumlah_orang": count
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
        
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
    

