// utils/emailService.js
// Nodemailer wrapper — use this to send all rebuq emails

const nodemailer     = require('nodemailer')
const emailTemplates = require('./emailTemplates')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendEmail(to, { subject, html }) {
  try {
    await transporter.sendMail({
      from: `"rebuq." <${process.env.SMTP_FROM || 'hello@rebuq.com'}>`,
      to,
      subject,
      html,
    })
    console.log(`Email sent to ${to}: ${subject}`)
  } catch (err) {
    console.error(`Email failed to ${to}:`, err.message)
    throw err
  }
}

const email = {
  welcome: (to, { name }) =>
    sendEmail(to, emailTemplates.welcome({ name })),

  bookingReceived: (to, { name, booking }) =>
    sendEmail(to, emailTemplates.bookingReceived({ name, booking })),

  priceDropAlert: (to, { name, booking, oldRate, newRate, saving, hotelPageUrl }) =>
    sendEmail(to, emailTemplates.priceDropAlert({ name, booking, oldRate, newRate, saving, hotelPageUrl })),

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
