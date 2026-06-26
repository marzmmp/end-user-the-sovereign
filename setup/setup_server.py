#!/usr/bin/env python3
"""Sovereign Setup Server — port 7890 | 3565"""
import http.server, json, os, hashlib, subprocess, threading, socketserver

CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'sovereign.config.json')
SETUP_HTML  = os.path.join(os.path.dirname(__file__), 'index.html')
PORT = 7890

class SetupHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): pass  # suppress default logs

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self._json({'status': 'ok', 'service': 'sovereign-setup', 'port': PORT})
        elif self.path == '/api/config':
            try:
                with open(CONFIG_PATH) as f:
                    self._json(json.load(f))
            except:
                self._json({})
        else:
            try:
                with open(SETUP_HTML, 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(f.read())
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if self.path == '/api/save-config':
            # Hash vault password, save everything else
            if body.get('vault_password'):
                body['vault_password_hash'] = hashlib.sha256(
                    body.pop('vault_password').encode()
                ).hexdigest()
            body['setup_complete'] = True
            with open(CONFIG_PATH, 'w') as f:
                json.dump(body, f, indent=2)
            # Write .env for docker-compose
            self._write_env(body)
            # Launch agents in background
            threading.Thread(target=self._launch, daemon=True).start()
            if body.get('tts_provider') == 'kokoro':
                threading.Thread(target=self._download_kokoro, daemon=True).start()
            self._json({'status': 'ok', 'message': 'Sovereign is launching...'})

        elif self.path == '/api/status':
            try:
                with open(CONFIG_PATH) as f:
                    cfg = json.load(f)
                self._json({'setup_complete': cfg.get('setup_complete', False)})
            except:
                self._json({'setup_complete': False})
        else:
            self.send_response(404); self.end_headers()

    def _write_env(self, cfg):
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        lines = [
            f"BUSINESS_NAME={cfg.get('business_name','')}",
            f"INFERENCE_PROVIDER={cfg.get('inference_provider','openai')}",
            f"OPENAI_API_KEY={cfg.get('openai_api_key','')}",
            f"NVIDIA_NIM_API_KEY={cfg.get('nvidia_nim_api_key','')}",
            f"BRAVE_API_KEY={cfg.get('brave_api_key','')}",
            f"TAVILY_API_KEY={cfg.get('tavily_api_key','')}",
            f"TTS_PROVIDER={cfg.get('tts_provider','elevenlabs')}",
            f"ELEVENLABS_API_KEY={cfg.get('elevenlabs_api_key','')}",
            f"VAULT_PASSWORD_HASH={cfg.get('vault_password_hash','')}",
            "SOVEREIGN_TOKEN=YAHUAH-3565",
        ]
        with open(env_path, 'w') as f:
            f.write('\n'.join(lines))


def _download_kokoro(self):
    """Download Kokoro TTS model in background if selected."""
    kokoro_dir = os.path.join(os.path.dirname(__file__), '..', 'kokoro')
    os.makedirs(kokoro_dir, exist_ok=True)
    model_path = os.path.join(kokoro_dir, 'kokoro-v1.0.onnx')
    if os.path.exists(model_path):
        return  # already downloaded
    try:
        import urllib.request as ur
        url = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v1.0.onnx'
        ur.urlretrieve(url, model_path)
    except Exception as e:
        print(f'[kokoro] download failed: {e}')
    def _launch(self):
        root = os.path.join(os.path.dirname(__file__), '..')
        subprocess.run(['docker-compose', 'up', '-d'], cwd=root, capture_output=True)

    def _json(self, data):
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == '__main__':
    with socketserver.TCPServer(('0.0.0.0', PORT), SetupHandler) as srv:
        print(f'[sovereign-setup] http://localhost:{PORT} | 3565')
        srv.serve_forever()
