import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="border-b border-[#E5E7EB]">
      <div className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${
              activeTab === tab
                ? 'border-[#15803D] text-[#15803D]'
                : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-gray-300'
            } flex-shrink-0 whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-medium text-sm sm:text-base transition-colors focus:outline-none`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;