import os
import email
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr, parsedate_to_datetime
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from backend.app.config import settings

def compute_sha256(content_bytes: bytes) -> str:
    return hashlib.sha256(content_bytes).hexdigest()

def save_raw_eml(file_hash: str, content_bytes: bytes) -> str:
    storage_dir = settings.RAW_EML_STORAGE_DIR
    os.makedirs(storage_dir, exist_ok=True)
    file_path = os.path.join(storage_dir, f"{file_hash}.eml")
    if not os.path.exists(file_path):
        with open(file_path, "wb") as f:
            f.write(content_bytes)
    return file_path

class ParsedEmail:
    def __init__(
        self,
        file_hash: str,
        raw_file_path: str,
        subject: str,
        sender: str,
        sender_domain: Optional[str],
        recipient: Optional[str],
        received_at: datetime,
        headers_dict: Dict[str, Any],
        raw_headers_text: str,
        body_text: str,
        body_html: str,
        extracted_urls: List[str],
        attachments: List[Dict[str, Any]],
    ):
        self.file_hash = file_hash
        self.raw_file_path = raw_file_path
        self.subject = subject
        self.sender = sender
        self.sender_domain = sender_domain
        self.recipient = recipient
        self.received_at = received_at
        self.headers_dict = headers_dict
        self.raw_headers_text = raw_headers_text
        self.body_text = body_text
        self.body_html = body_html
        self.extracted_urls = extracted_urls
        self.attachments = attachments

def parse_raw_email(content_bytes: bytes) -> ParsedEmail:
    file_hash = compute_sha256(content_bytes)
    raw_file_path = save_raw_eml(file_hash, content_bytes)

    # Parse MIME structure with modern policy
    msg = BytesParser(policy=policy.default).parsebytes(content_bytes)

    # Subject
    subject = msg.get("Subject", "(No Subject)")
    
    # From / Sender
    raw_from = msg.get("From", "unknown@unknown.com")
    name, sender_email = parseaddr(raw_from)
    if not sender_email:
        sender_email = raw_from

    sender_domain = sender_email.split("@")[-1].lower() if "@" in sender_email else None

    # Recipient
    raw_to = msg.get("To", "")
    _, recipient = parseaddr(raw_to)
    if not recipient:
        recipient = raw_to or None

    # Date
    raw_date = msg.get("Date")
    if raw_date:
        try:
            received_at = parsedate_to_datetime(raw_date)
            if received_at.tzinfo is None:
                received_at = received_at.replace(tzinfo=timezone.utc)
        except Exception:
            received_at = datetime.now(timezone.utc)
    else:
        received_at = datetime.now(timezone.utc)

    # Extract headers
    headers_dict = {}
    raw_headers_lines = []
    for k, v in msg.items():
        raw_headers_lines.append(f"{k}: {v}")
        if k in headers_dict:
            if isinstance(headers_dict[k], list):
                headers_dict[k].append(v)
            else:
                headers_dict[k] = [headers_dict[k], v]
        else:
            headers_dict[k] = v

    raw_headers_text = "\n".join(raw_headers_lines)

    # Extract plain and HTML bodies
    body_plain_parts = []
    body_html_parts = []
    attachments = []

    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))

            filename = part.get_filename()
            if "attachment" in content_disposition or (filename and content_type not in ["text/plain", "text/html"]):
                filename = filename or "attachment"
                payload = part.get_payload(decode=True)
                att_size = len(payload) if payload else 0
                att_hash = hashlib.sha256(payload).hexdigest() if payload else ""
                attachments.append({
                    "filename": filename,
                    "content_type": content_type,
                    "size": att_size,
                    "sha256": att_hash,
                    "payload_bytes": payload or b"",
                })
            elif content_type == "text/plain":
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_plain_parts.append(payload.decode(part.get_content_charset() or "utf-8", errors="replace"))
                except Exception:
                    pass
            elif content_type == "text/html":
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_html_parts.append(payload.decode(part.get_content_charset() or "utf-8", errors="replace"))
                except Exception:
                    pass
    else:
        content_type = msg.get_content_type()
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                text_content = payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
                if content_type == "text/html":
                    body_html_parts.append(text_content)
                else:
                    body_plain_parts.append(text_content)
        except Exception:
            pass

    body_html = "\n".join(body_html_parts)
    body_text = "\n".join(body_plain_parts)

    # Extract clean text from HTML, stripping HTML comments (neutralizes Bayesian comment poisoning)
    html_clean_text = ""
    if body_html.strip():
        from bs4 import Comment
        soup = BeautifulSoup(body_html, "html.parser")
        # Strip comments, scripts, styles
        for element in soup.find_all(string=lambda text: isinstance(text, Comment)):
            element.extract()
        for element in soup(["script", "style"]):
            element.decompose()
        html_clean_text = soup.get_text(separator="\n", strip=True)

    # If plain text is empty or a short stub while HTML has rich body content, adopt the clean HTML text
    if not body_text.strip():
        body_text = html_clean_text
    elif html_clean_text and len(html_clean_text) > len(body_text) * 1.5:
        body_text = f"{body_text}\n\n{html_clean_text}"

    # Extract URLs from HTML hrefs and plain text
    import re
    url_pattern = re.compile(r'https?://[^\s<>"\')]+', re.IGNORECASE)
    extracted_urls = set()

    for m in url_pattern.finditer(body_text):
        extracted_urls.add(m.group(0).rstrip(".,;"))

    if body_html:
        soup = BeautifulSoup(body_html, "html.parser")
        for tag in soup.find_all("a", href=True):
            href = tag["href"].strip()
            if href.startswith("http://") or href.startswith("https://"):
                extracted_urls.add(href)

    return ParsedEmail(
        file_hash=file_hash,
        raw_file_path=raw_file_path,
        subject=subject,
        sender=sender_email,
        sender_domain=sender_domain,
        recipient=recipient,
        received_at=received_at,
        headers_dict=headers_dict,
        raw_headers_text=raw_headers_text,
        body_text=body_text,
        body_html=body_html,
        extracted_urls=list(extracted_urls),
        attachments=attachments,
    )
