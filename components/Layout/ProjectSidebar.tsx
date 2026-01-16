import React, { useRef } from 'react';
import { Project } from '../../types';
import { FolderIcon, PlusIcon, TrashIcon, UploadIcon } from '../UI/Icons';
import { parseProjectJSON } from '../../services/exportService';

interface ProjectSidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onImportProject: (project: Project) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onCreateProject, 
  onDeleteProject,
  onImportProject
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await parseProjectJSON(file);
      // Ensure unique ID to avoid collisions if re-importing
      project.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      project.title = `${project.title} (Imported)`;
      onImportProject(project);
    } catch (error) {
      alert("导入失败：无效的项目文件。");
      console.error(error);
    } finally {
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 z-50 bg-black/40 backdrop-blur-xl border-r border-white/5 pt-24 pb-6 px-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest">我的项目</h2>
        <div className="flex gap-1">
          <button 
            onClick={handleImportClick}
            className="p-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="导入项目"
          >
            <UploadIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={onCreateProject}
            className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="新建项目"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          className="hidden" 
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
        {projects.length === 0 && (
          <div className="text-center py-10 text-gray-600 text-sm">
            暂无项目<br/>点击 "+" 创建
          </div>
        )}
        
        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`
              group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
              ${activeProjectId === project.id 
                ? 'bg-white/10 text-white border-white/10 shadow-lg' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <FolderIcon className={`w-5 h-5 ${activeProjectId === project.id ? 'text-primary' : 'text-gray-500 group-hover:text-gray-400'}`} />
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">{project.title || "未命名项目"}</h3>
              <p className="text-[10px] text-gray-500 truncate">
                {project.slides.length} 页 • {new Date(project.lastModified).toLocaleDateString()}
              </p>
            </div>

            <button 
              onClick={(e) => onDeleteProject(project.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="删除"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectSidebar;