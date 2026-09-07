import io
import os
import re
import base64
import shutil
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np

# QR code decoding
try:
    from pyzbar.pyzbar import decode as pyzbar_decode
    HAS_PYZBAR = True
except Exception:
    HAS_PYZBAR = False

try:
    import cv2
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False

# OCR engine
try:
    import pytesseract
    HAS_PYTESSERACT = True
except Exception:
    HAS_PYTESSERACT = False

from backend.app.core.url_analysis import analyze_urls
from backend.app.core.content_analysis import analyze_email_content

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tiff", ".svg"}

# Global flag / path cache for Tesseract binary
_TESSERACT_CMD: Optional[str] = None
_TESSERACT_CHECKED = False


def get_tesseract_cmd() -> Optional[str]:
    global _TESSERACT_CMD, _TESSERACT_CHECKED
    if _TESSERACT_CHECKED:
        return _TESSERACT_CMD

    _TESSERACT_CHECKED = True
    # 1. Check explicit environment variable
    env_path = os.environ.get("TESSERACT_PATH")
    if env_path and os.path.isfile(env_path):
        _TESSERACT_CMD = env_path
        return _TESSERACT_CMD

    # 2. Check PATH
    which_path = shutil.which("tesseract")
    if which_path:
        _TESSERACT_CMD = which_path
        return _TESSERACT_CMD

    # 3. Standard Windows installation paths
    windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
    ]
    for p in windows_paths:
        if os.path.isfile(p):
            _TESSERACT_CMD = p
            return _TESSERACT_CMD

    return None


def is_ocr_available() -> bool:
    if not HAS_PYTESSERACT:
        return False
    cmd = get_tesseract_cmd()
    if cmd:
        try:
            pytesseract.pytesseract.tesseract_cmd = cmd
            return True
        except Exception:
            return False
    return False


class ImageFinding:
    def __init__(
        self,
        filename: str,
        content_type: str,
        file_size: int,
        file_hash: str,
        has_qr_code: bool = False,
        qr_decoded_url: Optional[str] = None,
        qr_url_findings: Optional[List[Dict[str, Any]]] = None,
        ocr_extracted_text: Optional[str] = None,
        ocr_analysis: Optional[Dict[str, Any]] = None,
        image_only_lure_flag: bool = False,
        is_flagged: bool = False,
        flag_reason: Optional[str] = None,
        is_inline: bool = False,
        payload_bytes: bytes = b"",
    ):
        self.filename = filename
        self.content_type = content_type
        self.file_size = file_size
        self.file_hash = file_hash
        self.has_qr_code = has_qr_code
        self.qr_decoded_url = qr_decoded_url
        self.qr_url_findings = qr_url_findings or []
        self.ocr_extracted_text = ocr_extracted_text
        self.ocr_analysis = ocr_analysis
        self.image_only_lure_flag = image_only_lure_flag
        self.is_flagged = is_flagged
        self.flag_reason = flag_reason
        self.is_inline = is_inline
        self.payload_bytes = payload_bytes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "content_type": self.content_type,
            "file_size": self.file_size,
            "file_hash": self.file_hash,
            "has_qr_code": self.has_qr_code,
            "qr_decoded_url": self.qr_decoded_url,
            "qr_url_findings": self.qr_url_findings,
            "ocr_extracted_text": self.ocr_extracted_text,
            "ocr_analysis": self.ocr_analysis,
            "image_only_lure_flag": self.image_only_lure_flag,
            "is_flagged": self.is_flagged,
            "flag_reason": self.flag_reason,
            "is_inline": self.is_inline,
        }


class ImageAnalysisResult:
    def __init__(
        self,
        findings: List[ImageFinding],
        image_only_lure: bool = False,
        quishing_detected: bool = False,
        ocr_available: bool = False,
    ):
        self.findings = findings
        self.image_only_lure = image_only_lure
        self.quishing_detected = quishing_detected
        self.ocr_available = ocr_available

    def to_dict(self) -> Dict[str, Any]:
        return {
            "findings": [f.to_dict() for f in self.findings],
            "image_only_lure": self.image_only_lure,
            "quishing_detected": self.quishing_detected,
            "ocr_available": self.ocr_available,
        }


def extract_images_from_email(parsed_email) -> List[Dict[str, Any]]:
    """
    Extracts all images from an email:
    1. Regular attachments with image MIME types or extensions
    2. Inline data URIs (<img src="data:image/...;base64,...">)
    """
    extracted = []
    seen_hashes = set()

    # 1. Attachments
    if hasattr(parsed_email, "attachments") and parsed_email.attachments:
        for att in parsed_email.attachments:
            ct = (att.get("content_type") or "").lower()
            fname = att.get("filename") or ""
            ext = os.path.splitext(fname.lower())[1]
            payload = att.get("payload_bytes") or b""

            if ct.startswith("image/") or ext in IMAGE_EXTENSIONS:
                fhash = att.get("sha256") or hashlib.sha256(payload).hexdigest()
                if fhash not in seen_hashes:
                    seen_hashes.add(fhash)
                    extracted.append({
                        "filename": fname or f"image_{len(extracted)+1}.png",
                        "content_type": ct or "image/png",
                        "size": att.get("size") or len(payload),
                        "sha256": fhash,
                        "payload_bytes": payload,
                        "is_inline": False,
                    })

    # 2. HTML inline Data URIs
    body_html = getattr(parsed_email, "body_html", "") or ""
    if body_html:
        # Match data:image/png;base64,... or data:image/jpeg;base64,...
        data_uri_pattern = re.compile(r'data:image/([a-zA-Z0-9\+\-]+);base64,([A-Za-z0-9+/=\s]+)', re.IGNORECASE)
        for idx, match in enumerate(data_uri_pattern.finditer(body_html), 1):
            img_type = match.group(1).lower()
            b64_data = match.group(2).strip().replace("\n", "").replace("\r", "")
            try:
                payload = base64.b64decode(b64_data)
                fhash = hashlib.sha256(payload).hexdigest()
                if fhash not in seen_hashes:
                    seen_hashes.add(fhash)
                    extracted.append({
                        "filename": f"inline_image_{idx}.{img_type}",
                        "content_type": f"image/{img_type}",
                        "size": len(payload),
                        "sha256": fhash,
                        "payload_bytes": payload,
                        "is_inline": True,
                    })
            except Exception:
                pass

    return extracted


def decode_qr_codes(payload_bytes: bytes) -> List[str]:
    """
    Decodes QR code payloads from raw image bytes.
    Uses pyzbar as primary engine, and cv2.QRCodeDetector as secondary fallback.
    """
    if not payload_bytes:
        return []

    decoded_strings = []

    # Try PIL + pyzbar
    if HAS_PYZBAR:
        try:
            image = Image.open(io.BytesIO(payload_bytes))
            # Convert palette/RGBA if necessary
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            results = pyzbar_decode(image)
            for r in results:
                try:
                    data = r.data.decode("utf-8", errors="replace").strip()
                    if data and data not in decoded_strings:
                        decoded_strings.append(data)
                except Exception:
                    pass
        except Exception:
            pass

    # If pyzbar produced no results, try cv2 QRCodeDetector fallback
    if not decoded_strings and HAS_CV2:
        try:
            nparr = np.frombuffer(payload_bytes, np.uint8)
            cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if cv_img is not None:
                detector = cv2.QRCodeDetector()
                retval, decoded_info, points, straight_qrcode = detector.detectAndDecodeMulti(cv_img)
                if retval and decoded_info is not None:
                    for info in decoded_info:
                        if info and info.strip() and info.strip() not in decoded_strings:
                            decoded_strings.append(info.strip())
        except Exception:
            pass

    return decoded_strings


def extract_ocr_text(payload_bytes: bytes) -> Optional[str]:
    """
    Extracts visible text from image payload using pytesseract.
    Returns None if OCR engine is unavailable or no text is extracted.
    """
    if not payload_bytes or not is_ocr_available():
        return None

    try:
        image = Image.open(io.BytesIO(payload_bytes))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        text = pytesseract.image_to_string(image)
        cleaned = text.strip()
        return cleaned if len(cleaned) > 5 else None
    except Exception:
        return None


def detect_image_only_lure(parsed_email, images: List[Dict[str, Any]]) -> bool:
    """
    Detects if an email relies on image-only content to bypass text-based perimeter filters.
    True when body text is negligible (< 60 chars) while substantial image content exists.
    """
    body_text = (getattr(parsed_email, "body_text", "") or "").strip()
    # Strip whitespace & honeypot artifacts
    clean_text = re.sub(r'\s+', '', body_text)

    if len(clean_text) > 80:
        return False

    if not images:
        return False

    # Check if there is at least one non-trivial image (> 5KB or dimensions > 100x100)
    for img in images:
        payload = img.get("payload_bytes", b"")
        if len(payload) > 5120:  # > 5 KB
            try:
                pil_img = Image.open(io.BytesIO(payload))
                w, h = pil_img.size
                if w >= 100 and h >= 100:
                    return True
            except Exception:
                return True

    return False


async def analyze_email_images(parsed_email) -> ImageAnalysisResult:
    """
    Executes full QR code decoding, OCR text extraction, and image-only lure detection.
    Reuses existing url_analysis and content_analysis pipelines.
    """
    extracted_images = extract_images_from_email(parsed_email)
    ocr_active = is_ocr_available()
    is_lure = detect_image_only_lure(parsed_email, extracted_images)

    findings: List[ImageFinding] = []
    quishing_detected = False

    for img_dict in extracted_images:
        fname = img_dict["filename"]
        ct = img_dict["content_type"]
        size = img_dict["size"]
        fhash = img_dict["sha256"]
        payload = img_dict["payload_bytes"]
        is_inline = img_dict["is_inline"]

        flag_reasons = []

        # 1. QR Code Decoding
        qr_payloads = decode_qr_codes(payload)
        has_qr = len(qr_payloads) > 0
        primary_qr_url = qr_payloads[0] if has_qr else None
        qr_url_findings = []

        if has_qr:
            for qr_item in qr_payloads:
                if qr_item.startswith("http://") or qr_item.startswith("https://"):
                    url_results = await analyze_urls([qr_item])
                    qr_url_findings.extend(url_results)
                    for u_res in url_results:
                        if u_res.get("is_flagged"):
                            quishing_detected = True
                            flag_reasons.append(
                                f"Quishing hazard: QR code decodes to flagged lookalike/malicious URL '{qr_item}' ({u_res.get('reason')})"
                            )
                else:
                    # Non-HTTP QR payload (e.g. bitcoin address or command string)
                    flag_reasons.append(f"QR code detected with non-standard payload: '{qr_item[:60]}'")

        # 2. OCR Text Extraction
        ocr_text = extract_ocr_text(payload)
        ocr_analysis_data = None

        if ocr_text:
            # Route through existing content_analysis pipeline
            c_res = analyze_email_content(
                subject="",
                body_text=ocr_text,
                sender=getattr(parsed_email, "sender", ""),
            )
            ocr_analysis_data = {
                "classification": c_res.classification,
                "confidence": c_res.classification_confidence,
                "urgency_score": c_res.sentiment_urgency_score,
                "flagged_phrases": c_res.flagged_phrases,
                "bec_indicators": c_res.bec_indicators,
                "impersonation_target": c_res.impersonation_target,
            }

            # A visual screenshot lure must contain actual coercive indicators, flagged phrases,
            # or substantial text (>= 6 words) classified as phishing/bec by NLP
            words = ocr_text.split()
            is_lure_text = (
                (c_res.classification in ("phishing", "bec") and (len(words) >= 6 or c_res.flagged_phrases or c_res.sentiment_urgency_score > 30))
                or bool(c_res.flagged_phrases)
                or bool(c_res.bec_indicators)
            )

            if is_lure_text and c_res.classification in ("phishing", "bec"):
                quishing_detected = True
                flag_reasons.append(
                    f"Visual screenshot lure: OCR extracted {c_res.classification.upper()} text ({int(c_res.classification_confidence*100)}% confidence)"
                )
            elif c_res.flagged_phrases:
                flag_reasons.append(
                    f"Visual urgency lure: OCR extracted coercive text ({', '.join(c_res.flagged_phrases[:2])})"
                )

        # 3. Image-Only Evasion Marker
        if is_lure and (has_qr or ocr_text or size > 10240):
            flag_reasons.append("Image-only lure design: email relies on visual image rather than readable body text")

        is_flagged = len(flag_reasons) > 0
        finding = ImageFinding(
            filename=fname,
            content_type=ct,
            file_size=size,
            file_hash=fhash,
            has_qr_code=has_qr,
            qr_decoded_url=primary_qr_url,
            qr_url_findings=qr_url_findings,
            ocr_extracted_text=ocr_text,
            ocr_analysis=ocr_analysis_data,
            image_only_lure_flag=is_lure,
            is_flagged=is_flagged,
            flag_reason="; ".join(flag_reasons) if flag_reasons else None,
            is_inline=is_inline,
            payload_bytes=payload,
        )
        findings.append(finding)

    return ImageAnalysisResult(
        findings=findings,
        image_only_lure=is_lure,
        quishing_detected=quishing_detected,
        ocr_available=ocr_active,
    )
