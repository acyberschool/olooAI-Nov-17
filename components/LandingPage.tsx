
import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111] font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#F9F9F9]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
           <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
           <span className="text-xl font-bold tracking-tight">olooAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onGetStarted} className="text-sm font-medium hover:opacity-70 transition-opacity">Log in</button>
          <button onClick={onGetStarted} className="bg-[#B4F573] text-[#1A2E05] px-5 py-2 rounded-full text-sm font-bold hover:bg-[#A3E662] transition-colors">
            Try Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center max-w-6xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-serif font-medium leading-[0.9] tracking-tight mb-12">
          the AI tool <br />
          that sparks <span className="italic font-light">productivity</span>
        </h1>
        
        {/* Floating Elements Visual */}
        <div className="relative h-64 md:h-96 w-full max-w-4xl mx-auto mb-12 select-none pointer-events-none">
            {/* Center Piece */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-64 z-10 animate-float-slow">
                <p className="text-sm text-gray-500 mb-2">Task</p>
                <p className="font-serif text-xl">"Create a marketing plan"</p>
            </div>

            {/* Floating Cards */}
            <div className="absolute top-0 left-10 md:left-1/4 bg-[#E0F2FE] p-4 rounded-xl shadow-sm w-48 rotate-[-6deg] animate-float-medium delay-100">
                <p className="text-xs text-blue-800 font-bold uppercase">CRM</p>
                <p className="font-medium text-blue-900 mt-1">Call with Sarah logged.</p>
            </div>

            <div className="absolute bottom-0 right-10 md:right-1/4 bg-[#DCFCE7] p-4 rounded-xl shadow-sm w-52 rotate-[4deg] animate-float-fast delay-200">
                <p className="text-xs text-green-800 font-bold uppercase">Success</p>
                <p className="font-medium text-green-900 mt-1">Deal closed for $50k.</p>
            </div>

            <div className="absolute top-10 right-0 hidden md:block bg-[#FAE8FF] p-3 rounded-lg shadow-sm w-40 rotate-[2deg]">
                <p className="text-xs text-purple-800">Social Media</p>
                <p className="text-sm mt-1">Campaign generated.</p>
            </div>
             <div className="absolute bottom-10 left-0 hidden md:block bg-[#FFF7ED] p-3 rounded-lg shadow-sm w-40 rotate-[-3deg]">
                <p className="text-xs text-orange-800">Documents</p>
                <p className="text-sm mt-1">Proposal drafted.</p>
            </div>
        </div>

        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10">
          save one thing<br/>
          automate a hundred more
        </p>

        <button onClick={onGetStarted} className="bg-[#111] text-white text-lg px-8 py-4 rounded-full hover:bg-black transition-transform hover:scale-105 shadow-lg">
          Get Started
        </button>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale">
                <div className="flex items-center justify-center font-serif text-2xl font-bold">ACME</div>
                <div className="flex items-center justify-center font-sans text-xl font-bold tracking-widest">CORP</div>
                <div className="flex items-center justify-center font-serif text-2xl italic">Globex</div>
                <div className="flex items-center justify-center font-mono text-lg">Soylent</div>
            </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-32 px-6 bg-[#F9F9F9]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <div>
                <h2 className="text-4xl md:text-5xl font-serif mb-6">create with what you say</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                    Go from a voice note to a fully structured project plan. Walter listens, understands context, and builds out your CRM, tasks, and documents instantly.
                </p>
                <button onClick={onGetStarted} className="text-[#111] font-bold border-b-2 border-[#B4F573] hover:bg-[#B4F573] transition-colors">
                    Try the magic &rarr;
                </button>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">🎤</div>
                        <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 w-full">
                            <p className="text-gray-800">"Create a project for the new Nike campaign."</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 justify-end">
                        <div className="bg-[#B4F573] p-4 rounded-2xl rounded-tr-none w-full shadow-sm">
                            <p className="text-[#1A2E05] font-medium">Project Created: Nike Campaign</p>
                            <ul className="mt-2 text-sm text-[#2F4F09] list-disc list-inside">
                                <li>Task: Kickoff meeting</li>
                                <li>Doc: Brief Template</li>
                                <li>CRM: Deal Stage Updated</li>
                            </ul>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#1A2E05] flex items-center justify-center text-white">W</div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-gray-400 text-sm bg-white border-t border-gray-100">
        <p>© 2025 olooAI. Inspired by the future of work.</p>
      </footer>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-15px) rotate(-6deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(4deg); }
          50% { transform: translateY(-8px) rotate(4deg); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default LandingPage;
