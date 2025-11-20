
import React, { useState, useMemo, useRef } from 'react';
import { BusinessLine, SocialPost } from '../types';
import { useKanban } from '../hooks/useKanban';

interface SocialMediaTabProps {
    businessLine: BusinessLine;
    kanbanApi: ReturnType<typeof useKanban>;
}

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.22 5.22a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm3.22 4.78a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zm7.56-9.56a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 01-1.06 0zM17 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0117 10zm-3.22 4.78a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM10 17a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0110 17z" clipRule="evenodd" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


const SocialMediaTab: React.FC<SocialMediaTabProps> = ({ businessLine, kanbanApi }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);

    // --- Auto Generate Chat State ---
    const [chatInput, setChatInput] = useState('');
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    // --- Single Post Modal State ---
    const [dayPostChannel, setDayPostChannel] = useState('Instagram');
    const [dayPostContent, setDayPostContent] = useState(''); // Caption
    const [dayPostPrompt, setDayPostPrompt] = useState(''); // User Prompt
    const [dayPostVisualPrompt, setDayPostVisualPrompt] = useState(''); // Generated Visual Prompt
    const [dayPostImage, setDayPostImage] = useState<string | null>(null);
    const [dayPostVideo, setDayPostVideo] = useState<string | null>(null);
    
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    // --- Context State (File/Link) ---
    const [contextFile, setContextFile] = useState<string | null>(null);
    const [contextFileName, setContextFileName] = useState<string | null>(null);
    const [contextMimeType, setContextMimeType] = useState<string | null>(null);
    const [contextLink, setContextLink] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const posts = kanbanApi.socialPosts.filter(p => p.businessLineId === businessLine.id);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const days = Array.from({ length: firstDayOfMonth }, (_, i) => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    const channels = ['Instagram', 'LinkedIn', 'TikTok', 'X', 'Facebook', 'YouTube', 'WhatsApp'];

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDay(date);
        
        const dateStr = date.toISOString().split('T')[0];
        const existingPost = posts.find(p => p.date === dateStr);
        
        setDayPostContent(existingPost?.content || '');
        setDayPostVisualPrompt(existingPost?.imagePrompt || '');
        setDayPostImage(existingPost?.imageUrl || null);
        setDayPostVideo(existingPost?.videoUrl || null);
        setDayPostChannel(existingPost?.channel || 'Instagram');
        setDayPostPrompt('');
        resetContext();
        setIsDayModalOpen(true);
    };

    const resetContext = () => {
        setContextFile(null);
        setContextFileName(null);
        setContextMimeType(null);
        setContextLink('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            setContextFile(base64Data);
            setContextFileName(file.name);
            setContextMimeType(file.type);
        };
        reader.readAsDataURL(file);
    };

    // --- Chat-to-Calendar Logic ---
    const handleAutoGenerateChat = async () => {
        if (!chatInput) return;
        setIsGeneratingPlan(true);
        
        // Call the new Chat-to-Calendar hook
        const plan = await kanbanApi.generateSocialCalendarFromChat(
            businessLine, 
            chatInput
        );
        
        // Direct Save
        plan.forEach(item => {
            kanbanApi.addSocialPost({
                businessLineId: businessLine.id,
                date: item.date,
                content: item.content,
                type: item.type as any,
                status: 'Scheduled',
                imagePrompt: item.imagePrompt,
                channel: item.channel,
                cta: item.cta,
                engagementHook: item.engagementHook
            });
        });

        setIsGeneratingPlan(false);
        setIsAutoGenerateOpen(false);
        setChatInput('');
    };


    // --- Single Post Logic ---
    const handleGenerateDetails = async () => {
        if (!dayPostPrompt) return;
        setIsGeneratingContent(true);
        
        const result = await kanbanApi.generateSocialPostDetails(
            dayPostPrompt,
            dayPostChannel,
            businessLine,
            contextFile || undefined,
            contextMimeType || undefined,
            contextLink
        );
        
        setDayPostContent(result.caption);
        setDayPostVisualPrompt(result.visualPrompt);
        setIsGeneratingContent(false);
    };

    const handleGenerateDayImage = async () => {
        if (!dayPostVisualPrompt) return;
        setIsGeneratingImage(true);
        const image = await kanbanApi.generateSocialImage(dayPostVisualPrompt);
        if (image) setDayPostImage(image);
        else alert("Failed to generate image. Please try again.");
        setIsGeneratingImage(false);
    };

    const handleGenerateDayVideo = async () => {
        if (!dayPostVisualPrompt) return;
        setIsGeneratingVideo(true);
        const videoUrl = await kanbanApi.generateSocialVideo(dayPostVisualPrompt);
        if (videoUrl) setDayPostVideo(videoUrl);
        else alert("Failed to generate video. It might take a moment, please retry.");
        setIsGeneratingVideo(false);
    }

    const handleSaveDayPost = () => {
        if (!selectedDay) return;
        const dateStr = selectedDay.toISOString().split('T')[0];
        const existingPost = posts.find(p => p.date === dateStr);
        const postData = {
            content: dayPostContent, 
            imageUrl: dayPostImage || undefined,
            videoUrl: dayPostVideo || undefined,
            imagePrompt: dayPostVisualPrompt,
            channel: dayPostChannel
        };

        if (existingPost) {
            kanbanApi.updateSocialPost(existingPost.id, postData);
        } else {
            kanbanApi.addSocialPost({
                businessLineId: businessLine.id,
                date: dateStr,
                type: 'Post',
                status: 'Scheduled',
                ...postData
            });
        }

        kanbanApi.addTask({
            title: `Publish ${dayPostChannel} Post`,
            description: `Caption: ${dayPostContent}\n\nScheduled for: ${selectedDay.toLocaleDateString()}`,
            businessLineId: businessLine.id,
            dueDate: selectedDay.toISOString(),
            priority: 'High'
        });

        setIsDayModalOpen(false);
    };

    const handleDownloadImage = () => {
        if (!dayPostImage) return;
        const link = document.createElement('a');
        link.href = dayPostImage;
        link.download = `social-post-${selectedDay?.toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-brevo-text-primary">Social Media Calendar</h3>
                <button 
                    onClick={() => { resetContext(); setIsAutoGenerateOpen(true); }}
                    className="flex items-center bg-brevo-cta hover:bg-brevo-cta-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    <SparklesIcon /> Create Calendar
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-brevo-border">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeftIcon/></button>
                    <h4 className="text-lg font-semibold text-brevo-text-primary">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRightIcon/></button>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-2 text-center font-semibold text-gray-500 text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-4">
                    {days.map((day, idx) => {
                        if (!day) return <div key={idx} className="h-32 bg-gray-50 rounded-lg opacity-50"></div>;
                        
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateStr = date.toISOString().split('T')[0];
                        const post = posts.find(p => p.date === dateStr);

                        return (
                            <div 
                                key={idx} 
                                onClick={() => handleDayClick(day)}
                                className={`h-32 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md flex flex-col ${post ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span className={`text-sm font-semibold ${post ? 'text-blue-800' : 'text-gray-700'}`}>{day}</span>
                                {post && (
                                    <div className="mt-2 flex-1 overflow-hidden">
                                        {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full h-10 object-cover rounded mb-1" />}
                                        {post.videoUrl && <div className="w-full h-10 bg-black rounded mb-1 flex items-center justify-center text-white"><VideoIcon/></div>}
                                        <p className="text-xs text-blue-900 line-clamp-2">{post.content}</p>
                                        <span className="text-[10px] bg-blue-200 text-blue-800 px-1 rounded">{post.channel}</span>
                                    </div>
                                )}
                                {!post && <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100"><span className="text-2xl text-gray-300">+</span></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Auto Generate Modal - Chat with Walter (Gemini Intelligence) */}
            {isAutoGenerateOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsAutoGenerateOpen(false)}>
                     <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-brevo-border flex flex-col" onClick={e => e.stopPropagation()}>
                         <div className="p-6 border-b border-gray-100">
                             <h2 className="text-xl font-semibold text-brevo-text-primary flex items-center">
                                 <SparklesIcon /> Talk to Walter (Campaign Engine)
                             </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-sm text-gray-600">
                                Tell Walter about your campaign goals in plain English. He will infer the best channels, duration, and audience, and generate a full content calendar for you.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Campaign Brief</label>
                                <textarea 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-4 h-40 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-base"
                                    placeholder="e.g., I want to launch a 2-week campaign for our new 'Endabug' spray. Target homeowners in Kilimani who hate mosquitoes. The goal is to drive website traffic..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl bg-gray-50">
                            <button onClick={() => setIsAutoGenerateOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                            <button onClick={handleAutoGenerateChat} disabled={isGeneratingPlan || !chatInput} className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-lg font-medium disabled:opacity-70 transition-colors flex items-center">
                                {isGeneratingPlan ? <><span className="animate-spin mr-2">⏳</span> Strategizing...</> : <><SparklesIcon /> Generate Campaign</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Day Post Modal */}
            {isDayModalOpen && selectedDay && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setIsDayModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-brevo-border max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-xl flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">
                                Post for {selectedDay.toLocaleDateString()}
                            </h2>
                             <button onClick={() => kanbanApi.addTask({ title: `Post Task for ${selectedDay.toLocaleDateString()}`, dueDate: selectedDay.toISOString(), businessLineId: businessLine.id })} className="text-sm font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center">
                                <PlusIcon /> Add Task
                            </button>
                        </div>
                        
                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                             {/* Channel */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Channel</label>
                                <select value={dayPostChannel} onChange={(e) => setDayPostChannel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    {channels.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Generation Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">What do you want to create?</label>
                                <textarea 
                                    value={dayPostPrompt}
                                    onChange={(e) => setDayPostPrompt(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 h-24 text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                                />
                                 <div className="flex gap-3">
                                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                                        <PaperClipIcon />
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                        <span className="ml-2 text-sm text-gray-500 truncate">{contextFileName || "Attach File"}</span>
                                    </div>
                                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg p-2 bg-white">
                                        <LinkIcon />
                                        <input type="text" value={contextLink} onChange={e => setContextLink(e.target.value)} placeholder="Add Link..." className="w-full ml-2 outline-none text-sm" />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleGenerateDetails}
                                    disabled={isGeneratingContent || !dayPostPrompt}
                                    className="w-full mt-4 bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    {isGeneratingContent ? 'Generating...' : 'Generate Content'}
                                </button>
                            </div>

                            {/* Content Results */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Caption</label>
                                <textarea 
                                    value={dayPostContent}
                                    onChange={(e) => setDayPostContent(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 h-32 bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">Visual Prompt</label>
                                <textarea 
                                    value={dayPostVisualPrompt}
                                    onChange={(e) => setDayPostVisualPrompt(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 h-20 bg-white text-gray-900 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Visual Preview */}
                            <div className="border-2 border-dashed border-blue-100 bg-blue-50 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                    <span className="text-sm font-semibold text-gray-700">Visual Preview</span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleGenerateDayImage}
                                            disabled={isGeneratingImage || !dayPostVisualPrompt}
                                            className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-200 flex items-center transition-colors"
                                        >
                                            {isGeneratingImage ? '...' : <><SparklesIcon /> Nano Banana (Image)</>}
                                        </button>
                                        <button 
                                            onClick={handleGenerateDayVideo}
                                            disabled={isGeneratingVideo || !dayPostVisualPrompt}
                                            className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-200 flex items-center transition-colors"
                                        >
                                            {isGeneratingVideo ? '...' : <><VideoIcon /> Veo 3 (Video)</>}
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full h-48 bg-white rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                                    {dayPostImage ? (
                                         <>
                                            <img src={dayPostImage} alt="Generated" className="max-w-full max-h-full object-contain" />
                                            <div className="absolute bottom-2 right-2 flex space-x-2">
                                                <button onClick={handleDownloadImage} className="p-1.5 bg-white rounded-md shadow text-gray-600 hover:text-black" title="Download"><DownloadIcon /></button>
                                                <button onClick={handleGenerateDayImage} className="p-1.5 bg-white rounded-md shadow text-gray-600 hover:text-black" title="Retry"><RefreshIcon /></button>
                                            </div>
                                        </>
                                    ) : dayPostVideo ? (
                                        <div className="w-full h-full flex items-center justify-center bg-black text-white">
                                            {/* Placeholder for video player - in real app use <video> */}
                                            <p className="text-xs p-2">Video Generated (Preview not available in demo). URL: {dayPostVideo.substring(0, 20)}...</p>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm font-medium">No visual generated</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
                            <button onClick={() => setIsDayModalOpen(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSaveDayPost} className="bg-gray-900 text-white px-8 py-2 font-bold rounded-lg hover:bg-black transition-colors shadow-lg">Save Post</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialMediaTab;
