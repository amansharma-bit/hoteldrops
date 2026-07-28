// This page previously fetched from grn_rebookings / grn_monthly_summary /
// grn_refundable_summary (Mize Excel dump tables). Those have been retired.
// ReportsClient now fetches directly from the live dashboard endpoint.
import ReportsClient from './ReportsClient';

export const revalidate = 0;

export default function ReportsPage() {
  return <ReportsClient />;
}
