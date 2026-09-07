import type { Metadata } from 'next';
import ManagementDashboard from '@/components/management/ManagementDashboard';

export const metadata: Metadata = {
  title: 'Management',
  description: 'Operational overview for management accounts.',
  // Never index a gated area, even though the server would refuse the data.
  robots: { index: false, follow: false },
};

export default function ManagementPage() {
  return <ManagementDashboard />;
}
