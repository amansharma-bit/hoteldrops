// utils/emailTemplates.js
// All HTML email templates matching rebuq website style
// Used by nodemailer in your Express backend

// ── BRAND ──
const NAVY  = '#0A0A1E'
const BLUE  = '#1A3AF7'
const WHITE = '#FFFFFF'
const G50   = '#F8F9FC'
const G100  = '#F0F1F5'
const G400  = '#9498AA'
const G600  = '#545769'
const G800  = '#1E2030'
const GREEN = '#1A8A4A'
const GREEN_L = '#E8F5EE'
const AMBER = '#B85A00'
const AMBER_L = '#FFF3E0'
const RED   = '#C0272A'
const RED_L = '#FDEAEA'
const BLUE_L = '#E8ECFF'

function base(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rebuq.</title>
</head>
<body style="margin:0;padding:0;background:${G50};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${G50};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:${NAVY};border-radius:16px 16px 0 0;padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td><span style="font-size:22px;font-weight:800;color:${WHITE};letter-spacing:-0.03em;">rebuq<span style="color:${BLUE};">.</span></span></td>
                <td align="right"><span style="font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;">Post-Booking Price Tracker</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${WHITE};padding:0;">${content}</td>
        </tr>
        <tr>
          <td style="background:${G100};border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:${G400};">rebuq. — Post-Booking Hotel Price Tracker</p>
            <p style="margin:0 0 8px;font-size:12px;color:${G400};">You're receiving this because you have an active booking on rebuq.com</p>
            <p style="margin:0;font-size:12px;">
              <a href="#" style="color:${BLUE};text-decoration:none;">Unsubscribe</a>
              <span style="color:${G400};margin:0 8px;">|</span>
              <a href="#" style="color:${BLUE};text-decoration:none;">Privacy Policy</a>
              <span style="color:${G400};margin:0 8px;">|</span>
              <a href="mailto:help@rebuq.com" style="color:${BLUE};text-decoration:none;">Help Centre</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function hero(title, subtitle, bg = NAVY) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:${bg};padding:32px 36px 28px;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:${WHITE};line-height:1.2;">${title}</p>
        <p style="margin:0;font-size:14px;color:rgba(197,208,251,0.9);line-height:1.5;">${subtitle}</p>
      </td>
    </tr>
  </table>`
}

function body(content) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 36px;">${content}</td></tr></table>`
}

function para(text, opts = {}) {
  const color  = opts.color  || G800
  const size   = opts.size   || '14px'
  const weight = opts.bold   ? '600' : '400'
  const mb     = opts.mb !== undefined ? opts.mb : '16px'
  return `<p style="margin:0 0 ${mb};font-size:${size};font-weight:${weight};color:${color};line-height:1.6;">${text}</p>`
}

function infoTable(rows) {
  const cells = rows.map(([label, value, valueColor]) => `
    <tr>
      <td style="padding:10px 14px;font-size:13px;color:${G600};width:40%;border-bottom:1px solid ${G100};">${label}</td>
      <td style="padding:10px 14px;font-size:13px;font-weight:600;color:${valueColor || G800};border-bottom:1px solid ${G100};">${value}</td>
    </tr>`).join('')
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BLUE_L};border-radius:12px;overflow:hidden;margin:0 0 20px;">
    ${cells}
  </table>`
}

function alertBox(text, bg = AMBER_L, color = AMBER, icon = '⚠️') {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="background:${bg};border-radius:10px;padding:14px 16px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:${color};line-height:1.5;">${icon}&nbsp; ${text}</p>
      </td>
    </tr>
  </table>`
}

function ctaBtn(text, href = '#', bg = BLUE) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="background:${bg};border-radius:10px;padding:13px 24px;">
        <a href="${href}" style="font-size:14px;font-weight:600;color:${WHITE};text-decoration:none;white-space:nowrap;">${text}</a>
      </td>
    </tr>
  </table>`
}

function savingsTable(oldRate, newRate, saving, currency) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;overflow:hidden;margin:0 0 20px;">
    <tr>
      <td style="background:${G100};padding:10px 14px;font-size:12px;font-weight:600;color:${G600};"></td>
      <td style="background:${G100};padding:10px 14px;font-size:12px;font-weight:600;color:${G600};text-align:center;">Current rate</td>
      <td style="background:${G100};padding:10px 14px;font-size:12px;font-weight:600;color:${GREEN};text-align:center;">Lower rate found</td>
    </tr>
    <tr>
      <td style="background:${WHITE};padding:10px 14px;font-size:13px;color:${G600};border-bottom:1px solid ${G100};">Per night</td>
      <td style="background:${WHITE};padding:10px 14px;font-size:13px;color:${G800};text-align:center;border-bottom:1px solid ${G100};">${currency} ${oldRate}</td>
      <td style="background:${WHITE};padding:10px 14px;font-size:13px;font-weight:600;color:${GREEN};text-align:center;border-bottom:1px solid ${G100};">${currency} ${newRate}</td>
    </tr>
    <tr>
      <td style="background:${GREEN_L};padding:12px 14px;font-size:13px;font-weight:600;color:${GREEN};">You could save</td>
      <td style="background:${GREEN_L};padding:12px 14px;"></td>
      <td style="background:${GREEN_L};padding:12px 14px;font-size:16px;font-weight:700;color:${GREEN};text-align:center;">${currency} ${saving}</td>
    </tr>
  </table>`
}

function steps(items) {
  return items.map((item, i) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;">
    <tr>
      <td style="width:28px;vertical-align:top;padding-top:1px;">
        <div style="width:22px;height:22px;background:${BLUE};border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:700;color:${WHITE};">${i + 1}</div>
      </td>
      <td style="padding-left:10px;font-size:13px;color:${G800};line-height:1.5;">${item}</td>
    </tr>
  </table>`).join('')
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="border-top:1px solid ${G100};"></td></tr></table>`
}

const emailTemplates = {

  welcome({ name }) {
    return {
      subject: `Welcome to rebuq. — let's start saving.`,
      html: base(`
        ${hero("Welcome to rebuq.", "You'll never overpay for a hotel again.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Your rebuq account is ready. Here's how it works:")}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
            <tr>
              <td style="background:${BLUE_L};border-radius:10px;padding:16px;text-align:center;width:30%;">
                <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:${BLUE};">1</p>
                <p style="margin:0;font-size:12px;color:${G800};line-height:1.4;">Upload your refundable hotel voucher</p>
              </td>
              <td style="width:5%;"></td>
              <td style="background:${BLUE_L};border-radius:10px;padding:16px;text-align:center;width:30%;">
                <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:${BLUE};">2</p>
                <p style="margin:0;font-size:12px;color:${G800};line-height:1.4;">We monitor hotel prices every 6 hours</p>
              </td>
              <td style="width:5%;"></td>
              <td style="background:${BLUE_L};border-radius:10px;padding:16px;text-align:center;width:30%;">
                <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:${BLUE};">3</p>
                <p style="margin:0;font-size:12px;color:${G800};line-height:1.4;">If the price drops, we WhatsApp you instantly</p>
              </td>
            </tr>
          </table>
          ${para("Got a trip coming up?", { bold: true, color: NAVY })}
          ${para("Upload your first hotel voucher now and we'll start watching straight away.")}
          ${ctaBtn("Upload My First Booking →", "https://rebuq.com/upload")}
          ${divider()}
          ${para("Questions? We're at <a href='mailto:help@rebuq.com' style='color:" + BLUE + ";'>help@rebuq.com</a> — always happy to help.", { color: G600, size: '12px' })}
        `)}
      `)
    }
  },

  bookingReceived({ name, booking }) {
    const fmt = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) } catch(e) { return d } }
    const children = booking.children?.length ? booking.children.map(a=>`${a} yrs`).join(', ') : 'None'
    const cancelLine = booking.cancellationDeadline
      ? `Free cancel until ${fmt(booking.cancellationDeadline)}`
      : 'Refundable'
    return {
      subject: `Your ${booking.hotelName} booking is being tracked — rebuq`,
      html: base(`
        ${hero("We're watching your booking.", "You'll hear from us the moment the price drops.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Your booking has been added to rebuq. We're monitoring the rate and will alert you instantly if the price drops for the same room and meal plan.")}
          ${infoTable([
            ["Hotel",             booking.hotelName],
            ["Location",          booking.city],
            ["Check-in",          fmt(booking.checkinDate)],
            ["Check-out",         fmt(booking.checkoutDate)],
            ["Room",              booking.roomType || '—'],
            ["Adults",            booking.adults],
            ["Children",          children],
            ["Total paid",        `₹${Number(booking.amountPaid).toLocaleString('en-IN')}`],
            ["Booked on",         booking.otaName || '—'],
            ["Booking reference", booking.bookingRef || '—'],
            ["Cancellation",      cancelLine],
          ])}
          ${para("What happens next?", { bold: true, color: NAVY })}
          ${para("The moment we find a lower rate for the same hotel, room, and dates — we'll send you a WhatsApp with a direct link to rebook. Cancel your existing booking, rebook at the lower rate, and keep the difference.")}
          ${para("The saving is yours to keep. We just find it.", { color: G600 })}
        `)}
      `)
    }
  },

  priceDropAlert({ name, booking, oldRate, newRate, saving, hotelPageUrl }) {
    return {
      subject: `💰 Price drop on ${booking.hotelName} — save ${booking.currency} ${saving}`,
      html: base(`
        ${hero("Price drop found on your hotel.", "Act now to secure the lower rate.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("We've found a lower price on your upcoming stay. Here's what we found:")}
          ${savingsTable(oldRate, newRate, saving, booking.currency)}
          ${alertBox("This rate may not last long. Hotel prices change frequently.", AMBER_L, AMBER, "⚡")}
          ${para("How to secure this saving:", { bold: true, color: NAVY })}
          ${steps([
            "We've sent you a WhatsApp with the hotel page link.",
            "Open the WhatsApp, tap the link, and select your room and board preference.",
            `Cancel your existing booking on ${booking.otaName || 'your OTA'}.`,
            "Complete your new booking at the lower rate.",
          ])}
          ${para("Didn't get the WhatsApp?", { bold: true, color: NAVY, mb: '8px' })}
          ${ctaBtn("View Hotel Page →", hotelPageUrl)}
          ${infoTable([
            ["Hotel",            booking.hotelName],
            ["Check-in",         booking.checkinDate],
            ["Check-out",        booking.checkoutDate],
            ["Your booking ref", booking.bookingRef || '—'],
            ["Lower rate valid", "As of today — act quickly"],
          ])}
        `)}
      `)
    }
  },

  monitoringUpdate({ name, booking, checksRun, daysMonitored }) {
    return {
      subject: `Monitoring update — ${booking.hotelName} (${booking.checkinDate})`,
      html: base(`
        ${hero("Still watching. No drop yet.", "We'll alert you the moment something changes.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Quick update on your upcoming stay. We've been monitoring rates every 6 hours and haven't found a better price yet.")}
          ${infoTable([
            ["Hotel",             booking.hotelName],
            ["Check-in",         `${booking.checkinDate} — ${booking.daysToCheckin} days to go`],
            ["Checks run",       `${checksRun} checks over ${daysMonitored} days`],
            ["Current best rate",`${booking.currency} ${booking.currentBestRate} — no saving yet`],
            ["Status",           "Active — checking every 6 hours"],
          ])}
          ${para("We'll WhatsApp you the moment we find a lower price.", { color: G600 })}
        `)}
      `)
    }
  },

  cancellationWindowToday({ name, booking, deadline }) {
    return {
      subject: `⏰ Urgent — your cancellation window closes today (${booking.hotelName})`,
      html: base(`
        ${hero("Your cancellation window closes today.", "Our team will personally reach out within the hour.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Your free cancellation window on this booking expires today.")}
          ${alertBox("Our team will personally reach out to you within the hour to review the current rates and assist you in securing the best available option before your cancellation deadline expires. Please keep an eye on your phone.", BLUE_L, BLUE, "📞")}
          ${infoTable([
            ["Hotel",                booking.hotelName],
            ["Check-in",             booking.checkinDate],
            ["Cancellation deadline",`Today — ${deadline}`],
            ["Your current rate",    `${booking.currency} ${booking.amountPaid.toLocaleString()}`],
            ["Best rate found",      booking.bestRate ? `${booking.currency} ${booking.bestRate}` : "Still searching"],
          ])}
          ${ctaBtn("View Current Rates →", "https://rebuq.com/dashboard")}
        `)}
      `)
    }
  },

  checkinPassed({ name, booking, checksRun, alertsSent }) {
    return {
      subject: `Your ${booking.hotelName} stay has begun — monitoring complete`,
      html: base(`
        ${hero("Your check-in date has passed.", "Monitoring is now closed for this booking.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para(`Your check-in date for ${booking.hotelName} has now passed. We've closed monitoring on this booking.`)}
          ${infoTable([
            ["Hotel",       booking.hotelName],
            ["Stay",        `${booking.checkinDate} → ${booking.checkoutDate}`],
            ["Checks run",  `${checksRun} checks`],
            ["Alerts sent", alertsSent > 0 ? `${alertsSent} price drop alert(s) sent` : "No price drop found"],
            ["Status",      "Monitoring closed"],
          ])}
          ${para("Have another trip coming up?", { bold: true, color: NAVY, mb: '8px' })}
          ${ctaBtn("Upload Next Booking →", "https://rebuq.com/upload")}
        `)}
      `)
    }
  },

  nonRefundable({ name, booking }) {
    return {
      subject: `Unable to monitor — ${booking.hotelName} is non-refundable`,
      html: base(`
        ${hero("This booking is non-refundable.", "We're unable to monitor this stay.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Thank you for uploading your booking. Unfortunately, we've identified this as a non-refundable rate.")}
          ${alertBox("Non-refundable rate detected. Monitoring not possible for this booking.", RED_L, RED, "✕")}
          ${infoTable([
            ["Hotel",     booking.hotelName],
            ["Check-in",  booking.checkinDate],
            ["Rate type", "Non-refundable"],
            ["Status",    "Not monitored — no action taken"],
          ])}
          ${para("For your next booking, choose a flexible or free cancellation rate.", { color: G600 })}
        `)}
      `)
    }
  },

  voucherUnreadable({ name }) {
    return {
      subject: `Action needed — we couldn't read your hotel voucher`,
      html: base(`
        ${hero("We couldn't read your voucher.", "Two options to get your booking monitored.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("We received your voucher but had trouble reading the booking details.")}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
            <tr>
              <td style="background:${BLUE_L};border-radius:10px;padding:16px;width:47%;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${BLUE};">Option 1 — Reupload</p>
                <p style="margin:0;font-size:13px;color:${G800};line-height:1.5;">Upload a clearer version. A direct PDF from your email works best.</p>
              </td>
              <td style="width:6%;"></td>
              <td style="background:${BLUE_L};border-radius:10px;padding:16px;width:47%;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${BLUE};">Option 2 — Enter manually</p>
                <p style="margin:0;font-size:13px;color:${G800};line-height:1.5;">Enter your booking details directly. Takes under a minute.</p>
              </td>
            </tr>
          </table>
          ${ctaBtn("Reupload or Enter Manually →", "https://rebuq.com/upload")}
        `)}
      `)
    }
  },

  directBookingConfirmed({ name, booking, memberRate, otaRate, saving, bookingRef }) {
    return {
      subject: `Booking confirmed — you saved ${booking.currency} ${saving} vs OTA 🎉`,
      html: base(`
        ${hero("Booking confirmed at your member rate.", "You've already saved vs the public OTA price.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Your hotel booking has been confirmed through rebuq at your exclusive member rate.")}
          ${infoTable([
            ["Hotel",            booking.hotelName],
            ["Location",         booking.city],
            ["Check-in",         booking.checkinDate],
            ["Check-out",        booking.checkoutDate],
            ["Room type",        booking.roomType],
            ["Adults",           booking.adults],
            ["Children",         booking.children?.length ? booking.children.map(a=>`${a}yrs`).join(', ') : 'None'],
            ["Your member rate", `${booking.currency} ${memberRate.toLocaleString()}/night`],
            ["OTA public rate",  `${booking.currency} ${otaRate.toLocaleString()}/night`],
            ["You saved vs OTA", `${booking.currency} ${saving.toLocaleString()} ✓`, GREEN],
            ["Booking ref",      bookingRef],
          ])}
          ${para("We'll continue monitoring in case the rate drops further.", { color: G600 })}
        `)}
      `)
    }
  },

  bookingCancelled({ name, booking }) {
    return {
      subject: `Monitoring stopped — ${booking.hotelName} booking cancelled`,
      html: base(`
        ${hero("Booking cancelled. Monitoring stopped.", "")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("We've stopped monitoring this stay and no further alerts will be sent.")}
          ${infoTable([
            ["Hotel",    booking.hotelName],
            ["Check-in", booking.checkinDate],
            ["Status",   "Cancelled — monitoring stopped"],
          ])}
          ${ctaBtn("Upload a New Booking →", "https://rebuq.com/upload")}
        `)}
      `)
    }
  },

  partialRefund({ name, booking }) {
    return {
      subject: `Partial refund policy detected — ${booking.hotelName} not monitored`,
      html: base(`
        ${hero("This booking has a partial refund policy.", "We've treated it as non-refundable for your protection.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("To protect you from any unintended cancellation charges, we've treated this as non-refundable and monitoring will not be activated.")}
          ${alertBox("Partial refund policy detected. Monitoring not activated.", AMBER_L, AMBER, "⚠️")}
          ${infoTable([
            ["Hotel",     booking.hotelName],
            ["Check-in",  booking.checkinDate],
            ["Rate type", "Partial refundable"],
            ["Status",    "Not monitored"],
          ])}
          ${para("Reply to this email if you'd like us to review manually.", { color: G600, size: '12px' })}
        `)}
      `)
    }
  },

  monitoringScheduled({ name, booking, activatesOn }) {
    return {
      subject: `Booking received — monitoring starts ${activatesOn} (${booking.hotelName})`,
      html: base(`
        ${hero("Booking received. Monitoring starts closer to your stay.", "We'll activate tracking at the right time.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para("Your check-in is more than 90 days away. We'll activate monitoring closer to your stay when savings opportunities are highest.")}
          ${infoTable([
            ["Hotel",               booking.hotelName],
            ["Check-in",            booking.checkinDate],
            ["Monitoring activates",activatesOn],
            ["Status",              "Scheduled — not yet active"],
          ])}
          ${para("We'll WhatsApp you when monitoring activates.", { color: G600 })}
        `)}
      `)
    }
  },

  noSavingFound({ name, booking, checksRun }) {
    return {
      subject: `Your ${booking.hotelName} stay is complete — no price drop found this time`,
      html: base(`
        ${hero("Your stay is complete.", "No price drop was found this time.")}
        ${body(`
          ${para(`Hi ${name},`)}
          ${para(`We monitored your booking for ${checksRun} checks but weren't able to find a lower rate this time.`)}
          ${infoTable([
            ["Hotel",      booking.hotelName],
            ["Stay",       `${booking.checkinDate} → ${booking.checkoutDate}`],
            ["Checks run", `${checksRun} checks`],
            ["Result",     "No price drop found"],
          ])}
          ${para("It doesn't always happen — but when it does, the savings are real.", { color: G600 })}
          ${ctaBtn("Upload Next Booking →", "https://rebuq.com/upload")}
        `)}
      `)
    }
  },
}

module.exports = emailTemplates
