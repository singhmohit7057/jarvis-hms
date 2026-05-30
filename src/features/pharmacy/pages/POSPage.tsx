// #must: POS Billing screen with split layout — medicine search left, cart right
import { PageHeader } from '@/components/layout/PageHeader';
import { POSProductSearch } from '../components/POSProductSearch';
import { POSCart } from '../components/POSCart';

export function POSPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <PageHeader
        title="Point of Sale"
        subtitle="Search medicines and create bills"
      />

      {/* Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel — Medicine Search (60%) */}
        <div className="flex-[3] min-w-0 flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <POSProductSearch />
        </div>

        {/* Right Panel — Cart (40%) */}
        <div className="flex-[2] min-w-0 flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <POSCart />
        </div>
      </div>
    </div>
  );
}
