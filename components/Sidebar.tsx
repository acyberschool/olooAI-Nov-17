
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
const ClientsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903c.128.02.257.04.386.06m-7.512-2.72a3 3 0 00-4.682-2.72 9.094 9.094 0 003.741.479m9.873-1.534a9.094 9.094 0 00-3.741-.479m-9.873 1.534a9.094 9.094 0 01-3.741-.479m14.513 1.534c.128.02.257.04.386.06m-4.682-2.72a3 3 0 014.682-2.72" /></svg>;
const SalesIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EventsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const HRIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const TeamIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903a9.094 9.094 0 01-3.741-.479M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const SettingsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.55-.22 1.156-.22 1.706 0 .55.219 1.02.684 1.11 1.226l.043.25a1.58 1.58 0 001.086 1.086l.25.043c.542.09 1.007.56 1.226 1.11.22.55.22 1.156 0 1.706-.219.55-.684 1.02-1.226 1.11l-.25.043a1.58 1.58 0 00-1.086 1.086l-.043.25c-.09.542-.56 1.007-1.11 1.226-.55.22-1.156.22-1.706 0-.55-.219-1.02-.684-1.11-1.226l-.043-.25a1.58 1.58 0 00-1.086-1.086l-.25-.043c-.542-.09-1.007-.56-1.226-1.11-.22-.55-.22-1.156 0-1.706.219-.55.684-1.02 1.226-1.11l.25-.043a1.58 1.58 0 001.086-1.086l.043-.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.875a5.125 5.125 0 100 10.25 5.125 5.125 0 000-10.25z" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isSuperAdmin, permissions }) => {
  // Default to all if no perms passed (fallback)
  const hasAccess = (module: string) => {
      if (!permissions) return true;
      return permissions.access.includes(module) || permissions.access.includes('all');
  }

  return (
    <>
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>

        <nav className={`fixed top-0 left-0 h-full w-64 bg-white p-4 border-r border-brevo-border flex flex-col z-40 transform transition-transform lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-brevo-cta">olooAI</h2>
        </div>
        <ul className="space-y-1">
            <NavItem label="Homepage" view="homepage" activeView={activeView} onClick={setActiveView} icon={<HomeIcon />} />
            {hasAccess('clients') && <NavItem label="Clients" view="clients" activeView={activeView} onClick={setActiveView} icon={<ClientsIcon />} />}
            {hasAccess('sales') && <NavItem label="Sales" view="sales" activeView={activeView} onClick={setActiveView} icon={<SalesIcon />} />}
            {hasAccess('events') && <NavItem label="Events" view="events" activeView={activeView} onClick={setActiveView} icon={<EventsIcon />} />}
            {hasAccess('hr') && <NavItem label="HR & Team" view="hr" activeView={activeView} onClick={setActiveView} icon={<HRIcon />} />}
        </ul>
        <div className="mt-auto">
            <ul className="space-y-1 pt-4 border-t border-brevo-border">
                {isSuperAdmin && (
                    <NavItem label="Super Admin" view="admin" activeView={activeView} onClick={setActiveView} icon={<SettingsIcon />} className="text-red-700 hover:bg-red-50" />
                )}
                <NavItem label="Workspace Settings" view="team" activeView={activeView} onClick={setActiveView} icon={<TeamIcon />} />
            </ul>
        </div>
        </nav>
    </>
  );
};

export default Sidebar;
