import resend
import os
import logging

logger = logging.getLogger(__name__)

resend.api_key = os.environ.get("RESEND_API_KEY")

def send_reset_email(to_email: str, reset_link: str):
    """
    Send password reset email via Resend.

    IMPORTANT — Resend sandbox limits:
    ─────────────────────────────────────────────────────────────
    When using the default "onboarding@resend.dev" FROM address,
    Resend only delivers to the single email address you used to
    sign up for your Resend account.  Any other recipient is
    silently dropped — the API call succeeds but nothing arrives.

    Fix (pick one):
      A) For development: always send to your own verified email.
      B) For production: verify a domain in Resend dashboard and
         use "noreply@yourdomain.com" as the FROM address.
    ─────────────────────────────────────────────────────────────
    """

    # In sandbox mode, Resend only allows sending to your own
    # verified address. Override the recipient for local dev.
    dev_override = os.environ.get("RESEND_DEV_OVERRIDE_EMAIL")
    actual_recipient = dev_override if dev_override else to_email

    from_address = os.environ.get(
        "RESEND_FROM_EMAIL",
        "Soul Snap <onboarding@resend.dev>"   # works only for your own address
    )

    try:
        response = resend.Emails.send({
            "from": from_address,
            "to": [actual_recipient],
            "subject": "Reset your Soul Snap password",
            "html": f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0F0D1A;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#0F0D1A;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#1A1728;border-radius:20px;
                      border:1px solid rgba(196,181,253,0.15);
                      overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 24px;
                        background:linear-gradient(135deg,
                          rgba(124,58,237,0.3),
                          rgba(236,72,153,0.15));
                        text-align:center;
                        border-bottom:1px solid rgba(196,181,253,0.1);">
              <p style="margin:0 0 8px;font-size:28px;letter-spacing:-0.5px;
                         color:#C4B5FD;">Soul Snap</p>
              <p style="margin:0;font-size:13px;color:#6B5F8A;">
                Your emotional mirror
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:22px;
                         color:#EDE9FE;font-weight:500;">
                Password Reset Request
              </p>
              <p style="margin:0 0 24px;font-size:15px;
                         color:#A89FC4;line-height:1.7;">
                We received a request to reset the password for your
                Soul Snap account. Click the button below to choose a
                new password. This link expires in&nbsp;<strong
                  style="color:#C4B5FD;">1&nbsp;hour</strong>.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="{reset_link}"
                       style="display:inline-block;
                              padding:14px 36px;
                              background:linear-gradient(135deg,#7C3AED,#A78BFA);
                              color:#fff;font-size:15px;font-weight:600;
                              text-decoration:none;border-radius:50px;
                              box-shadow:0 4px 20px rgba(124,58,237,0.4);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;font-size:12px;color:#6B5F8A;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;
                         word-break:break-all;">
                <a href="{reset_link}"
                   style="color:#A78BFA;text-decoration:underline;">
                  {reset_link}
                </a>
              </p>

              <hr style="border:none;border-top:1px solid rgba(196,181,253,0.1);
                          margin:0 0 24px;" />

              <p style="margin:0;font-size:12px;color:#6B5F8A;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore
                this email — your password will not change. For security,
                this link can only be used once.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;
                        border-top:1px solid rgba(196,181,253,0.08);">
              <p style="margin:0;font-size:12px;color:#6B5F8A;">
                © Soul Snap · Your emotional mirror
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            """
        })

        logger.info("Reset email sent | to=%s | id=%s",
                    actual_recipient, response.get("id"))

        if dev_override and dev_override != to_email:
            logger.warning(
                "DEV MODE: reset email for %s redirected to %s",
                to_email, dev_override
            )

        return True

    except Exception as e:
        logger.error("Email sending failed | to=%s | error=%s", to_email, e)
        # Don't raise — the forgot-password endpoint should still return 200
        # so we don't leak whether an address exists in the DB.
        return False