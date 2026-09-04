import os
import re
import json
import hashlib
from typing import List, Dict, Any, Optional

# Risky Executable & Script Extensions
EXECUTABLE_EXTENSIONS = {
    ".exe", ".scr", ".bat", ".cmd", ".js", ".vbs", ".vbe",
    ".wsf", ".wsh", ".ps1", ".jar", ".com", ".pif", ".msi",
    ".hta", ".cpl", ".reg", ".dll",
}

# Macro-Enabled Office Extensions
MACRO_EXTENSIONS = {
    ".docm", ".xlsm", ".pptm", ".dotm", ".xltm", ".potm",
}

# Archive Extensions
ARCHIVE_EXTENSIONS = {
    ".zip", ".rar", ".7z", ".tar", ".gz", ".iso", ".img",
}

_KNOWN_MALICIOUS_HASHES: Optional[set] = None

def get_known_malicious_hashes() -> set:
    global _KNOWN_MALICIOUS_HASHES
    if _KNOWN_MALICIOUS_HASHES is None:
        hashes = set()
        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "known_malicious_hashes.json")
        data_path = os.path.normpath(data_path)
        if os.path.exists(data_path):
            try:
                with open(data_path, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    hashes = set(h.lower() for h in content.get("hashes", []))
            except Exception as e:
                print(f"Warning loading known malicious hashes: {e}")
        _KNOWN_MALICIOUS_HASHES = hashes
    return _KNOWN_MALICIOUS_HASHES

def detect_file_signature(payload_bytes: bytes) -> str:
    """
    Lightweight signature/magic-byte detection without external binary dependencies.
    """
    if not payload_bytes:
        return "application/octet-stream"

    if payload_bytes.startswith(b"MZ"):
        return "application/x-dosexec"
    elif payload_bytes.startswith(b"%PDF"):
        return "application/pdf"
    elif payload_bytes.startswith(b"\x7fELF"):
        return "application/x-executable"
    elif payload_bytes.startswith(b"PK\x03\x04"):
        return "application/zip"
    elif payload_bytes.startswith(b"\xd0\xcf\x11\xe0"):
        return "application/x-ole-storage"
    elif payload_bytes.startswith(b"\x1f\x8b"):
        return "application/gzip"
    elif payload_bytes.startswith(b"Rar!\x1a\x07"):
        return "application/x-rar-compressed"
    elif payload_bytes.startswith(b"7z\xbc\xaf\x27\x1c"):
        return "application/x-7z-compressed"
    elif payload_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    elif payload_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif payload_bytes.startswith(b"GIF87a") or payload_bytes.startswith(b"GIF89a"):
        return "image/gif"
    elif payload_bytes.startswith(b"<?xml") or payload_bytes.startswith(b"<html"):
        return "text/html"
    elif payload_bytes.startswith(b"#!"):
        return "text/x-shellscript"

    return "application/octet-stream"

class AttachmentFinding:
    def __init__(
        self,
        filename: str,
        declared_content_type: str,
        detected_file_type: str,
        file_size: int,
        file_hash: str,
        is_flagged: bool,
        flag_reason: Optional[str] = None,
    ):
        self.filename = filename
        self.declared_content_type = declared_content_type
        self.detected_file_type = detected_file_type
        self.file_size = file_size
        self.file_hash = file_hash
        self.is_flagged = is_flagged
        self.flag_reason = flag_reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "declared_content_type": self.declared_content_type,
            "detected_file_type": self.detected_file_type,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "is_flagged": self.is_flagged,
            "flag_reason": self.flag_reason,
        }

def analyze_attachments(attachments: List[Dict[str, Any]]) -> List[AttachmentFinding]:
    """
    Performs multi-vector inspection on parsed email attachments:
    1. Extension risk (executable / macro / double-extension)
    2. Magic-byte signature vs declared Content-Type mismatch
    3. Known-malicious SHA-256 hash database lookup
    """
    findings: List[AttachmentFinding] = []
    known_bad_hashes = get_known_malicious_hashes()

    for att in attachments:
        filename = att.get("filename") or "attachment"
        declared_ct = (att.get("content_type") or "application/octet-stream").lower()
        size = att.get("size") or 0
        file_hash = att.get("sha256") or ""
        payload = att.get("payload_bytes") or b""

        if not file_hash and payload:
            file_hash = hashlib.sha256(payload).hexdigest()

        # 1. Magic bytes detection
        detected_type = detect_file_signature(payload)

        flag_reasons = []

        # 2. File extension analysis
        lower_name = filename.lower()
        ext = os.path.splitext(lower_name)[1]

        # Double extension trick (e.g. invoice.pdf.exe, document.docx.vbs)
        double_ext_match = re.search(r'\.([a-z0-9]{2,5})\.([a-z0-9]{2,5})$', lower_name)
        if double_ext_match:
            first_ext = f".{double_ext_match.group(1)}"
            second_ext = f".{double_ext_match.group(2)}"
            if second_ext in EXECUTABLE_EXTENSIONS and first_ext not in EXECUTABLE_EXTENSIONS:
                flag_reasons.append(
                    f"Deceptive double extension detected: disguised as '{first_ext}' but executes as '{second_ext}'"
                )

        # Direct executable extension
        if ext in EXECUTABLE_EXTENSIONS:
            flag_reasons.append(f"High-risk executable file extension ('{ext}')")

        # Macro-enabled Office formats
        if ext in MACRO_EXTENSIONS:
            flag_reasons.append(f"Macro-enabled Office document ('{ext}') capable of executing embedded VBA payloads")

        # 3. Magic byte mismatch
        # Declared as document/image/pdf, but magic bytes indicate Windows PE executable or script
        if detected_type == "application/x-dosexec":
            if ext not in EXECUTABLE_EXTENSIONS:
                flag_reasons.append(
                    f"Payload camouflage: file extension '{ext}' hides PE executable binary (MZ header detected)"
                )
            elif "pdf" in declared_ct or "image" in declared_ct or "word" in declared_ct:
                flag_reasons.append(
                    f"MIME type spoofing: declared as '{declared_ct}' but binary signature is PE executable"
                )

        if "pdf" in declared_ct and ext == ".pdf" and detected_type != "application/pdf" and size > 100:
            if detected_type != "application/octet-stream":
                flag_reasons.append(
                    f"Content-Type mismatch: declared PDF but signature matches '{detected_type}'"
                )

        # 4. Known-malicious hash lookup
        if file_hash.lower() in known_bad_hashes:
            flag_reasons.append(f"Known malicious attachment hash match (SHA-256: {file_hash[:16]}...)")

        is_flagged = len(flag_reasons) > 0
        reason_str = "; ".join(flag_reasons) if flag_reasons else None

        findings.append(AttachmentFinding(
            filename=filename,
            declared_content_type=declared_ct,
            detected_file_type=detected_type,
            file_size=size,
            file_hash=file_hash,
            is_flagged=is_flagged,
            flag_reason=reason_str,
        ))

    return findings
