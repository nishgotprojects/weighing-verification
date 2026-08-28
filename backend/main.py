from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

@app.get("/list-models")
def list_models():
    models = groq_client.models.list()
    return {"models": [m.id for m in models.data]}

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

    completion = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{req.image_base64}"},
                    },
                ],
            }
        ],
        temperature=0.2,
        max_tokens=300,
    )

    text = completion.choices[0].message.content.strip()
    flagged = "MATCH: NO" in text or "TAMPER_SIGNS: YES" in text

    return {
        "raw_result": text,
        "flagged": flagged,
    }