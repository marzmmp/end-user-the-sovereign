"""
Kokoro TTS — local, free, offline text-to-speech for the Sovereign stack.
Port 7960 | 3565

POST /tts  { "text": "...", "voice": "af_heart", "speed": 1.0 }
Returns: audio/wav binary

Model files are downloaded by the setup wizard into ./models/ on first run
(kokoro-v1.0.onnx + voices-v1.0.bin). If they're missing, /health reports
model_loaded: false and /tts returns a clear 503 instead of crashing.
"""
import io
import os
import struct
import logging
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kokoro-tts")

app = FastAPI(title="Sovereign Kokoro TTS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

MODEL_DIR   = os.environ.get("KOKORO_MODEL_DIR", "/app/models")
MODEL_PATH  = os.path.join(MODEL_DIR, "kokoro-v1.0.onnx")
VOICES_PATH = os.path.join(MODEL_DIR, "voices-v1.0.bin")

kokoro = None


@app.on_event("startup")
async def load_model():
    global kokoro
    if not (os.path.exists(MODEL_PATH) and os.path.exists(VOICES_PATH)):
        logger.warning("Kokoro model files not found in %s — run the setup wizard with TTS provider = kokoro first.", MODEL_DIR)
        return
    try:
        from kokoro_onnx import Kokoro
        logger.info("Loading Kokoro model...")
        kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
        logger.info("Kokoro model loaded")
    except Exception as e:
        logger.error("Kokoro failed to load: %s", e)


class TTSRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1.0


def samples_to_wav(samples: np.ndarray, sample_rate: int = 24000) -> bytes:
    samples = np.clip(samples, -1.0, 1.0)
    pcm = (samples * 32767).astype(np.int16)
    buf = io.BytesIO()

    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = len(pcm) * 2

    buf.write(b'RIFF')
    buf.write(struct.pack('<I', 36 + data_size))
    buf.write(b'WAVE')
    buf.write(b'fmt ')
    buf.write(struct.pack('<I', 16))
    buf.write(struct.pack('<H', 1))
    buf.write(struct.pack('<H', num_channels))
    buf.write(struct.pack('<I', sample_rate))
    buf.write(struct.pack('<I', byte_rate))
    buf.write(struct.pack('<H', block_align))
    buf.write(struct.pack('<H', bits_per_sample))
    buf.write(b'data')
    buf.write(struct.pack('<I', data_size))
    buf.write(pcm.tobytes())
    return buf.getvalue()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "kokoro-tts",
        "port": 7960,
        "model_loaded": kokoro is not None,
    }


@app.post("/tts")
async def tts(req: TTSRequest):
    if kokoro is None:
        raise HTTPException(status_code=503, detail="Kokoro model not loaded — run setup with TTS provider = kokoro, or switch TTS_PROVIDER to elevenlabs")
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    try:
        samples, sample_rate = kokoro.create(req.text, voice=req.voice, speed=req.speed, lang="en-us")
        wav_bytes = samples_to_wav(samples, sample_rate)
        return Response(content=wav_bytes, media_type="audio/wav", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        logger.error("TTS generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/voices")
async def voices():
    return {
        "voices": [
            {"id": "af_heart",    "desc": "Warm American female (default)"},
            {"id": "af_bella",    "desc": "Calm American female"},
            {"id": "af_nicole",   "desc": "Bright American female"},
            {"id": "am_adam",     "desc": "Deep American male"},
            {"id": "am_michael",  "desc": "Clear American male"},
            {"id": "bf_emma",     "desc": "Warm British female"},
            {"id": "bf_isabella", "desc": "Bright British female"},
            {"id": "bm_george",   "desc": "Authoritative British male"},
            {"id": "bm_lewis",    "desc": "Steady British male"},
            {"id": "af_sky",      "desc": "Smooth American female"},
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7960, log_level="info")
