import os
import torch
import numpy as np
import torchvision.transforms as transforms
from PIL import Image
from flask import Flask, request, jsonify
import requests
import cv2
import gc
import urllib.parse  
from flask_cors import CORS

# --- FIRESTORE & EMAIL IMPORTS ---
from google.cloud import firestore
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- CRITICAL OPTIMIZATIONS ---
# Disable memory-heavy gradient tracking globally
torch.set_grad_enabled(False)  

# --- FIRESTORE INITIALIZATION ---
# Explicitly connect to the 'ecolens' database instead of the default one
db = firestore.Client(project="handy-buttress-498313-r2", database="ecolens")

app = Flask(__name__)

CORS(app)

# --- CONFIGURATION ---
MODEL_FILENAME = os.getenv("MODEL_FILENAME", "model.pt")
DETECTOR_FILENAME = os.getenv("DETECTOR_FILENAME", "mdv5a.pt")

print(f"Loading SpeciesNet: {MODEL_FILENAME}", flush=True)
model = torch.load(MODEL_FILENAME, map_location="cpu", weights_only=False)
model.eval()

# --- LOAD MEGADETECTOR ONCE GLOBALLY ---
from megadetector.detection import run_detector
print(f"Loading MegaDetector: {DETECTOR_FILENAME}", flush=True)
megadetector_model = run_detector.load_detector(DETECTOR_FILENAME)

transform = transforms.Compose([
    transforms.Resize((480, 480)),
    transforms.ToTensor(),
])

CLASSES = [
    "Alectura_lathami", "Antechinus_agilis", "Bos_taurus",
    "Burhinus_grallarius", "Canis_familiaris", "Chalcophaps_longirostris",
    "Colluricincla_harmonica", "Corcorax_melanorhamphos", "Dacelo_novaeguineae",
    "Dama_dama", "Eopsaltria_australis", "Felis_catus", "Geopelia_humeralis",
    "Gymnorhina_tibicen", "Homo_sapiens", "Isoodon_macrourus",
    "Lepus_europaeus", "Macropus_giganteus", "Menura_novaehollandiae",
    "Mus_musculus", "Oryctolagus_cuniculus", "Perameles_nasuta",
    "Pitta_versicolor", "Rattus", "Rattus_fuscipes", "Rattus_rattus",
    "Strepera_graculina", "Sus_scrofa", "Tachyglossus_aculeatus",
    "Thylogale_stigmatica", "Trichosurus_caninus", "Trichosurus_cunninghami",
    "Trichosurus_vulpecula", "Varanus_varius", "Vombatus_ursinus",
    "Vulpes_vulpes", "Wallabia_bicolor", "Canis_dingo", "Capra_hircus",
    "Casuarius_casuarius", "Heteromyias_cinereifrons",
    "Hypsiprymnodon_moschatus", "Megapodius_reinwardt",
    "Notamacropus_rufogriseus", "Orthonyx_spaldingii", "Uromys_caudimaculatus",
]
CONF_THRESHOLD = 0.05
SNIP_SIZE = 600


# --- NOTIFICATION endpoint ---
@app.route('/notify', methods=['POST'])
def notify():
    """Independent API endpoint to send email alerts based on tags."""
    data = request.json
    detected_tags_dict = data.get('tags')
    media_url = data.get('url')

    if not detected_tags_dict or not media_url:
        return jsonify({"error": "Missing 'tags' dictionary or 'url' in payload"}), 400

    SENDER_EMAIL = "kalanasasanka24@gmail.com"
    SENDER_PASSWORD = "pgpq qbtm fndf ceil" 
    
    tags_list = list(detected_tags_dict.keys())
    emails_to_notify = set()

    # Query Firestore for users subscribed to these tags
    try:
        for tag in tags_list:
            docs = db.collection('subscriptions').where('tags', 'array_contains', tag).stream()
            for doc in docs:
                emails_to_notify.add(doc.id)
    except Exception as e:
        print(f"Firestore query failed: {str(e)}", flush=True)
        return jsonify({"error": "Database query failed"}), 500

    if not emails_to_notify:
        return jsonify({"message": "No subscribers found for these tags. No emails sent."}), 200

    # Connect to Gmail and send the alerts
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        emails_sent_count = 0

        for recipient_email in emails_to_notify:
            user_data = db.collection('subscriptions').document(recipient_email).get().to_dict()
            user_tags = user_data.get('tags', []) if user_data else []
            matched_tags = [t for t in tags_list if t in user_tags]

            msg = MIMEMultipart()
            msg['From'] = SENDER_EMAIL
            msg['To'] = recipient_email
            msg['Subject'] = f"EcoLens Alert: Wildlife Detected!"
            
            body = f"Good news!\n\nA new media file containing {', '.join(matched_tags)} was just processed by EcoLens.\n\nView it here: {media_url}"
            msg.attach(MIMEText(body, 'plain'))

            server.send_message(msg)
            emails_sent_count += 1
            print(f"Successfully sent email alert to {recipient_email}", flush=True)

        server.quit()
        return jsonify({"message": f"Successfully sent {emails_sent_count} emails!"}), 200
        
    except Exception as e:
        print(f"Failed to send emails: {str(e)}", flush=True)
        return jsonify({"error": f"SMTP failure: {str(e)}"}), 500


# --- PROCESSING LOGIC ---
def process_frame(img):
    """Runs MegaDetector + SpeciesNet on an ALREADY LOADED PIL Image object."""
    
    W, H = img.size
    
    result = megadetector_model.generate_detections_one_image(img, "memory_image")
    detections = result.get("detections", []) if result else []
    
    tag_counts = {}

    for det in detections:
        if det.get("category") != "1" or det.get("conf", 0) < CONF_THRESHOLD:
            continue
        x, y, w, h = det["bbox"]
        crop = img.crop((int(x*W), int(y*H), int((x+w)*W), int((y+h)*H)))
        crop = crop.resize((SNIP_SIZE, SNIP_SIZE), Image.BILINEAR)

        with torch.no_grad():
            img_t = transform(crop).unsqueeze(0).permute(0, 2, 3, 1)
            logits = model(img_t)
            probs = torch.softmax(logits, dim=1)[0].numpy()
            pred_idx = int(np.argmax(probs))
            
            if pred_idx < len(CLASSES):
                species = CLASSES[pred_idx]
                tag_counts[species] = tag_counts.get(species, 0) + 1
            else:
                print(f"Warning: Model predicted index {pred_idx}", flush=True)
            
            del img_t
            del logits
            del probs

    del img
    gc.collect()
            
    return tag_counts

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    url = data.get('url')
    
    local_path = "/tmp/input_file"
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    except Exception as e:
        return jsonify({"error": f"Failed to download file: {str(e)}"}), 400

    all_tag_counts = {}

    def merge_counts(source_dict):
        for species, count in source_dict.items():
            all_tag_counts[species] = max(all_tag_counts.get(species, 0), count)

    parsed_url = urllib.parse.urlparse(url)
    clean_path = urllib.parse.unquote(parsed_url.path)
    
    print(f"Processing file: {clean_path}", flush=True)

    if clean_path.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        print("Identified as VIDEO. Starting OpenCV...", flush=True)
        cap = cv2.VideoCapture(local_path)
        frame_idx = 0
        
        SECONDS_TO_SKIP = 1 
        
        while cap.isOpened():
            cap.set(cv2.CAP_PROP_POS_MSEC, frame_idx * 1000)
            ret, frame = cap.read()
            if not ret: break
            
            frame = cv2.resize(frame, (1280, 720))
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            
            frame_counts = process_frame(pil_img)
            merge_counts(frame_counts)
            
            frame_idx += SECONDS_TO_SKIP
            
        cap.release()
    else:
        print("Identified as IMAGE. Starting PIL...", flush=True)
        img = Image.open(local_path).convert("RGB")
        image_counts = process_frame(img)
        merge_counts(image_counts)

    gc.collect()

    return jsonify({"tags": all_tag_counts})

@app.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.json
    email = data.get('email')
    species_tags = data.get('species_tags')

    if not email or not species_tags or not isinstance(species_tags, list):
        return jsonify({"error": "Missing email or species_tags must be a list"}), 400

    try:
        doc_ref = db.collection('subscriptions').document(email)
        
        doc_ref.set({
            'tags': firestore.ArrayUnion(species_tags)
        }, merge=True)

        return jsonify({
            "message": f"Successfully subscribed to {len(species_tags)} species!",
            "tags": species_tags
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)