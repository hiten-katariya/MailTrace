import os
import re
import joblib
from typing import List, Dict, Any, Optional, Tuple
import spacy

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

from backend.app.config import settings

# Global cached model
_ml_model = None

def get_ml_model():
    global _ml_model
    if _ml_model is None:
        model_path = settings.ML_MODEL_PATH
        if os.path.exists(model_path):
            try:
                _ml_model = joblib.load(model_path)
            except Exception as e:
                print(f"Error loading ML model from {model_path}: {e}")
                _ml_model = None
    return _ml_model

# Known high-value impersonation targets
TARGET_BRANDS = [
    ("Microsoft", [r'\bmicrosoft\b', r'\bm365\b', r'\boffice\s*365\b', r'\boutlook\b', r'\bazure\b']),
    ("PayPal", [r'\bpaypal\b', r'\bpaypa[1l]\b']),
    ("Apple", [r'\bapple\b', r'\bicloud\b', r'\bapple\s*id\b']),
    ("Amazon", [r'\bamazon\b', r'\bamazon\s*prime\b', r'\baws\b']),
    ("Okta", [r'\bokta\b', r'\bauth0\b', r'\bsso\b', r'\bmfa\s*verification\b']),
    ("Workday", [r'\bworkday\b', r'\bpayroll\b', r'\bhr\s*portal\b']),
    ("Google", [r'\bgoogle\b', r'\bgsuite\b', r'\bgmail\b', r'\bgoogle\s*workspace\b']),
    ("QuickBooks", [r'\bquickbooks\b', r'\bintuit\b', r'\binvoice\b']),
    ("DocuSign", [r'\bdocusign\b', r'\bsign\s*document\b']),
    ("Banking / Financial Institution", [r'\bbradesco\b', r'\bitau\b', r'\bsantander\b', r'\bcaixa\b', r'\bbanco\b', r'\blivelo\b', r'\bchase\b', r'\bbank\s*of\s*america\b', r'\bwells\s*fargo\b', r'\bciti\b', r'\bbarclays\b', r'\bhsbc\b', r'\bwire\s*transfer\b']),
    ("Executive Pretext", [r'\bceo\b', r'\bcfo\b', r'\bboard\s*of\s*directors\b', r'\bstrictly\s*confidential\b']),
]

URGENCY_PATTERNS = [
    r'urgent\s+action\s+required',
    r'account\s+(?:will\s+be\s+)?suspended',
    r'immediate(?:ly)?\s+(?:verify|action|attention|update)',
    r'within\s+24\s+hours?',
    r'confirm\s+your\s+identity',
    r'security\s+alert',
    r'unauthorized\s+(?:login|activity|access)',
    r'access\s+has\s+been\s+restricted',
    r'final\s+(?:warning|notice)',
    r'password\s+expir(?:es|ation)',
    r'action\s+is\s+required',
    r'fail(?:ure)?\s+to\s+respond',
    r'deactivation\s+warning',
    r'critical\s+breach',
    # Unsolicited bulk marketing / spam scarcity and lure patterns
    r'100%\s+free',
    r'claim\s+(?:it|yours|now)',
    r'grab\s+yours\s+today',
    r'before\s+they[\'’]re\s+all\s+gone',
    r'special\s+limited',
    r'limited\s+(?:time|supply|run|offer)',
    r'free\s+(?:edt|mini|tool|gift|sample|trial|giveaway)',
    r'did\s+you\s+get\s+your\s+free',
    r'send\s+me\s+my\s+free',
    r'act\s+now\s+and\s+receive',
    r'exclusive\s+deal',
    r'winner|won\s+a\s+prize',
    # Web3 / Crypto wallet and airdrop lures
    r'wallet\s+(?:has\s+been\s+)?(?:blocked|suspended|restricted|locked|compromised)',
    r'connect\s+(?:your\s+)?wallet',
    r'airdrop\s+(?:is\s+)?(?:now\s+)?live',
    r'claim\s+(?:your\s+)?(?:reward|tokens?|airdrop|nft)',
    r'seed\s+phrase|recovery\s+phrase|private\s+keys?',
    # Mailbox quota, cloud storage, and German honeypot alerts
    r'storage\s+(?:is\s+)?(?:full|exceeded|almost\s+full|limit)',
    r'mailbox\s+(?:is\s+)?(?:full|exceeded)',
    r'speicher\s+(?:ist\s+)?(?:belegt|voll)',
    r'upgrade\s+durchf[üu]hren',
    # Evasion and obfuscated account login alerts
    r'unusual\s+(?:sign[\.\s_\-]*in|log[\.\s_\-]*in|iog\s+in)\s+activity',
    r'someone\s+tried\s+to\s+(?:log|iog|sign)\s+in',
    # Multilingual reward, points expiration, and banking alerts
    r'(?:expiram|expira|expirando)\s+(?:hoje|agora|em\s+breve)',
    r'resgate\s+(?:agora|seus\s+pontos|seu\s+pr[eê]mio)',
    r'pontos\s+(?:livelo|esfera|vantagens|fidelidade)',
    r'evite\s+a\s+perda',
    r'bloqueio\s+(?:de\s+)?(?:conta|cart[aã]o|acesso)',
    r'atualize\s+(?:seus?\s+)?(?:dados|cadastro)',
    r'dringend|sofort\s+handeln',
    r'konto\s+(?:wird\s+)?gesperrt',
    r'sicherheitswarnung|letzte\s+mahnung',
    r'jetzt\s+gewinndaten\s+eintragen',
]

BEC_PATTERNS = [
    r'wire\s+transfer',
    r'payment\s+diversion',
    r'update\s+(?:our|my|banking|direct\s+deposit)\s+details',
    r'routing\s+number',
    r'swift\s+code',
    r'change\s+of\s+bank\s+account',
    r'strictly\s+confidential\s+acquisition',
    r'settlement\s+payment',
    r'invoice\s+attached',
    r'payroll\s+direct\s+deposit',
    r'vendor\s+payment\s+instructions',
    r'executive\s+authorization',
    r'gift\s+cards?',
    # Subtle payment diversion and invoice redirection pretexts:
    r'(?:redirect|remit|disburse|send|route)\s+(?:the\s+|all\s+|future\s+|pending\s+)?(?:funds?|disbursement|remittance|settlement|balance|payment)',
    r'(?:updated|new|revised)\s+(?:banking|remittance|clearing|settlement|payment|treasury)\s+(?:instructions|details|coordinates|account)',
    r'(?:clearing\s+bank|clearing\s+account|treasury\s+account|beneficiary\s+account|remittance\s+account)',
    r'(?:remit|forward)\s+(?:to\s+(?:the\s+)?following|to\s+our\s+new)\s+account',
    # Broadened indirect payment diversion & compromised account pretexts:
    r'(?:updated|changed|new|revised)\s+(?:account|bank(?:ing)?)\s+(?:details|information|info|number)',
    r'(?:use|switch\s+to|send\s+to)\s+(?:the\s+)?(?:new|updated|following|below)\s+(?:account|bank)',
    r'(?:new|updated)\s+(?:wiring|transfer|payment)\s+(?:instructions|info|details)',
    r'(?:account|bank)\s+(?:details|information)\s+(?:have\s+)?(?:changed|been\s+updated)',
    r'transfer\s+(?:for\s+this\s+month|this\s+month[\'’]?s\s+transfer)',
]

class ContentAnalysisResult:
    def __init__(
        self,
        classification: str,
        classification_confidence: float,
        sentiment_urgency_score: int,
        impersonation_target: Optional[str],
        flagged_phrases: List[str],
        bec_indicators: List[str],
    ):
        self.classification = classification
        self.classification_confidence = classification_confidence
        self.sentiment_urgency_score = sentiment_urgency_score
        self.impersonation_target = impersonation_target
        self.flagged_phrases = flagged_phrases
        self.bec_indicators = bec_indicators

def analyze_email_content(subject: str, body_text: str, sender: str) -> ContentAnalysisResult:
    full_text = f"{subject} {body_text}".strip()
    full_text_lower = full_text.lower()

    # 1. Statistical ML Classification
    model = get_ml_model()
    ml_prob = 0.5
    if model:
        try:
            probs = model.predict_proba([full_text])[0]
            # Class 1 is phishing
            ml_prob = float(probs[1])
        except Exception as e:
            print(f"ML inference error: {e}")

    # 2. Rule & Heuristic Extraction
    flagged_phrases = []
    for pattern in URGENCY_PATTERNS:
        match = re.search(pattern, full_text_lower)
        if match:
            # Extract clean match from original text
            start, end = match.span()
            matched_phrase = full_text[start:end].strip()
            if matched_phrase and matched_phrase not in flagged_phrases:
                flagged_phrases.append(matched_phrase)

    bec_indicators = []
    for pattern in BEC_PATTERNS:
        match = re.search(pattern, full_text_lower)
        if match:
            start, end = match.span()
            matched_ind = full_text[start:end].strip()
            if matched_ind and matched_ind not in bec_indicators:
                bec_indicators.append(matched_ind)

    # 3. Detect Impersonation Target Brand
    impersonation_target = None
    for brand_name, brand_regexes in TARGET_BRANDS:
        for b_re in brand_regexes:
            if re.search(b_re, full_text_lower) or re.search(b_re, sender.lower()):
                impersonation_target = brand_name
                break
        if impersonation_target:
            break

    # 4. Urgency Score Calculation (0-100)
    urgency_base = min(len(flagged_phrases) * 25, 60)
    if bec_indicators:
        urgency_base += min(len(bec_indicators) * 20, 40)
    sentiment_urgency_score = min(int(urgency_base), 100)

    # 5. Composite Content Classification (requiring coercion/BEC co-occurrence to avoid commercial false positives)
    has_urgency = len(flagged_phrases) > 0
    has_bec = len(bec_indicators) > 0

    if len(bec_indicators) >= 2 or (has_bec and ml_prob > 0.6):
        classification = "bec"
        confidence = max(0.85, ml_prob)
    elif len(flagged_phrases) >= 2 or (has_urgency and ml_prob >= 0.50) or (ml_prob >= 0.75):
        classification = "phishing"
        confidence = max(0.80, ml_prob)
    elif (has_urgency and ml_prob >= 0.30) or (not has_urgency and not has_bec and ml_prob >= 0.55):
        classification = "suspicious"
        confidence = 0.65
    else:
        classification = "legitimate"
        confidence = max(0.80, 1.0 - ml_prob)

    return ContentAnalysisResult(
        classification=classification,
        classification_confidence=round(confidence, 2),
        sentiment_urgency_score=sentiment_urgency_score,
        impersonation_target=impersonation_target,
        flagged_phrases=flagged_phrases,
        bec_indicators=bec_indicators,
    )
