// utils/emailTemplates.js

const BLUE    = '#1447b8'
const NAVY    = '#0f172a'
const WHITE   = '#ffffff'
const BG      = '#f8fafc'
const BORDER  = '#e2e8f0'
const GREY    = '#64748b'
const DARK    = '#1e293b'
const GREEN   = '#16a34a'
const GREEN_L = '#f0fdf4'
const GREEN_B = '#bbf7d0'
const AMBER   = '#b45309'
const AMBER_L = '#fffbeb'
const AMBER_B = '#fcd34d'
const RED     = '#dc2626'
const RED_L   = '#fef2f2'
const BLUE_L  = '#eff6ff'
const BLUE_B  = '#bfdbfe'

// Safe date formatter — handles both "2026-07-26" and already-formatted strings
function fmt(d) {
  if (!d) return '—'
  try {
    const parsed = new Date(d + (d.includes('T') ? '' : 'T00:00:00'))
    if (isNaN(parsed.getTime())) return d
    return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch(e) { return d }
}

function fmtPrice(n) {
  const num = Number(n)
  if (!num || isNaN(num)) return '—'
  return '₹' + num.toLocaleString('en-IN')
}

function base(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>rebuq.</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${WHITE};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">

        <!-- HEADER -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-size:20px;font-weight:800;color:${NAVY};letter-spacing:-0.03em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">rebuq<span style="color:${BLUE};">.</span></span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:${GREY};letter-spacing:0.06em;text-transform:uppercase;">Hotel Price Tracker</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY -->
        <tr><td style="padding:0;">${content}</td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid ${BORDER};background:${BG};text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:${GREY};">rebuq. — Post-Booking Hotel Price Tracker</p>
            <p style="margin:0;font-size:12px;color:${GREY};">
              <a href="https://rebuq.com" style="color:${BLUE};text-decoration:none;">rebuq.com</a>
              &nbsp;·&nbsp;
              <a href="mailto:help@rebuq.com" style="color:${BLUE};text-decoration:none;">help@rebuq.com</a>
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

function heroBlock(icon, title, subtitle, accentColor) {
  const bg = accentColor || BLUE
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:36px 32px 28px;">
        <div style="display:inline-block;width:44px;height:44px;background:${bg}18;border-radius:12px;text-align:center;line-height:44px;font-size:22px;margin-bottom:16px;">${icon}</div>
        <p style="margin:0 0 6px;font-size:24px;font-weight:800;color:${NAVY};line-height:1.2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${title}</p>
        <p style="margin:0;font-size:14px;color:${GREY};line-height:1.6;">${subtitle}</p>
      </td>
    </tr>
  </table>`
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 32px;"><div style="border-top:1px solid ${BORDER};"></div></td></tr></table>`
}

function section(content) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:24px 32px;">${content}</td></tr></table>`
}

function para(text, color, size, bold) {
  return `<p style="margin:0 0 14px;font-size:${size||'14px'};font-weight:${bold?'600':'400'};color:${color||DARK};line-height:1.6;">${text}</p>`
}

function infoGrid(rows) {
  const cells = rows.map(([label, value, valueColor]) => `
    <tr>
      <td style="padding:10px 16px;font-size:13px;color:${GREY};border-bottom:1px solid ${BORDER};width:42%;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${valueColor||DARK};border-bottom:1px solid ${BORDER};vertical-align:top;">${value}</td>
    </tr>`).join('')
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;margin:0 0 20px;">
    ${cells}
  </table>`
}

function savingsCard(oldPrice, newPrice, saving) {
  const pct = oldPrice ? Math.round(((oldPrice - newPrice) / oldPrice) * 100) : 0
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="padding:24px;background:${GREEN_L};border-radius:14px;border:1.5px solid ${GREEN_B};text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${GREEN};text-transform:uppercase;letter-spacing:0.06em;">Price Drop Found</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
          <tr>
            <td style="text-align:center;width:40%;">
              <p style="margin:0 0 4px;font-size:11px;color:${GREY};text-transform:uppercase;letter-spacing:0.05em;">You paid</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:${GREY};text-decoration:line-through;">${fmtPrice(oldPrice)}</p>
            </td>
            <td style="text-align:center;width:20%;">
              <p style="margin:0;font-size:20px;color:${GREEN};">→</p>
            </td>
            <td style="text-align:center;width:40%;">
              <p style="margin:0 0 4px;font-size:11px;color:${GREEN};text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">New price</p>
              <p style="margin:0;font-size:26px;font-weight:800;color:${GREEN};">${fmtPrice(newPrice)}</p>
            </td>
          </tr>
        </table>
        <div style="background:${WHITE};border-radius:10px;padding:14px;display:inline-block;">
          <p style="margin:0 0 2px;font-size:12px;color:${GREY};">Your saving</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:${GREEN};">${fmtPrice(saving)} <span style="font-size:14px;font-weight:600;">(${pct}% off)</span></p>
        </div>
      </td>
    </tr>
  </table>`
}

function ctaBtn(text, href) {
  return `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="background:${BLUE};border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:${WHITE};text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text} →</a>
      </td>
    </tr>
  </table>`
}

function alertBox(text, bg, border, textColor) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr>
      <td style="background:${bg||AMBER_L};border-radius:10px;border:1.5px solid ${border||AMBER_B};padding:14px 16px;">
        <p style="margin:0;font-size:13px;color:${textColor||AMBER};line-height:1.5;">${text}</p>
      </td>
    </tr>
  </table>`
}

const emailTemplates = {

  welcome({ name }) {
    return {
      subject: `Welcome to rebuq. — let's start saving on hotels`,
      html: base(`
        ${heroBlock('👋', `Welcome, ${name}!`, 'You\'ll never overpay for a hotel again. Here\'s how it works.', BLUE)}
        ${divider()}
        ${section(`
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:${BLUE_L};border-radius:12px;padding:16px;text-align:center;width:30%;vertical-align:top;">
                <p style="margin:0 0 8px;font-size:26px;font-weight:800;color:${BLUE};">1</p>
                <p style="margin:0;font-size:12px;color:${DARK};line-height:1.4;">Upload your refundable hotel voucher</p>
              </td>
              <td style="width:4%;"></td>
              <td style="background:${BLUE_L};border-radius:12px;padding:16px;text-align:center;width:30%;vertical-align:top;">
                <p style="margin:0 0 8px;font-size:26px;font-weight:800;color:${BLUE};">2</p>
                <p style="margin:0;font-size:12px;color:${DARK};line-height:1.4;">We scan prices every 6 hours automatically</p>
              </td>
              <td style="width:4%;"></td>
              <td style="background:${BLUE_L};border-radius:12px;padding:16px;text-align:center;width:30%;vertical-align:top;">
                <p style="margin:0 0 8px;font-size:26px;font-weight:800;color:${BLUE};">3</p>
                <p style="margin:0;font-size:12px;color:${DARK};line-height:1.4;">Price drops → instant WhatsApp alert</p>
              </td>
            </tr>
          </table>
          ${ctaBtn('Upload My First Booking', 'https://rebuq.com')}
          ${para('Questions? Email us at <a href="mailto:help@rebuq.com" style="color:'+BLUE+';">help@rebuq.com</a>', GREY, '12px')}
        `)}
      `)
    }
  },

  bookingReceived({ name, booking }) {
    // Accept both camelCase and snake_case field names
    const hotelName   = booking.hotelName   || booking.hotel_name   || '—'
    const city        = booking.city        || booking.hotel_city   || '—'
    const checkIn     = booking.checkIn     || booking.checkinDate  || booking.check_in   || null
    const checkOut    = booking.checkOut    || booking.checkoutDate || booking.check_out  || null
    const roomType    = booking.roomType    || booking.room_type    || '—'
    const adults      = booking.adults      || booking.num_adults   || 2
    const children    = booking.children?.length ? booking.children.map(a=>`${a} yrs`).join(', ') : 'None'
    const totalPaid   = booking.totalPaid   || booking.amountPaid   || booking.total_price_paid || null
    const otaName     = booking.platform    || booking.otaName      || booking.ota_name   || '—'
    const bookingRef  = booking.bookingRef  || booking.booking_reference || '—'
    const cancelDeadline = booking.cancellationDeadline || booking.cancellation_deadline || null
    const cancelLine  = cancelDeadline ? `Free cancel until ${fmt(cancelDeadline)}` : 'Refundable'
    const nights      = booking.nights || (checkIn && checkOut ? Math.round((new Date(checkOut+'T00:00:00') - new Date(checkIn+'T00:00:00')) / 86400000) : null)

    return {
      subject: `Your ${hotelName} booking is being tracked — rebuq`,
      html: base(`
        ${heroBlock('✅', 'We\'re watching your booking.', 'You\'ll hear from us the moment the price drops.', GREEN)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Your booking has been added to rebuq. We\'re monitoring the rate and will alert you instantly if the price drops for the same room and meal plan.')}
          ${infoGrid([
            ['Hotel',             hotelName],
            ['Location',          city],
            ['Check-in',          fmt(checkIn)],
            ['Check-out',         fmt(checkOut)],
            ['Duration',          nights ? `${nights} night${nights>1?'s':''}` : '—'],
            ['Room',              roomType],
            ['Adults',            String(adults)],
            ['Children',          children],
            ['Total paid',        fmtPrice(totalPaid)],
            ['Booked on',         otaName],
            ['Booking reference', bookingRef],
            ['Cancellation',      cancelLine],
          ])}
          ${para('The moment we find a lower rate for the same hotel, room and dates — we\'ll send you a WhatsApp with a direct rebooking link.', GREY, '13px')}
        `)}
      `)
    }
  },

  priceDropAlert({ name, booking, oldRate, newRate, saving, hotelPageUrl }) {
    const hotelName  = booking.hotelName  || booking.hotel_name  || '—'
    const city       = booking.city       || booking.hotel_city  || '—'
    const checkIn    = booking.checkinDate  || booking.checkIn   || booking.check_in  || null
    const checkOut   = booking.checkoutDate || booking.checkOut  || booking.check_out || null
    const bookingRef = booking.bookingRef   || booking.booking_reference || '—'
    const otaName    = booking.otaName      || booking.ota_name  || 'your OTA'

    return {
      subject: `💰 Price drop on ${hotelName} — save ${fmtPrice(saving)}`,
      html: base(`
        ${heroBlock('💰', 'Price drop found on your hotel.', `Act now before this rate disappears.`, GREEN)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para(`We found a lower price on your upcoming stay at <strong>${hotelName}</strong>.`)}
          ${savingsCard(oldRate, newRate, saving)}
          ${alertBox('⚡ &nbsp;This rate may not last long — hotel prices change frequently. Act quickly.', AMBER_L, AMBER_B, AMBER)}
          ${para('How to secure this saving:', DARK, '14px', true)}
          <ol style="margin:0 0 20px;padding-left:20px;color:${DARK};font-size:13px;line-height:1.8;">
            <li>Tap the button below to view the hotel page</li>
            <li>Select your room and confirm the new booking</li>
            <li>Cancel your existing booking on ${otaName}</li>
            <li>Keep the difference — it\'s yours</li>
          </ol>
          ${ctaBtn('View deal & rebook', hotelPageUrl || 'https://rebuq.com')}
          ${infoGrid([
            ['Hotel',      hotelName],
            ['Location',   city],
            ['Check-in',   fmt(checkIn)],
            ['Check-out',  fmt(checkOut)],
            ['Booking ref',bookingRef],
          ])}
          ${para('Same hotel · same room · same meals · taxes included', GREY, '12px')}
        `)}
      `)
    }
  },

  checkinPassed({ name, booking, checksRun, alertsSent }) {
    return {
      subject: `Your ${booking.hotelName||booking.hotel_name} stay has begun — monitoring complete`,
      html: base(`
        ${heroBlock('🏨', 'Enjoy your stay!', 'Monitoring is now complete for this booking.', BLUE)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para(`Your check-in date for <strong>${booking.hotelName||booking.hotel_name}</strong> has passed. We've closed monitoring on this booking.`)}
          ${infoGrid([
            ['Hotel',       booking.hotelName||booking.hotel_name],
            ['Stay',        `${fmt(booking.checkinDate||booking.check_in)} → ${fmt(booking.checkoutDate||booking.check_out)}`],
            ['Checks run',  `${checksRun} price checks`],
            ['Alerts sent', alertsSent > 0 ? `${alertsSent} price drop alert(s) sent` : 'No price drop found'],
          ])}
          ${para('Have another trip coming up?', DARK, '14px', true)}
          ${ctaBtn('Upload next booking', 'https://rebuq.com')}
        `)}
      `)
    }
  },

  noSavingFound({ name, booking, checksRun }) {
    return {
      subject: `Monitoring complete — ${booking.hotelName||booking.hotel_name}`,
      html: base(`
        ${heroBlock('📊', 'Monitoring complete.', 'No price drop was found this time.', BLUE)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para(`We ran ${checksRun} checks on your booking but couldn't find a lower rate this time.`)}
          ${infoGrid([
            ['Hotel',      booking.hotelName||booking.hotel_name],
            ['Stay',       `${fmt(booking.checkinDate||booking.check_in)} → ${fmt(booking.checkoutDate||booking.check_out)}`],
            ['Checks run', `${checksRun} checks`],
            ['Result',     'No price drop found'],
          ])}
          ${para('It doesn\'t always happen — but when it does, the savings are real. Upload your next booking and we\'ll watch again.', GREY, '13px')}
          ${ctaBtn('Upload next booking', 'https://rebuq.com')}
        `)}
      `)
    }
  },

  nonRefundable({ name, booking }) {
    return {
      subject: `Unable to monitor — ${booking.hotelName||booking.hotel_name} is non-refundable`,
      html: base(`
        ${heroBlock('⚠️', 'This booking is non-refundable.', 'We\'re unable to monitor this stay.', AMBER)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Thank you for uploading your booking. Unfortunately we\'ve identified this as a non-refundable rate — so even if the price drops, rebooking wouldn\'t be possible.')}
          ${alertBox('Non-refundable rate detected. Monitoring not activated.', RED_L, RED+'44', RED)}
          ${infoGrid([
            ['Hotel',     booking.hotelName||booking.hotel_name],
            ['Check-in',  fmt(booking.checkinDate||booking.check_in)],
            ['Rate type', 'Non-refundable'],
          ])}
          ${para('For your next booking, choose a flexible or free cancellation rate and upload it to rebuq.', GREY, '13px')}
          ${ctaBtn('Upload a flexible booking', 'https://rebuq.com')}
        `)}
      `)
    }
  },

  voucherUnreadable({ name }) {
    return {
      subject: `Action needed — we couldn't read your hotel voucher`,
      html: base(`
        ${heroBlock('📄', 'We couldn\'t read your voucher.', 'Two quick options to get you tracked.', AMBER)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('We received your voucher but had trouble reading the booking details. Here\'s how to fix it:')}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
            <tr>
              <td style="background:${BLUE_L};border-radius:12px;padding:16px;width:47%;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${BLUE};">Option 1 — Reupload</p>
                <p style="margin:0;font-size:13px;color:${DARK};line-height:1.5;">Upload a clearer image or PDF. A direct PDF from your email works best.</p>
              </td>
              <td style="width:6%;"></td>
              <td style="background:${BLUE_L};border-radius:12px;padding:16px;width:47%;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${BLUE};">Option 2 — Enter manually</p>
                <p style="margin:0;font-size:13px;color:${DARK};line-height:1.5;">Enter your booking details directly. Takes under a minute.</p>
              </td>
            </tr>
          </table>
          ${ctaBtn('Go to rebuq', 'https://rebuq.com')}
        `)}
      `)
    }
  },

  monitoringUpdate({ name, booking, checksRun, daysMonitored }) {
    return {
      subject: `Monitoring update — ${booking.hotelName||booking.hotel_name}`,
      html: base(`
        ${heroBlock('👁️', 'Still watching. No drop yet.', 'We\'ll alert you the moment something changes.', BLUE)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Quick update on your upcoming stay. We\'ve been checking every 6 hours and haven\'t found a better price yet.')}
          ${infoGrid([
            ['Hotel',       booking.hotelName||booking.hotel_name],
            ['Check-in',    fmt(booking.checkinDate||booking.check_in)],
            ['Checks run',  `${checksRun} checks over ${daysMonitored} days`],
            ['Status',      'Active — checking every 6 hours'],
          ])}
          ${para('We\'ll WhatsApp you the moment we find a lower price.', GREY, '13px')}
        `)}
      `)
    }
  },

  cancellationWindowToday({ name, booking, deadline }) {
    return {
      subject: `⏰ Urgent — cancellation window closes today (${booking.hotelName||booking.hotel_name})`,
      html: base(`
        ${heroBlock('⏰', 'Cancellation window closes today.', 'Our team will reach out to you within the hour.', AMBER)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Your free cancellation window on this booking expires today.')}
          ${alertBox('📞 &nbsp;Our team will personally reach out within the hour to review current rates and assist you before your deadline expires.', BLUE_L, BLUE_B, BLUE)}
          ${infoGrid([
            ['Hotel',                  booking.hotelName||booking.hotel_name],
            ['Check-in',               fmt(booking.checkinDate||booking.check_in)],
            ['Cancellation deadline',  `Today — ${deadline}`],
          ])}
          ${ctaBtn('View current rates', 'https://rebuq.com/dashboard')}
        `)}
      `)
    }
  },

  directBookingConfirmed({ name, booking, memberRate, otaRate, saving, bookingRef }) {
    return {
      subject: `Booking confirmed — you saved ${fmtPrice(saving)} vs OTA`,
      html: base(`
        ${heroBlock('🎉', 'Booking confirmed at your member rate.', 'You\'ve already saved vs the public OTA price.', GREEN)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Your hotel booking has been confirmed through rebuq at your exclusive member rate.')}
          ${infoGrid([
            ['Hotel',            booking.hotelName||booking.hotel_name],
            ['Location',         booking.city||booking.hotel_city],
            ['Check-in',         fmt(booking.checkinDate||booking.check_in)],
            ['Check-out',        fmt(booking.checkoutDate||booking.check_out)],
            ['Your member rate', fmtPrice(memberRate) + '/night', GREEN],
            ['OTA public rate',  fmtPrice(otaRate) + '/night'],
            ['You saved',        fmtPrice(saving), GREEN],
            ['Booking ref',      bookingRef],
          ])}
          ${para('We\'ll continue monitoring in case the rate drops further.', GREY, '13px')}
        `)}
      `)
    }
  },

  bookingCancelled({ name, booking }) {
    return {
      subject: `Monitoring stopped — ${booking.hotelName||booking.hotel_name} booking cancelled`,
      html: base(`
        ${heroBlock('🚫', 'Monitoring stopped.', 'Your booking has been cancelled.', GREY)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('We\'ve stopped monitoring this stay and no further alerts will be sent.')}
          ${infoGrid([
            ['Hotel',    booking.hotelName||booking.hotel_name],
            ['Check-in', fmt(booking.checkinDate||booking.check_in)],
            ['Status',   'Cancelled — monitoring stopped'],
          ])}
          ${ctaBtn('Upload a new booking', 'https://rebuq.com')}
        `)}
      `)
    }
  },

  partialRefund({ name, booking }) {
    return {
      subject: `Partial refund policy detected — ${booking.hotelName||booking.hotel_name}`,
      html: base(`
        ${heroBlock('⚠️', 'Partial refund policy detected.', 'Monitoring not activated for your protection.', AMBER)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('To protect you from unintended cancellation charges, we\'ve treated this as non-refundable and monitoring will not be activated.')}
          ${infoGrid([
            ['Hotel',     booking.hotelName||booking.hotel_name],
            ['Check-in',  fmt(booking.checkinDate||booking.check_in)],
            ['Rate type', 'Partial refundable'],
          ])}
          ${para('Reply to this email if you\'d like us to review manually.', GREY, '12px')}
        `)}
      `)
    }
  },

  monitoringScheduled({ name, booking, activatesOn }) {
    return {
      subject: `Booking received — monitoring starts ${activatesOn} (${booking.hotelName||booking.hotel_name})`,
      html: base(`
        ${heroBlock('📅', 'Booking received.', 'Monitoring activates closer to your stay.', BLUE)}
        ${divider()}
        ${section(`
          ${para(`Hi ${name},`)}
          ${para('Your check-in is more than 90 days away. We\'ll activate monitoring closer to your stay when savings opportunities are highest.')}
          ${infoGrid([
            ['Hotel',               booking.hotelName||booking.hotel_name],
            ['Check-in',            fmt(booking.checkinDate||booking.check_in)],
            ['Monitoring activates',activatesOn],
            ['Status',              'Scheduled'],
          ])}
          ${para('We\'ll WhatsApp you when monitoring activates.', GREY, '13px')}
        `)}
      `)
    }
  },

}

module.exports = emailTemplates
