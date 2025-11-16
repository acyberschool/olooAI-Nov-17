import React from 'react';
import { View } from '../App';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
  // Fix: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
}> = ({ label, view, activeView, onClick, icon }) => {
  const isActive = activeView === view;
  return (
    <li
      onClick={() => onClick(view)}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </li>
  );
};

const BoardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2z" />
    </svg>
);
const BusinessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m5-4h1m-1 4h1m-1-4h1m-1-4h1" />
    </svg>
);
const ClientsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const DealsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const CRMIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
)


const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="w-64 bg-gray-800 p-4 border-r border-gray-700 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">CRM Menu</h2>
      </div>
      <ul className="space-y-3">
        <NavItem label="Tasks" view="tasks" activeView={activeView} onClick={setActiveView} icon={<BoardIcon />} />
        <NavItem label="CRM" view="crm" activeView={activeView} onClick={setActiveView} icon={<CRMIcon />} />
        <NavItem label="Business Lines" view="businessLines" activeView={activeView} onClick={setActiveView} icon={<BusinessIcon />}/>
        <NavItem label="Clients" view="clients" activeView={activeView} onClick={setActiveView} icon={<ClientsIcon />} />
        <NavItem label="Deals" view="deals" activeView={activeView} onClick={setActiveView} icon={<DealsIcon />} />
      </ul>
      <div className="mt-auto text-center text-gray-500 text-xs">
          <p>Powered by Gemini</p>
      </div>
    </nav>
  );
};

export default Sidebar;
