const twilio     = require('twilio')
const nodemailer = require('nodemailer')

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// ==============================
// WHATSAPP ALERT
// ==============================
async function sendWhatsAppAlert(phoneNumber, data) {
  const {
    customerName, hotelName, city, checkIn, checkOut,
    nights, originalPrice, offerPrice, customerSaving, offerId
  } = data

  // Format Indian numbers
  const to = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`

  const message = `🏨 *HotelDrops Price Alert!*

Hi ${customerName}! Great news — we found a lower price for your booking.

*${hotelName}*, ${city}
📅 ${checkIn} → ${checkOut} (${nights} nights)

~~₹${Number(originalPrice).toLocaleString('en-IN')}~~ → *₹${Number(offerPrice).toLocaleString('en-IN')}*
💰 *You save ₹${Number(customerSaving).toLocaleString('en-IN')}!*

Reply *YES* to rebook at the lower price, or visit:
${process.env.FRONTEND_URL}/offer/${offerId}

⏰ Offer valid for 24 hours only.
_HotelDrops — We save, you save._`

  const msg = await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to:   `whatsapp:${to}`,
    body: message,
  })

  return msg.sid
}

// ==============================
// EMAIL ALERT
// ==============================
async function sendEmailAlert(email, data) {
  const {
    customerName, hotelName, city, checkIn, checkOut,
    nights, originalPrice, offerPrice, customerSaving, offerId
  } = data

  const transporter = getMailTransporter()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .wrap { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f172a, #1d4ed8); padding: 32px 28px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; margin: 0 0 4px; }
    .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 0; }
    .body { padding: 28px; }
    .hotel-name { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .hotel-sub { font-size: 13px; color: #6b7280; margin-bottom: 20px; }
    .price-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .price-box { flex: 1; padding: 14px; border-radius: 12px; text-align: center; }
    .price-box.old { background: #fef2f2; }
    .price-box.new { background: #f0fdf4; }
    .price-box .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
    .price-box .amount { font-size: 22px; font-weight: 800; }
    .price-box.old .amount { color: #ef4444; text-decoration: line-through; }
    .price-box.new .amount { color: #16a34a; }
    .offer-box { background: #2563eb; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px; }
    .offer-box .label { color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 4px; }
    .offer-box .amount { color: #fff; font-size: 28px; font-weight: 800; }
    .offer-box .saving { color: #93c5fd; font-size: 13px; margin-top: 4px; }
    .cta { display: block; background: #16a34a; color: #fff; text-decoration: none; text-align: center; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 15px; margin-bottom: 12px; }
    .note { font-size: 11px; color: #9ca3af; text-align: center; }
    .footer { background: #f9fafb; padding: 16px 28px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f0f0f5; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏨 Price Drop Alert!</h1>
      <p>Hi ${customerName}, we found a lower price for your hotel.</p>
    </div>
    <div class="body">
      <div class="hotel-name">${hotelName}</div>
      <div class="hotel-sub">${city} · ${checkIn} → ${checkOut} · ${nights} nights</div>

      <div class="price-row">
        <div class="price-box old">
          <div class="label">You booked at</div>
          <div class="amount">₹${Number(originalPrice).toLocaleString('en-IN')}</div>
        </div>
        <div class="price-box new">
          <div class="label">New price found</div>
          <div class="amount">₹${Number(offerPrice).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div class="offer-box">
        <div class="label">Our offer to you</div>
        <div class="amount">₹${Number(offerPrice).toLocaleString('en-IN')}</div>
        <div class="saving">You save ₹${Number(customerSaving).toLocaleString('en-IN')} 🎉</div>
      </div>

      <a href="${process.env.FRONTEND_URL}/offer/${offerId}" class="cta">
        ✅ Yes, rebook at lower price →
      </a>
      <p class="note">⏰ Offer valid for 24 hours · Same hotel · Same room · Same dates</p>
    </div>
    <div class="footer">
      © 2026 HotelDrops · Made with ❤️ in India<br/>
      <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from:    `"HotelDrops" <${process.env.EMAIL_FROM}>`,
    to:      email,
    subject: `🏨 Price Drop! Save ₹${Number(customerSaving).toLocaleString('en-IN')} on ${hotelName}`,
    html,
  })
}

// ==============================
// BOOKING CONFIRMATION EMAIL
// ==============================
async function sendBookingConfirmation(email, data) {
  const { customerName, hotelName, checkIn, checkOut, nights, offerPrice, customerSaving, bookingRef } = data
  const transporter = getMailTransporter()

  await transporter.sendMail({
    from:    `"HotelDrops" <${process.env.EMAIL_FROM}>`,
    to:      email,
    subject: `✅ Booking Confirmed — ${hotelName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#16a34a;">✅ Your rebooking is confirmed!</h2>
        <p>Hi ${customerName},</p>
        <p>Great news! We've successfully rebooked your stay at <strong>${hotelName}</strong>.</p>
        <ul>
          <li>Check-in: ${checkIn}</li>
          <li>Check-out: ${checkOut} (${nights} nights)</li>
          <li>New price: <strong>₹${Number(offerPrice).toLocaleString('en-IN')}</strong></li>
          <li>You saved: <strong style="color:#16a34a;">₹${Number(customerSaving).toLocaleString('en-IN')}</strong> 🎉</li>
          <li>Booking ref: ${bookingRef}</li>
        </ul>
        <p>Your original booking has been cancelled. Your new confirmation will follow shortly.</p>
        <p>Thank you for using HotelDrops! 🏨</p>
      </div>
    `,
  })
}

// ==============================
// WELCOME EMAIL (on signup)
// ==============================
async function sendWelcomeEmail(email, name) {
  const transporter = getMailTransporter()
  await transporter.sendMail({
    from:    `"HotelDrops" <${process.env.EMAIL_FROM}>`,
    to:      email,
    subject: `Welcome to HotelDrops 🏨`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2>Welcome, ${name}! 👋</h2>
        <p>You're all set. Here's how HotelDrops works:</p>
        <ol>
          <li>Upload your hotel voucher</li>
          <li>We monitor the price 24/7</li>
          <li>Price drops → WhatsApp + email alert</li>
          <li>You save money, we earn a small commission</li>
        </ol>
        <a href="${process.env.FRONTEND_URL}/upload" 
           style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">
          Upload Your First Voucher →
        </a>
      </div>
    `,
  })
}

// ==============================
// MAIL TRANSPORTER (SendGrid or Gmail)
// ==============================
function getMailTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY },
    })
  }
  // Fallback to Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  })
}

module.exports = { sendWhatsAppAlert, sendEmailAlert, sendBookingConfirmation, sendWelcomeEmail }
