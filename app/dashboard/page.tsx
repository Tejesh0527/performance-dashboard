// Server Component — generates initial dataset and passes it to the client shell
import { generateDataset } from '@/lib/dataGenerator';
import type { DataPoint } from '@/lib/types';
import DataProvider from '@/components/providers/DataProvider';
import DashboardClient from '@/components/Dashboard';

// Generate ~10,000 points (1,700 per series × 6 series)
async function getInitialData(): Promise<DataPoint[]> {
  return generateDataset(1700);
}

export default async function DashboardPage() {
  const initialData = await getInitialData();

  return (
    <DataProvider initialData={initialData}>
      <DashboardClient />
    </DataProvider>
  );
}
