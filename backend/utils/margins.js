const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Calculate what price to offer the customer
 * based on admin-defined margin rules
 *
 * Example:
 *   Original: ₹20,000
 *   Supplier: ₹18,000
 *   Saving:   ₹2,000
 *   50% rule: We offer ₹19,000 (customer saves ₹1,000, we earn ₹1,000)
 */
async function calculateOffer({ originalPrice, supplierPrice, bookingId }) {
  const totalSaving = originalPrice - supplierPrice

  // Get applicable margin rule
  const rule = await getApplicableRule(originalPrice)

  let ourMargin, customerSaving, offerPrice

  if (rule.margin_type === 'percentage') {
    // We keep X% of the saving
    ourMargin      = (totalSaving * rule.margin_value) / 100
    customerSaving = totalSaving - ourMargin
    offerPrice     = supplierPrice + ourMargin
  } else {
    // Fixed amount margin
    ourMargin      = Math.min(rule.margin_value, totalSaving * 0.7) // Never take more than 70%
    customerSaving = totalSaving - ourMargin
    offerPrice     = supplierPrice + ourMargin
  }

  // Apply minimum earning floor
  if (rule.min_our_earning && ourMargin < rule.min_our_earning) {
    ourMargin      = rule.min_our_earning
    customerSaving = totalSaving - ourMargin
    offerPrice     = supplierPrice + ourMargin
  }

  // Sanity check — customer must save at least something
  if (customerSaving <= 0) {
    // Give customer at least ₹200 saving
    customerSaving = 200
    ourMargin      = totalSaving - customerSaving
    offerPrice     = originalPrice - customerSaving
  }

  // Round to nearest 50 (cleaner prices)
  offerPrice     = Math.round(offerPrice / 50) * 50
  ourMargin      = offerPrice - supplierPrice
  customerSaving = originalPrice - offerPrice

  return {
    offerPrice:       Math.round(offerPrice),
    customerSaving:   Math.round(customerSaving),
    ourMargin:        Math.round(ourMargin),
    supplierPrice:    Math.round(supplierPrice),
    originalPrice:    Math.round(originalPrice),
    totalSaving:      Math.round(totalSaving),
    marginPercentage: parseFloat(((ourMargin / totalSaving) * 100).toFixed(1)),
    ruleUsed:         rule.rule_name,
  }
}

// Get the best matching margin rule for this booking
async function getApplicableRule(bookingValue) {
  const { data: rules } = await supabase
    .from('margin_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })

  if (!rules?.length) {
    // Fallback — 50/50 split
    return { margin_type: 'percentage', margin_value: 50, rule_name: 'Default' }
  }

  // Find best matching rule (highest priority that matches booking value)
  for (const rule of rules) {
    const matchesMin = !rule.min_booking_value || bookingValue >= rule.min_booking_value
    const matchesMax = !rule.max_booking_value || bookingValue <= rule.max_booking_value
    if (matchesMin && matchesMax) return rule
  }

  // Return lowest priority (default) rule
  return rules[rules.length - 1]
}

// Override margin for a specific booking (admin use)
async function overrideMargin(bookingId, { marginType, marginValue }) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('original_price')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found')

  // Recalculate with custom margin
  const customRule = {
    margin_type:  marginType  || 'percentage',
    margin_value: marginValue || 50,
    rule_name:    'Admin Override',
  }

  return calculateOffer({
    originalPrice: booking.original_price,
    supplierPrice: booking.supplier_price,
    bookingId,
    customRule,
  })
}

module.exports = { calculateOffer, getApplicableRule, overrideMargin }
