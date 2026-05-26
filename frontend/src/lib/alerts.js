// lib/alerts.js
// All alert message definitions in one place.
// Import and use: ALERTS.VOUCHER.BLURRED, ALERTS.STATUS.MONITORING_ACTIVE etc.
// Pass to <Alert {...ALERTS.VOUCHER.BLURRED} /> with your action handlers added.

export const ALERTS = {

  VOUCHER: {

    PROCESSING: {
      message: "Analysing your voucher...",
      sub: "We're reading your booking details. This usually takes a few seconds.",
    },

    SUCCESS: {
      type: 'success',
      badge: 'Extracted',
      title: 'Voucher read successfully.',
      body: 'We\'ve extracted your booking details. Please review and confirm everything looks correct before we start monitoring.',
    },

    BLURRED: {
      type: 'warning',
      badge: 'Action needed',
      icon: '⚠️',
      title: "We couldn't read your voucher clearly.",
      body: "The image may be blurred, cropped, or taken at an angle. Please try uploading a clearer version, or enter your booking details manually.",
      sub: "💡 Tip: A direct PDF from your confirmation email works best.",
    },

    NO_PRICE: {
      type: 'warning',
      badge: 'Add amount',
      icon: '💰',
      title: "We couldn't find a price on your voucher.",
      body: "This can happen with prepaid or corporate bookings where the rate is shown separately. Please add the amount you paid so we can start monitoring.",
    },

    PAY_AT_HOTEL: {
      type: 'info',
      badge: 'Add amount',
      icon: '🏨',
      title: "Your booking shows a 'Pay at hotel' rate.",
      body: "We can still monitor for lower prices — we just need your expected amount as a reference. Please add the amount you're expecting to pay.",
    },

    TAXES_SEPARATE: {
      type: 'info',
      badge: 'Please confirm',
      icon: '🧮',
      title: "We've added your base rate and taxes together.",
      body: "Your voucher showed these separately, so we've combined them for monitoring. Please confirm this total is correct.",
    },

    NON_REFUNDABLE: {
      type: 'error',
      badge: 'Cannot monitor',
      icon: '🚫',
      title: 'This booking is non-refundable.',
      body: "Because this rate cannot be cancelled, we're unable to monitor it or alert you to any price changes. rebuq only works with refundable bookings.",
      sub: "For your next trip, choose a free cancellation rate and we'll watch it for you.",
    },

    PARTIAL_REFUND: {
      type: 'warning',
      badge: 'Not monitored',
      icon: '⚠️',
      title: 'This booking has a partial refund policy.',
      body: "To protect you from any unintended cancellation charges, we've treated this as non-refundable and will not be monitoring it.",
      sub: "If you'd like us to review this manually, please contact our support team.",
    },

    DUPLICATE: {
      type: 'info',
      badge: 'Already tracking',
      icon: 'ℹ️',
      title: 'This booking is already being monitored.',
      body: "We found a booking with the same hotel, dates and reference already in your account. We haven't created a duplicate — your existing booking is active.",
    },

    CHECKIN_PASSED: {
      type: 'neutral',
      badge: 'Monitoring not possible',
      icon: '📅',
      title: 'Your check-in date has already passed.',
      body: "We're unable to monitor a booking that has already started or completed. If you have an upcoming trip, upload that booking and we'll watch it for you.",
    },

    TOO_FAR_OUT: {
      type: 'info',
      badge: 'Monitoring scheduled',
      icon: '📅',
      title: 'Your booking has been received.',
      body: "Your check-in is more than 90 days away. We'll activate monitoring closer to your stay, when hotel prices are most volatile and savings are most likely.",
      sub: "We'll notify you on WhatsApp when active monitoring begins.",
    },

    WITHIN_24H: {
      type: 'warning',
      badge: 'Limited window',
      icon: '⏰',
      title: 'Your check-in is in less than 24 hours.',
      body: "We'll do our best to find a lower rate in the time remaining, but the monitoring window is very short. We'll alert you immediately on WhatsApp if we find anything.",
    },

    HOTEL_NOT_FOUND: {
      type: 'info',
      badge: 'Manual search',
      icon: '🔍',
      title: "We're searching all our suppliers for this hotel.",
      body: "This property isn't in our instant search — our team is checking across all supplier networks. This can take up to 2 hours. We'll notify you on WhatsApp as soon as we find it.",
    },

    WRONG_FILE_TYPE: {
      type: 'error',
      badge: 'Unsupported format',
      icon: '📎',
      title: "We can't read that file type.",
      body: "Please upload your voucher as a PDF, JPG, or PNG. Screenshots work well — just make sure the text is clear and the full voucher is visible.",
    },

    FILE_TOO_LARGE: {
      type: 'error',
      badge: 'File too large',
      icon: '📦',
      title: 'Your file is too large to upload.',
      body: "Please upload a file under 10MB. If your PDF is large, try taking a screenshot of the confirmation email instead.",
    },
  },

  STATUS: {

    MONITORING_ACTIVE: {
      type: 'success',
      badge: 'Active',
      icon: '👁️',
      title: "We're watching this booking.",
      body: "Rate monitoring is active. We check live hotel prices every 6 hours and will WhatsApp you the moment we find a lower rate.",
    },

    PRICE_DROP_FOUND: {
      type: 'success',
      badge: 'Price drop!',
      icon: '🎉',
      title: 'We found a lower price on your hotel!',
      body: "We've sent you a WhatsApp with the hotel page link. Open it, select your room and board preference, cancel your existing booking, and rebook at the lower rate.",
      sub: '⚡ This rate may not last — act quickly.',
    },

    WHATSAPP_SENT: {
      type: 'warning',
      badge: 'WhatsApp sent',
      icon: '📱',
      title: "We've sent you a WhatsApp.",
      body: "We found a lower rate and sent you a WhatsApp with the hotel page link. Check your messages, select your room, cancel your original booking and rebook to save.",
      sub: "Didn't receive it? Tap below to view the hotel page directly.",
    },

    NO_DROP_YET: {
      type: 'info',
      badge: 'Monitoring',
      icon: '⏳',
      title: 'No lower price found yet.',
      body: "We're still watching — drops often happen closer to check-in.",
    },

    CANCELLATION_TODAY: {
      type: 'warning',
      badge: 'Urgent',
      icon: '⏰',
      title: 'Your free cancellation window closes today.',
      body: "Your cancellation deadline expires today. Our team will reach out to you personally within the hour to review your options and help you secure the best available rate before it's too late.",
      sub: "Keep your phone handy — we'll be in touch shortly.",
    },

    PAUSED: {
      type: 'neutral',
      badge: 'Paused',
      icon: '⏸️',
      title: 'Monitoring paused.',
      body: "Rate monitoring for this booking has been paused at your request. We won't check for lower prices until you resume.",
    },

    COMPLETE_WITH_SAVING: {
      type: 'success',
      badge: 'Complete',
      icon: '🎊',
      title: 'Monitoring complete. We found you a saving!',
      body: 'Your check-in date has arrived. We monitored rates and sent you a price drop alert during your monitoring period.',
    },

    COMPLETE_NO_SAVING: {
      type: 'neutral',
      badge: 'Complete',
      icon: '✓',
      title: 'Monitoring complete.',
      body: "Your check-in date has arrived. We monitored rates but weren't able to find a lower price this time. Have a great stay!",
    },

    CANCELLED: {
      type: 'neutral',
      badge: 'Cancelled',
      icon: '✕',
      title: 'Monitoring stopped.',
      body: "This booking has been cancelled and we've stopped tracking it. If you have a new booking, upload it and we'll start watching straight away.",
    },
  },

  DIRECT: {

    MEMBER_RATE_AVAILABLE: {
      type: 'success',
      badge: 'Member rate',
      icon: '🔒',
      title: 'Member rate available.',
      body: "As a rebuq member you have access to this exclusive rate, not available on any public booking site.",
    },

    NO_MEMBER_SAVING: {
      type: 'neutral',
      badge: 'Best available',
      icon: 'ℹ️',
      title: 'No member saving available for these dates.',
      body: "Our member rate for this hotel on these dates matches the best public rate. We've shown you the lowest available price regardless.",
    },

    BOOKING_CONFIRMED: {
      type: 'success',
      badge: 'Confirmed',
      icon: '✅',
      title: 'Booking confirmed!',
      body: "Your hotel booking is confirmed at your member rate. A confirmation has been sent to your email and WhatsApp. We'll continue monitoring in case the rate drops further.",
    },

    PAYMENT_FAILED: {
      type: 'error',
      badge: 'Payment failed',
      icon: '💳',
      title: 'Payment unsuccessful.',
      body: "Your booking could not be completed due to a payment error. Your card has not been charged. Please try again or use a different payment method.",
      sub: "If the problem persists, contact your bank or reach out to our support team.",
    },

    ROOM_SOLD_OUT: {
      type: 'error',
      badge: 'Sold out',
      icon: '🚫',
      title: 'This room is no longer available.',
      body: "The room you selected has just sold out. This can happen when multiple customers are booking simultaneously. Please select a different room type or check back later.",
    },
  },

  SYSTEM: {

    GENERIC_ERROR: {
      type: 'error',
      badge: 'Error',
      icon: '⚡',
      title: 'Something went wrong.',
      body: "We hit an unexpected error. Please try again in a moment. If the problem continues, contact us at help@rebuq.com.",
    },

    SESSION_EXPIRED: {
      type: 'warning',
      badge: 'Session expired',
      icon: '🔒',
      title: 'Your session has expired.',
      body: "For your security, we've logged you out after a period of inactivity. Please log in again to continue.",
    },

    OFFLINE: {
      type: 'warning',
      badge: 'Offline',
      icon: '📡',
      title: 'No internet connection.',
      body: "Please check your connection and try again. Your booking details have been saved and won't be lost.",
    },

    API_FAILED: {
      type: 'warning',
      badge: 'Temporary issue',
      icon: '⚙️',
      title: "We're having trouble reaching our hotel suppliers.",
      body: "Our pricing search is temporarily unavailable. We'll retry automatically in a few minutes. Your booking is safe and monitoring will continue.",
    },

    WHATSAPP_FAILED: {
      type: 'warning',
      badge: 'WhatsApp failed',
      icon: '📱',
      title: "We couldn't deliver your WhatsApp alert.",
      body: "The WhatsApp message we sent didn't go through. Please check your number is correct, or view the price drop details directly.",
    },
  },

  FIELD_ERRORS: {
    HOTEL_NAME:           'Please enter the hotel name.',
    CITY:                 'Please enter the destination city.',
    CHECKIN_REQUIRED:     'Please enter a valid check-in date.',
    CHECKIN_PAST:         'Check-in date cannot be in the past.',
    CHECKOUT:             'Check-out must be after check-in date.',
    ROOM_TYPE:            'Please select or enter your room type.',
    ADULTS:               'Please enter the number of adults (minimum 1).',
    CHILDREN_AGES:        'Please enter the age of each child.',
    AMOUNT_REQUIRED:      'Please enter the amount you paid.',
    AMOUNT_INVALID:       'Please enter a valid amount (numbers only).',
    CURRENCY:             'Please select the currency.',
    CANCEL_POLICY:        'Please select your cancellation policy type.',
    CANCEL_DEADLINE:      'Please enter the last date to cancel for free.',
    CANCEL_DEADLINE_DATE: 'Cancellation deadline must be before your check-in date.',
    WHATSAPP:             'Please enter a valid WhatsApp number with country code.',
    EMAIL:                'Please enter a valid email address.',
  },
}
