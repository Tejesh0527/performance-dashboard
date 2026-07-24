import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | PerfDash',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
