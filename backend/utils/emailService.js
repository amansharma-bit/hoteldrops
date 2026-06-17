// utils/emailService.js
// Uses Resend for reliable transactional email delivery

const emailTemplates = require('./emailTemplates')

async function sendEmail(to, { subject, html }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'rebuq. <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Resend API error')
    }

    console.log(`✅ Email sent to ${to}: ${subject}`)
    return data
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message)
    throw err
  }
}

const email = {
  welcome: (to, { name }) =>
    sendEmail(to, emailTemplates.welcome({ name })),

  bookingReceived: (to, { name, booking, claimUrl }) =>
    sendEmail(to, emailTemplates.bookingReceived({ name, booking, claimUrl })),

  priceDropAlert: (to, { name, booking, oldRate, newRate, saving, hotelPageUrl, claimUrl }) =>
    sendEmail(to, emailTemplates.priceDropAlert({ name, booking, oldRate, newRate, saving, hotelPageUrl, claimUrl })),

  monitoringUpdate: (to, { name, booking, checksRun, daysMonitored }) =>
    sendEmail(to, emailTemplates.monitoringUpdate({ name, booking, checksRun, daysMonitored })),

  cancellationWindowToday: (to, { name, booking, deadline }) =>
    sendEmail(to, emailTemplates.cancellationWindowToday({ name, booking, deadline })),

  checkinPassed: (to, { name, booking, checksRun, alertsSent }) =>
    sendEmail(to, emailTemplates.checkinPassed({ name, booking, checksRun, alertsSent })),

  nonRefundable: (to, { name, booking }) =>
    sendEmail(to, emailTemplates.nonRefundable({ name, booking })),

  voucherUnreadable: (to, { name }) =>
    sendEmail(to, emailTemplates.voucherUnreadable({ name })),

  directBookingConfirmed: (to, { name, booking, memberRate, otaRate, saving, bookingRef }) =>
    sendEmail(to, emailTemplates.directBookingConfirmed({ name, booking, memberRate, otaRate, saving, bookingRef })),

  bookingCancelled: (to, { name, booking }) =>
    sendEmail(to, emailTemplates.bookingCancelled({ name, booking })),

  partialRefund: (to, { name, booking }) =>
    sendEmail(to, emailTemplates.partialRefund({ name, booking })),

  monitoringScheduled: (to, { name, booking, activatesOn }) =>
    sendEmail(to, emailTemplates.monitoringScheduled({ name, booking, activatesOn })),

  noSavingFound: (to, { name, booking, checksRun }) =>
    sendEmail(to, emailTemplates.noSavingFound({ name, booking, checksRun })),
}

module.exports = email
