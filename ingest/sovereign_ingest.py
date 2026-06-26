#!/usr/bin/env python3
"""
Sovereign Knowledge Ingest CLI
Walks a folder, reads PDFs/Word/markdown, pushes to Yahseed.
Usage: python3 sovereign_ingest.py /path/to/docs
3565
"""
import os, sys, json, hashlib, requests
from pathlib import Path

YAHSEED_URL = "http://localhost:7006/api/ingest"
TOKEN = os.getenv("SOVEREIGN_TOKEN", "YAHUAH-3565")
SUPPORTED = {".pdf", ".docx", ".txt", ".md", ".csv"}

def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    try:
        if suffix == ".pdf":
            import PyPDF2
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                return " ".join(p.extract_text() or "" for p in reader.pages)
        elif suffix == ".docx":
            import docx
            doc = docx.Document(str(path))
            return " ".join(p.text for p in doc.paragraphs)
        elif suffix in {".txt", ".md", ".csv"}:
            return path.read_text(errors="ignore")
    except Exception as e:
        print(f"  ⚠️  {path.name}: {e}")
    return ""

def ingest(folder: str):
    folder_path = Path(folder)
    if not folder_path.exists():
        print(f"❌ Folder not found: {folder}"); sys.exit(1)

    files = [f for f in folder_path.rglob("*") if f.suffix.lower() in SUPPORTED]
    print(f"\n[ingest] Found {len(files)} files in {folder}\n")

    success = 0
    for f in files:
        text = extract_text(f)
        if not text.strip():
            print(f"  ⚠️  {f.name}: empty"); continue

        payload = {
            "source": str(f),
            "filename": f.name,
            "content": text[:8000],
            "hash": hashlib.md5(text.encode()).hexdigest()
        }
        try:
            r = requests.post(YAHSEED_URL, json=payload,
                headers={"Authorization": f"Bearer {TOKEN}"}, timeout=15)
            if r.ok:
                print(f"  ✅ {f.name}")
                success += 1
            else:
                print(f"  ❌ {f.name}: HTTP {r.status_code}")
        except Exception as e:
            print(f"  ❌ {f.name}: {e}")

    print(f"\n[ingest] {success}/{len(files)} documents ingested.\n")

if __name__ == "__main__":
    folder = sys.argv[1] if len(sys.argv) > 1 else "."
    ingest(folder)
