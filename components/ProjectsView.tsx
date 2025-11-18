import React from 'react';
import { Project, Client } from '../types';
import { UniversalInputContext } from '../App';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onSelectProject: (id: string) => void;
  onOpenUniversalInput: (context: UniversalInputContext) => void;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, clients, onSelectProject, onOpenUniversalInput }) => {
  
  const handleAddClick = () => {
    onOpenUniversalInput({ placeholder: 'Create a project with Nation Media Group for an AI workshop series...' });
  };

  const statusChipColor = (status: Project['stage']) => {
    switch (status) {
      case 'Lead': return 'bg-gray-200 text-gray-800';
      case 'In design': return 'bg-yellow-100 text-yellow-800';
      case 'Live': return 'bg-blue-100 text-blue-800';
      case 'Closing': return 'bg-green-100 text-green-800';
      case 'Dormant': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-brevo-text-primary">Projects</h2>
        <button
          onClick={handleAddClick}
          className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon /> Add project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const clientName = clients.find(c => c.id === project.clientId)?.name;
            return (
            <div key={project.id} className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border flex flex-col justify-between hover:border-brevo-cta-hover transition-all cursor-pointer" onClick={() => onSelectProject(project.id)}>
              <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg mb-2 text-brevo-text-primary">{project.projectName}</h3>
                    <span className={`text-xs font-semibold rounded-full px-3 py-1 ${statusChipColor(project.stage)}`}>{project.stage}</span>
                </div>
                {clientName && (
                    <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-medium inline-block mb-3">
                        Client: {clientName}
                    </span>
                )}
                <p className="text-sm text-brevo-text-secondary mb-1"><strong className="text-brevo-text-primary">Partner:</strong> {project.partnerName}</p>
                <p className="text-sm text-brevo-text-secondary mb-4"><strong className="text-brevo-text-primary">Goal:</strong> {project.goal}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-brevo-border">
                 <p className="text-xs text-brevo-text-secondary"><strong className="font-semibold text-brevo-text-primary">Next Action:</strong> {project.nextAction}</p>
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-lg font-medium text-brevo-text-primary mb-2">No projects yet</p>
          <p className="text-brevo-text-secondary mb-4">Track long-term partnerships and projects here.</p>
          <button onClick={handleAddClick} className="text-brevo-cta hover:underline">Create your first project</button>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
