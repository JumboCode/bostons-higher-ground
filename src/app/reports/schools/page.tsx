import DashboardTop from '@/components/DashboardTop';
import SchoolFilterBar from '@/components/SchoolFilterBar';

export default function SchoolsPage() {
  return (
    <div className="min-h-screen">
      
      {}
      <DashboardTop pageTitle="Schools Dashboard" />
      
      {}
      <SchoolFilterBar /> 
      
      {}
      <div className="p-8 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Filtered Data Views</h2>
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Charts based on selected filters will go here.</p>

        </div>
      </div>
    </div>
  );
}