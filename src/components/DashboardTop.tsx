

import React from 'react';

interface DashboardTopProps {
  pageTitle: string;
}

const DashboardTop: React.FC<DashboardTopProps> = ({ pageTitle }) => {
  return (
    <div className="w-full flex flex-col p-8">
      
      {}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">{pageTitle}</h1>
        
        {}
        <button className="flex items-center space-x-2 border border-pink-400 text-pink-500 py-2 px-4 rounded-lg transition-colors hover:bg-pink-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">...</svg>
          <span className="text-lg">Update Data</span>
        </button>
      
      </div>

    </div>
  );
};

export default DashboardTop;