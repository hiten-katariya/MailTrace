import os
import io
import base64
import qrcode
from PIL import Image, ImageDraw, ImageFont
from email.message import EmailMessage

FIXTURE_DIR = r"c:\Users\sharm\OneDrive\Desktop\MailTrace\Backend\tests\fixtures"
os.makedirs(FIXTURE_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. quishing_qr_lookalike.eml
# -------------------------------------------------------------
qr = qrcode.QRCode(version=1, box_size=10, border=4)
qr.add_data("https://login.paypa1-security.com/signin")
qr.make(fit=True)
qr_img = qr.make_image(fill_color="black", back_color="white")
qr_buf = io.BytesIO()
qr_img.save(qr_buf, format="PNG")
qr_bytes = qr_buf.getvalue()

msg1 = EmailMessage()
msg1["Subject"] = "Urgent: Scan QR Code to Authenticate Access"
msg1["From"] = "security-noreply@identity-verify-m365.com"
msg1["To"] = "analyst@target-corp.com"
msg1["Date"] = "Sun, 06 Sep 2026 10:15:00 +0000"
msg1["Message-ID"] = "<quishing-qr-test-01@identity-verify-m365.com>"
msg1["MIME-Version"] = "1.0"

# Header anomaly / unauthenticated
msg1["Received"] = "from mail.identity-verify-m365.com (198.51.100.22) by mta.target-corp.com; Sun, 06 Sep 2026 10:15:05 +0000"
msg1["Authentication-Results"] = "mta.target-corp.com; dkim=none; spf=fail (mta.target-corp.com: domain of identity-verify-m365.com does not designate 198.51.100.22 as permitted sender) smtp.mailfrom=security-noreply@identity-verify-m365.com; dmarc=fail action=none header.from=identity-verify-m365.com;"

body_text_1 = (
    "Your Microsoft 365 security session has expired.\n"
    "To restore your corporate access, scan the secure QR code attached below using your mobile device authenticator.\n"
    "Failure to verify within 24 hours will result in account suspension."
)
msg1.set_content(body_text_1)

# Add QR code attachment
msg1.add_attachment(
    qr_bytes,
    maintype="image",
    subtype="png",
    filename="m365_authenticator_qr.png"
)

with open(os.path.join(FIXTURE_DIR, "quishing_qr_lookalike.eml"), "wb") as f:
    f.write(msg1.as_bytes())
print("[+] Created quishing_qr_lookalike.eml")


# -------------------------------------------------------------
# 2. quishing_screenshot_lure.eml (Image-only lure)
# -------------------------------------------------------------
# Draw a screenshot-style phishing notice
img2 = Image.new("RGB", (600, 300), color=(255, 255, 255))
draw = ImageDraw.Draw(img2)
# Draw red warning banner
draw.rectangle([(0, 0), (600, 50)], fill=(220, 38, 38))
draw.text((20, 15), "CRITICAL SECURITY ALERT: ACCOUNT ACCESS RESTRICTED", fill=(255, 255, 255))

# Draw body text inside image
draw.text((20, 70), "Dear Customer,", fill=(0, 0, 0))
draw.text((20, 100), "We detected unauthorized login attempts to your account.", fill=(0, 0, 0))
draw.text((20, 130), "Your access has been temporarily suspended to prevent fraudulent activity.", fill=(0, 0, 0))
draw.text((20, 160), "Please verify your password and identity immediately within 24 hours.", fill=(0, 0, 0))

# Draw a button-like box
draw.rectangle([(20, 200), (280, 245)], fill=(37, 99, 235))
draw.text((35, 215), "RESTORE ACCESS NOW", fill=(255, 255, 255))

img2_buf = io.BytesIO()
img2.save(img2_buf, format="PNG")
img2_bytes = img2_buf.getvalue()
img2_b64 = base64.b64encode(img2_bytes).decode("ascii")

msg2 = EmailMessage()
msg2["Subject"] = "Critical Security Alert: Account Suspended"
msg2["From"] = "security-alert@service-notice.org"
msg2["To"] = "employee@target-corp.com"
msg2["Date"] = "Sun, 06 Sep 2026 11:30:00 +0000"
msg2["Message-ID"] = "<screenshot-lure-test-02@service-notice.org>"
msg2["MIME-Version"] = "1.0"
msg2["Received"] = "from mail.service-notice.org (203.0.113.88) by mta.target-corp.com; Sun, 06 Sep 2026 11:30:04 +0000"
msg2["Authentication-Results"] = "mta.target-corp.com; spf=fail; dkim=none; dmarc=fail;"

# NO plain text body or only minimal whitespace to test image_only_lure signal
html_body_2 = f"""<!DOCTYPE html>
<html>
<body>
<img src="data:image/png;base64,{img2_b64}" alt="Notification Notice" />
</body>
</html>"""
msg2.set_content("") # Empty plain text!
msg2.add_alternative(html_body_2, subtype="html")

# Also add the image as inline attachment
msg2.add_attachment(
    img2_bytes,
    maintype="image",
    subtype="png",
    filename="security_notice.png"
)

with open(os.path.join(FIXTURE_DIR, "quishing_screenshot_lure.eml"), "wb") as f:
    f.write(msg2.as_bytes())
print("[+] Created quishing_screenshot_lure.eml")


# -------------------------------------------------------------
# 3. legitimate_embedded_logo.eml (Clean business email with image logo)
# -------------------------------------------------------------
logo_img = Image.new("RGB", (200, 60), color=(14, 116, 144))
draw_logo = ImageDraw.Draw(logo_img)
draw_logo.text((20, 20), "ACME CORP LOGO", fill=(255, 255, 255))
logo_buf = io.BytesIO()
logo_img.save(logo_buf, format="PNG")
logo_bytes = logo_buf.getvalue()

msg3 = EmailMessage()
msg3["Subject"] = "Quarterly Offsite & Team All-Hands Schedule"
msg3["From"] = "hr@acme-corp.com"
msg3["To"] = "team@acme-corp.com"
msg3["Date"] = "Sun, 06 Sep 2026 09:00:00 +0000"
msg3["Message-ID"] = "<allhands-offsite-03@acme-corp.com>"
msg3["MIME-Version"] = "1.0"
msg3["Received"] = "from mail.acme-corp.com (192.0.2.1) by mta.target-corp.com; Sun, 06 Sep 2026 09:00:02 +0000"
msg3["Authentication-Results"] = "mta.target-corp.com; spf=pass; dkim=pass header.d=acme-corp.com; dmarc=pass;"

body_text_3 = (
    "Hi everyone,\n\n"
    "Looking forward to seeing you all at our upcoming quarterly all-hands offsite this Friday.\n"
    "We have scheduled team presentations starting at 10:00 AM, followed by lunch and collaborative breakout sessions.\n\n"
    "Please let us know if you have any dietary restrictions or need travel accommodations.\n\n"
    "Best regards,\n"
    "Acme People & Culture Team"
)
msg3.set_content(body_text_3)

# Add legitimate logo
msg3.add_attachment(
    logo_bytes,
    maintype="image",
    subtype="png",
    filename="company_logo.png"
)

with open(os.path.join(FIXTURE_DIR, "legitimate_embedded_logo.eml"), "wb") as f:
    f.write(msg3.as_bytes())
print("[+] Created legitimate_embedded_logo.eml")
