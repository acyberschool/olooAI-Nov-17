import React, { useState } from 'react';

interface WalkthroughProps {
    onComplete: () => void;
}

const steps = [
    {
        title: 'Your Homepage',
        text: "This is your command center. You'll see a snapshot of your performance and all your tasks organised on a Kanban board. You can drag and drop tasks between columns.",
    },
    {
        title: 'Meet Walter, Your AI Assistant',
        text: "This is Walter. Click the microphone whenever you want to create a task, log a conversation, or ask a question about your work.",
    },
    {
        title: 'Create Business Items',
        text: 'This is your main navigation. Create new Business Lines, manage your Clients, and track your Deals from here.',
    },
    {
        title: 'AI-Powered Checklists',
        text: 'When you open a task, Walter automatically creates a checklist for you. Use the action buttons to get help from your AI assistant!',
    },
     {
        title: 'Ready to Go!',
        text: "That's it! You're all set. Remember to just talk to Walter to get things done. Enjoy boosting your productivity!",
    }
];

const Walkthrough: React.FC<WalkthroughProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center">
                <button onClick={onComplete} className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-1 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-brevo-cta mb-4">{step.title}</h2>
                <p className="text-brevo-text-secondary mb-8">{step.text}</p>
                <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                >
                    {currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}
                </button>
                 <div className="mt-6 flex justify-center space-x-2">
                    {steps.map((_, index) => (
                        <div key={index} className={`w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Walkthrough;