
import React from 'react';
import { View } from '../App';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isSuperAdmin?: boolean;
  permissions?: { access: string[] };
}

const NavItem: React.FC<{
  label: string;
  view: View;
  activeView: View;
  onClick: (view: View) => void;
  icon: React.ReactElement<{ className?: string }>;
  className?: string;
}> = ({ label, view, activeView, onClick, icon, className }) => {
  const isActive = activeView === view;
  return (
    <li
      onClick={() => onClick(view)}
      className={`flex items-center p-3 rounded-full cursor-pointer transition-colors duration-200 relative ${
        isActive
          ? 'bg-brevo-mint-active text-brevo-text-primary'
          : 'text-brevo-text-secondary hover:bg-gray-100'
      } ${className || ''}`}
    >
      {React.cloneElement(icon, { className: 'h-6 w-6 flex-shrink-0'})}
      <span className="ml-3 font-medium">{label}</span>
    </li>
  );
};

// Icons
const HomeIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const BusinessIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>;
const ClientsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903c.128.02.257.04.386.06m-7.512-2.72a3 3 0 00-4.682-2.72 9.094 9.094 0 003.741.479m9.873-1.534a9.094 9.094 0 00-3.741-.479m-9.873 1.534a9.094 9.094 0 01-3.741-.479m14.513 1.534c.128.02.257.04.386.06m-4.682-2.72a3 3 0 014.682-2.72" /></svg>;
const DealsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ProjectsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>;
const CrmIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>;
const SalesIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const EventsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const HRIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const TeamIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903a9.094 9.094 0 01-3.741-.479M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const DataIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>;
const SettingsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.55-.22 1.156-.22 1.706 0 .55.219 1.02.684 1.11 1.226l.043.25a1.58 1.58 0 001.086 1.086l.25.043c.542.09 1.007.56 1.226 1.11.22.55.22 1.156 0 1.706-.219.55-.684 1.02-1.226 1.11l-.25.043a1.58 1.58 0 00-1.086 1.086l-.043.25c-.09.542-.56 1.007-1.11 1.226-.55.22-1.156.22-1.706 0-.55-.219-1.02-.684-1.11-1.226l-.043-.25a1.58 1.58 0 00-1.086-1.086l.25-.043c-.542-.09-1.007-.56-1.226-1.11-.22-.55-.22-1.156 0-1.706.219-.55.684-1.02 1.226-1.11l.25-.043a1.58 1.58 0 001.086-1.086l.043-.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.875a5.125 5.125 0 100 10.25 5.125 5.125 0 000-10.25z" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isSuperAdmin, permissions }) => {
  
  const hasAccess = (module: string) => {
      if (!permissions || !permissions.access) return false;
      if (permissions.access.includes('all')) return true;
      return permissions.access.includes(module);
  };

  return (
    <>
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>

        <nav className={`fixed top-0 left-0 h-full w-64 bg-white p-4 border-r border-brevo-border flex flex-col z-40 transform transition-transform lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-brevo-cta cursor-pointer" onClick={() => setActiveView('homepage')}>olooAI</h2>
        </div>
        <ul className="space-y-1 overflow-y-auto flex-1">
            <NavItem label="Homepage" view="homepage" activeView={activeView} onClick={setActiveView} icon={<HomeIcon />} />
            
            <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Core Workspace</p>
            </div>
            {hasAccess('businessLines') && <NavItem label="Business Lines" view="businessLines" activeView={activeView} onClick={setActiveView} icon={<BusinessIcon />} />}
            {hasAccess('clients') && <NavItem label="Clients" view="clients" activeView={activeView} onClick={setActiveView} icon={<ClientsIcon />} />}
            {hasAccess('deals') && <NavItem label="Deals" view="deals" activeView={activeView} onClick={setActiveView} icon={<DealsIcon />} />}
            {hasAccess('projects') && <NavItem label="Projects" view="projects" activeView={activeView} onClick={setActiveView} icon={<ProjectsIcon />} />}
            {hasAccess('crm') && <NavItem label="CRM" view="crm" activeView={activeView} onClick={setActiveView} icon={<CrmIcon />} />}

            <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Advanced Modules</p>
            </div>
            {hasAccess('sales') && <NavItem label="Sales Pipeline" view="sales" activeView={activeView} onClick={setActiveView} icon={<SalesIcon />} />}
            {hasAccess('events') && <NavItem label="Event Management" view="events" activeView={activeView} onClick={setActiveView} icon={<EventsIcon />} />}
            {hasAccess('hr') && <NavItem label="HR & People" view="hr" activeView={activeView} onClick={setActiveView} icon={<HRIcon />} />}
            
            <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Insights</p>
            </div>
            {hasAccess('data') && <NavItem label="Data & Insights" view="data" activeView={activeView} onClick={setActiveView} icon={<DataIcon />} />}
        </ul>
        <div className="mt-auto">
            <ul className="space-y-1 pt-4 border-t border-brevo-border">
                {isSuperAdmin && (
                    <NavItem label="Super Admin" view="admin" activeView={activeView} onClick={setActiveView} icon={<SettingsIcon />} className="text-red-700 hover:bg-red-50" />
                )}
                {hasAccess('settings') && <NavItem label="Workspace Settings" view="team" activeView={activeView} onClick={setActiveView} icon={<TeamIcon />} />}
            </ul>
        </div>
        </nav>
    </>
  );
};

export default Sidebar;
