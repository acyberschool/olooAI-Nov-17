
import React from 'react';

const IntegrationCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  isConnected?: boolean;
}> = ({ icon, title, description, isConnected }) => (
  <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex items-center w-full">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 mr-4">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-brevo-text-primary">{title}</h4>
        <p className="text-sm text-brevo-text-secondary">{description}</p>
      </div>
    </div>
    <button
      className={`py-2 px-4 rounded-lg font-semibold text-sm transition-colors w-full sm:w-auto flex-shrink-0 ${
        isConnected
          ? 'bg-gray-200 text-brevo-text-secondary hover:bg-red-100 hover:text-red-700'
          : 'bg-brevo-cta hover:bg-brevo-cta-hover text-white'
      }`}
    >
      {isConnected ? 'Disconnect' : 'Connect'}
    </button>
  </div>
);

const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const TelegramIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.84c-.15.66-1.16 5.2-1.32 5.86-.14.58-.45.7-.72.72-.27.02-.55-.17-.85-.38-.4-.25-2.22-1.45-3.03-2.23-.2-.18-.4-.36-.6-.54-.2-.17-.35-.3-.15-.54.2-.23.4-.4.6-.6s.4-.4.6-.6c.2-.2.38-.38.56-.55.18-.18.36-.36.54-.54.18-.18.33-.33.2-.6-.13-.26-.26-.13-.38-.02-.13.12-.25.22-.38.33-.12.1-.24.2-.36.3l-.85.75c-.2.2-.4.4-.6.6s-.4.4-.6.6c-.2.2-.4.4-.6.55-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.2.18-.4.36-.6.54-.7.6-1.3 1-1.8 1.2-.5.2-1 .1-1.3-.2-.3-.3-.4-.7-.4-1.2 0-.5.2-1 .4-1.5s.4-1 .6-1.5c.2-.5.4-1 .6-1.5l.6-1.5c.2-.5.4-1 .6-1.5s.4-1 .6-1.5c.2-.5.4-1 .6-1.5l.6-1.5c.2-.5.4-1 .6-1.5s.4-1 .6-1.5c.2-.5.4-1 .6-1.5.02-.02.04-.04.06-.06.4-.9 1-1.6 1.8-2.2.8-.6 1.7-.9 2.7-.9.5 0 1 .1 1.4.3.4.2.7.5.9.9.2.4.3.9.2 1.4z"/></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DriveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7.7121 21.4398L15.4242 9.01469L22.9999 13.2503L15.2878 21.4398H7.7121Z" fill="#34A853"/><path d="M4.00006 7.06018L11.7122 7.06018L15.4243 1L1 13.2503L4.00006 7.06018Z" fill="#FFC107"/><path d="M15.4243 9.0149L23 13.2505L19.2879 19.4398L11.7122 7.06041L15.4243 9.0149Z" fill="#EA4335"/><path d="M22.9999 13.2503L15.4242 1L8.80304 13.2503L15.2878 21.4398L22.9999 13.2503Z" fill="#4285F4"/></svg>;
const ZoomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brevo-text-secondary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm5 0h-2V8h2v8z" /></svg>;


const SettingsView: React.FC = () => {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-brevo-text-primary mb-6">Settings & Integrations</h2>

            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">Channel Integrations</h3>
                    <div className="space-y-4">
                        <IntegrationCard 
                            icon={<EmailIcon />}
                            title="Email"
                            description="Forward emails to Walter to automatically create notes and tasks."
                        />
                         <IntegrationCard 
                            icon={<TelegramIcon />}
                            title="Telegram"
                            description="Send messages to the olooAI bot to manage your work on the go."
                        />
                         <IntegrationCard 
                            icon={<CalendarIcon />}
                            title="Calendar"
                            description="Sync your meetings and deadlines with your Google or Outlook Calendar."
                        />
                    </div>
                </div>

                 <div>
                    <h3 className="text-lg font-semibold text-brevo-text-primary mb-4">App Integrations</h3>
                    <div className="space-y-4">
                        <IntegrationCard 
                            icon={<DriveIcon />}
                            title="Google Drive"
                            description="Allow Walter to save generated documents directly to your Drive."
                            isConnected
                        />
                         <IntegrationCard 
                            icon={<ZoomIcon />}
                            title="Zoom"
                            description="Automatically get transcripts and summaries of your recorded meetings."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;