from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from google import genai
from google.genai import types
import base64
import os
from dotenv import load_dotenv

load_dotenv()
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend is alive"}

@app.get("/test-firebase")
def test_firebase():
    doc_ref = db.collection("test").document("hello")
    doc_ref.set({"status": "connected"})
    return {"firebase": "connected successfully"}

class AnalyzeRequest(BaseModel):
    image_base64: str
    declared_serial: str

@app.post("/analyze-instrument")
def analyze_instrument(req: AnalyzeRequest):
    prompt = f"""You are inspecting a photo of a weighing/measuring instrument for a
government verification system. The owner has declared the serial number as: "{req.declared_serial}".

Look at the image and:
1. Try to read any visible serial number or plate on the instrument.
2. Check for visible signs of tampering (broken seal, scratched/altered plate, missing label).

Respond ONLY in this exact format, nothing else:
DETECTED_SERIAL: <what you read, or "not visible">
MATCH: <YES or NO or UNKNOWN>
TAMPER_SIGNS: <YES or NO>
REASON: <one short sentence>
"""

    image_bytes = base64.b64decode(req.image_base64)
    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")

    response = gemini_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt, image_part],
    )

    text = response.text.strip()
    flagged = "MATCH: NO" in text or "TAMPER_SIGNS: YES" in text

    return {
        "raw_result": text,
        "flagged": flagged,
    }