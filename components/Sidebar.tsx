
import React from 'react';
import { View } from '../App';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
  icon: React.ReactElement<{ className?: string }>;
}> = ({ label, view, activeView, onClick, icon }) => {
  const isActive = activeView === view;
  return (
    <li
      onClick={() => onClick(view)}
      className={`flex items-center p-3 rounded-full cursor-pointer transition-colors duration-200 relative ${
        isActive
          ? 'bg-brevo-mint-active text-brevo-text-primary'
          : 'text-brevo-text-secondary hover:bg-gray-100'
      }`}
    >
      {React.cloneElement(icon, { className: 'h-6 w-6 flex-shrink-0'})}
      <span className="ml-3 font-medium">{label}</span>
    </li>
  );
};

const HomeIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const BusinessIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3.75h1.5m-1.5 3.75h1.5m3-3.75h1.5m-1.5 3.75h1.5m-1.5 3.75h1.5M9 3.75h1.5m3 0h1.5" /></svg>;
const ClientsIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903c.128.02.257.04.386.06m-7.512-2.72a3 3 0 00-4.682-2.72 9.094 9.094 0 003.741.479m9.873-1.534a9.094 9.094 0 00-3.741-.479m-9.873 1.534a9.094 9.094 0 01-3.741-.479m14.513 1.534c.128.02.257.04.386.06m-4.682-2.72a3 3 0 014.682-2.72" /></svg>;
const DealsIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const CRMIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>;
const TeamIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903a9.094 9.094 0 01-3.741-.479M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const ChartBarIcon: React.FC<React.ComponentProps<'svg'>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  return (
    <>
        {/* Mobile menu overlay */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>

        {/* Sidebar */}
        <nav className={`fixed top-0 left-0 h-full w-64 bg-white p-4 border-r border-brevo-border flex flex-col z-40 transform transition-transform lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-brevo-cta">olooAI</h2>
        </div>
        <ul className="space-y-1">
            <NavItem label="Homepage" view="homepage" activeView={activeView} onClick={setActiveView} icon={<HomeIcon />} />
            <NavItem label="CRM" view="crm" activeView={activeView} onClick={setActiveView} icon={<CRMIcon />} />
            <NavItem label="Business Lines" view="businessLines" activeView={activeView} onClick={setActiveView} icon={<BusinessIcon />}/>
            <NavItem label="Clients" view="clients" activeView={activeView} onClick={setActiveView} icon={<ClientsIcon />} />
            <NavItem label="Deals" view="deals" activeView={activeView} onClick={setActiveView} icon={<DealsIcon />} />
        </ul>
        <div className="mt-auto">
            <ul className="space-y-1 pt-4 border-t border-brevo-border">
                <NavItem label="Team & Access" view="team" activeView={activeView} onClick={setActiveView} icon={<TeamIcon />} />
                <NavItem label="Data & Insights" view="data" activeView={activeView} onClick={setActiveView} icon={<ChartBarIcon />} />
            </ul>
            <div className="mt-8 text-center text-brevo-text-secondary text-xs">
                <p>Powered by Gemini</p>
            </div>
        </div>
        </nav>
    </>
  );
};

export default Sidebar;
