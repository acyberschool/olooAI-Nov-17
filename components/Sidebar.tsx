
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
}> = ({ label, view, activeView, onClick, icon }) => {
  const isActive = activeView === view;
  return (
    <li
      onClick={() => onClick(view)}
      className={`flex items-center px-4 py-3 mb-1 rounded-xl cursor-pointer transition-all duration-200 group ${
        isActive
          ? 'bg-[#111827] text-white shadow-md transform scale-[1.02]'
          : 'text-gray-600 hover:bg-gray-100 hover:text-[#111827]'
      }`}
    >
      {React.cloneElement(icon, { className: `h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#111827]'}`})}
      <span className="ml-3 font-medium text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
    </li>
  );
};

// Icons
const HomeIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>;
const TaskIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const BusinessIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const ClientsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.512 2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m7.512 2.72a8.97 8.97 0 01-3.741-.479m3.741.479a8.97 8.97 0 00-3.741-.479m-7.512 2.72a9.094 9.094 0 01-3.741-.479m5.408 1.903c.128.02.257.04.386.06m-7.512-2.72a3 3 0 00-4.682-2.72 9.094 9.094 0 003.741.479m9.873-1.534a9.094 9.094 0 00-3.741-.479m-9.873 1.534a9.094 9.094 0 01-3.741-.479m14.513 1.534c.128.02.257.04.386.06m-4.682-2.72a3 3 0 014.682-2.72" /></svg>;
const DealsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ProjectsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>;
const SalesIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>;
const EventsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const HRIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const SettingsIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.55-.22 1.156-.22 1.706 0 .55.219 1.02.684 1.11 1.226l.043.25a1.58 1.58 0 001.086 1.086l.25.043c.542.09 1.007.56 1.226 1.11.22.55.22 1.156 0 1.706-.219.55-.684 1.02-1.226 1.11l-.25.043a1.58 1.58 0 00-1.086 1.086l-.043.25c-.09.542-.56 1.007-1.11 1.226-.55.22-1.156.22-1.706 0-.55-.219-1.02-.684-1.11-1.226l-.043-.25a1.58 1.58 0 00-1.086-1.086l.25-.043c-.542-.09-1.007-.56-1.226-1.11-.22-.55-.22-1.156 0-1.706.219-.55.684-1.02 1.226-1.11l.25-.043a1.58 1.58 0 001.086-1.086l.043-.25z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.875a5.125 5.125 0 100 10.25 5.125 5.125 0 000-10.25z" /></svg>;
const AccessIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const SocialIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>;
const CRMIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen, isSuperAdmin }) => {
  
  return (
    <>
        {/* Backdrop for Mobile */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>

        {/* Sidebar Drawer */}
        <nav className={`fixed top-0 left-0 h-full w-64 bg-[#F3F4F6] border-r border-brevo-border flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto shadow-xl lg:shadow-none`}>
        
        <div className="p-4 mb-2 flex justify-between items-center border-b border-brevo-border bg-white">
            <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
                olooAI
            </h2>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:bg-gray-200 p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        
        <ul className="space-y-1 flex-1 px-2 py-4">
            {/* 1. Today */}
            <NavItem label="Today" view="today" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<HomeIcon />} />
            
            {/* 2. All tasks */}
            <NavItem label="All tasks" view="allTasks" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<TaskIcon />} />
            
            {/* 3. CRM */}
            <NavItem label="CRM" view="crm" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<CRMIcon />} />

            {/* 4. Business Line */}
            <NavItem label="Business Line" view="businessLines" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<BusinessIcon />} />
            
            {/* 5. Deals */}
            <NavItem label="Deals" view="deals" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<DealsIcon />} />
            
            {/* 6. Clients */}
            <NavItem label="Clients" view="clients" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<ClientsIcon />} />
            
            {/* 7. Projects */}
            <NavItem label="Projects" view="projects" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<ProjectsIcon />} />
            
            {/* 8. Social Media */}
            <NavItem label="Social Media" view="social" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<SocialIcon />} />
            
            {/* 9. Sales */}
            <NavItem label="Sales" view="sales" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<SalesIcon />} />
            
            {/* 10. Events */}
            <NavItem label="Events" view="events" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<EventsIcon />} />
            
            {/* 11. HR */}
            <NavItem label="HR" view="hr" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<HRIcon />} />
            
            <div className="my-2 border-t border-gray-200 mx-2"></div>

            {/* 12. Access */}
            <NavItem label="Access" view="access" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<AccessIcon />} />
            
            {/* 13. Settings */}
            <NavItem label="Settings" view="settings" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<SettingsIcon />} />
        </ul>
        
        <div className="mt-auto px-2 pb-4">
            <ul className="space-y-1 pt-4 border-t border-brevo-border">
                {isSuperAdmin && (
                    <NavItem label="Super Admin" view="admin" activeView={activeView} onClick={(v) => { setActiveView(v); setIsOpen(false); }} icon={<SettingsIcon />} />
                )}
            </ul>
        </div>
        </nav>
    </>
  );
};

export default Sidebar;
