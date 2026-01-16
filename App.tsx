import React, { useState, useCallback, useEffect } from 'react';
import DottedGlowBackground from './components/Layout/DottedGlowBackground';
import PromptInput from './components/Input/PromptInput';
import SlideCard from './components/Slide/SlideCard';
import PresentationMode from './components/Presentation/PresentationMode';
import ProjectSidebar from './components/Layout/ProjectSidebar';
import { planPresentation, generateSlide, SlidePlan } from './services/geminiService';
import { exportProjectToJSON } from './services/exportService';
import { Slide, Project } from './types';
import { PlayIcon, DownloadIcon } from './components/UI/Icons';

type GenerationStatus = 'idle' | 'planning' | 'generating' | 'complete';

const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('fs_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error("Failed to load projects from localStorage", e);
    }
    return [];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('fs_active_project') || null;
  });

  // Derived state for current project
  const currentProject = projects.find(p => p.id === activeProjectId) || null;
  const slides = currentProject ? currentProject.slides : [];

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [slidePlan, setSlidePlan] = useState<SlidePlan[]>([]);
  const [presentationSlideId, setPresentationSlideId] = useState<string | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('fs_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('fs_active_project', activeProjectId);
    }
  }, [activeProjectId]);

  // If no projects exist, create one by default
  useEffect(() => {
    if (projects.length === 0) {
        handleCreateProject();
    }
  }, [projects.length]);

  // Ensure an active project is selected if possible
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // --- PROJECT ACTIONS ---
  const handleCreateProject = () => {
    const newProject: Project = {
        id: Date.now().toString(),
        title: `新项目 ${projects.length + 1}`,
        slides: [],
        createdAt: Date.now(),
        lastModified: Date.now()
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("确定要删除这个项目吗？此操作无法撤销。")) {
        const remaining = projects.filter(p => p.id !== id);
        setProjects(remaining);
        if (activeProjectId === id) {
            setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
        }
    }
  };

  const handleImportProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    setActiveProjectId(project.id);
  };

  const updateCurrentProject = (updates: Partial<Project> | ((prev: Project) => Partial<Project>)) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            const newValues = typeof updates === 'function' ? updates(p) : updates;
            return { ...p, ...newValues, lastModified: Date.now() };
        }
        return p;
    }));
  };

  // --- AI GENERATION ---
  const handleGenerate = useCallback(async (script: string) => {
    if (!activeProjectId) return;

    setStatus('planning');
    setSlidePlan([]); 

    // Update project title if it's the first prompt and still default
    if (currentProject && currentProject.slides.length === 0) {
        const suggestedTitle = script.length > 20 ? script.substring(0, 20) + "..." : script;
        updateCurrentProject({ title: suggestedTitle });
    }

    try {
      // Step 1: Plan
      const plan = await planPresentation(script);
      setSlidePlan(plan);
      setStatus('generating');

      // Step 2: Generate
      const promises = plan.map((planItem, index) => 
        generateSlide(script, planItem).then(html => ({ html, index }))
      );
      
      const results = await Promise.all(promises);
      results.sort((a, b) => a.index - b.index);

      const newSlides: Slide[] = results.map((res, index) => ({
        id: Date.now().toString() + index,
        html: res.html,
        prompt: script, 
        variant: 'original',
        timestamp: Date.now() + index,
      }));

      // Add slides to current project
      updateCurrentProject(prev => ({
          slides: [...prev.slides, ...newSlides]
      }));

      setStatus('complete');
    } catch (error) {
      console.error("Failed to generate slides", error);
      alert("生成幻灯片失败，请检查您的 API Key 是否正确配置。");
      setStatus('idle');
    }
  }, [activeProjectId, currentProject]);

  const handleUpdateSlide = (id: string, newHtml: string) => {
    if (!activeProjectId) return;
    
    updateCurrentProject(prev => {
        const slideIndex = prev.slides.findIndex(s => s.id === id);
        if (slideIndex === -1) return { slides: prev.slides };

        const original = prev.slides[slideIndex];
        const newSlide: Slide = {
            ...original,
            id: Date.now().toString(),
            html: newHtml,
            variant: 'remix',
            timestamp: Date.now()
        };
        
        const updatedSlides = [...prev.slides];
        updatedSlides.splice(slideIndex + 1, 0, newSlide); 
        
        return { slides: updatedSlides };
    });
  };
  
  // --- EXPORT ---
  const handleExport = () => {
    if (currentProject && currentProject.slides.length > 0) {
        exportProjectToJSON(currentProject);
    }
  };

  const hasStarted = slides.length > 0;

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-primary/30 flex w-full">
      <DottedGlowBackground />
      
      <ProjectSidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onCreateProject={handleCreateProject}
        onSelectProject={setActiveProjectId}
        onDeleteProject={handleDeleteProject}
        onImportProject={handleImportProject}
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 transition-all duration-300 md:ml-64 relative z-10 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-40 p-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent backdrop-blur-sm pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
                <div className="md:hidden w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                   <span className="font-bold">Fs</span>
                </div>
                <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg items-center justify-center shadow-lg shadow-primary/20">
                    <span className="font-bold text-xl italic">Fs</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        {currentProject?.title || "Flash Slides"}
                    </h1>
                </div>
            </div>
            
            <div className="pointer-events-auto flex gap-3">
                {slides.length > 0 && (
                    <>
                        <button 
                            onClick={handleExport}
                            className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 transition-all hover:scale-105"
                            title="备份项目 (JSON)"
                        >
                            <DownloadIcon className="w-4 h-4 text-gray-300" />
                            <span className="text-sm font-medium text-gray-300 hidden sm:inline">导出项目</span>
                        </button>
                        <button 
                            onClick={() => setPresentationSlideId(slides[0].id)}
                            className="px-5 py-2 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/20 flex items-center gap-2 transition-all hover:scale-105"
                        >
                            <PlayIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">演示</span>
                        </button>
                    </>
                )}
            </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 container mx-auto px-4 lg:px-12 transition-all duration-700 flex flex-col ${hasStarted ? 'pt-2' : 'justify-center items-center -mt-20'}`}>
            
            {/* Hero Section (Input) */}
            <div className={`w-full max-w-4xl transition-all duration-700 flex flex-col items-center mx-auto ${hasStarted ? 'mb-8' : 'mb-0 scale-105'}`}>
                {!hasStarted && (
                    <div className="mb-8 text-center space-y-4 max-w-2xl">
                        <h2 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-pulse-slow">
                            文稿即演示。
                        </h2>
                        <p className="text-lg text-gray-400">
                            当前项目：<span className="text-white font-medium">{currentProject?.title}</span>
                            <br/>
                            请粘贴演讲稿，AI 将自动构建场景。
                        </p>
                    </div>
                )}
                <PromptInput 
                    onGenerate={handleGenerate} 
                    isGenerating={status === 'planning' || status === 'generating'}
                    compact={hasStarted}
                />
            </div>

            {/* Slides Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                {/* PLANNING STATE */}
                {status === 'planning' && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <p className="text-xl text-gray-300 font-light tracking-wide">AI 导演正在规划分镜...</p>
                </div>
                )}

                {/* GENERATING STATE */}
                {status === 'generating' && (
                    <>
                    {slidePlan.map((planItem, i) => (
                        <div key={i} className="aspect-video rounded-xl bg-gray-900/50 border border-white/5 animate-pulse flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                            <div className="flex flex-col items-center gap-3 z-10 p-4 text-center">
                                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-400 font-mono uppercase tracking-widest text-xs">正在生成场景 {i + 1}</span>
                                <span className="text-lg font-bold text-white/90">{planItem.phase}</span>
                            </div>
                        </div>
                    ))}
                    </>
                )}

                {/* Rendered Slides */}
                {slides.map((slide) => (
                    <div key={slide.id} className="animate-[fadeIn_0.5s_ease-out]">
                        <SlideCard 
                            slide={slide} 
                            onFocus={() => setPresentationSlideId(slide.id)} 
                            onUpdateSlide={handleUpdateSlide}
                        />
                    </div>
                ))}
            </div>
        </main>
      </div>

      {/* Presentation Overlay */}
      {presentationSlideId && slides.length > 0 && (
        <PresentationMode 
            slides={slides} 
            initialSlideId={presentationSlideId} 
            onClose={() => setPresentationSlideId(null)} 
        />
      )}
    </div>
  );
};

export default App;