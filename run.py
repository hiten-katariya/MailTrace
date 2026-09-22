import sys
import os

# Ensure project root is in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Support case-insensitive module resolution on Windows (Backend vs backend)
try:
    import Backend
    sys.modules["backend"] = Backend
except Exception:
    pass

try:
    import backend
    sys.modules["Backend"] = backend
except Exception:
    pass

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENVIRONMENT", "production").lower() == "development"
    print(f"[*] Starting MailTrace Forensic Station Backend on port {port} (dev={is_dev})...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=is_dev)
