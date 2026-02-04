/**
 * ProjectNavigator.tsx
 * 
 * チームごとのプロジェクト一覧を表示するナビゲーター
 */

import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import { Folder, Plus, ChevronRight, Briefcase } from 'lucide-react';

interface ProjectNavigatorProps {
    onCreateProject: () => void;
}

export function ProjectNavigator({ onCreateProject }: ProjectNavigatorProps) {
    const { teams, projects, getProjectsByTeam, setActiveProject } = useProjectStore();
    const { setActiveSidebarView } = useAppStore();

    // 簡易的なチーム展開状態 (今は全展開)
    // const [expandedTeams, setExpandedTeams] = useState<string[]>([]);

    const handleProjectClick = (projectId: string) => {
        setActiveProject(projectId);
        setActiveSidebarView('project_detail');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-cyan-600" />
                    Projects
                </h2>
                <button
                    onClick={onCreateProject}
                    className="p-1.5 rounded-md hover:bg-cyan-50 text-cyan-600 transition-colors"
                    title="新規プロジェクト作成"
                >
                    <Plus className="w-4 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {teams.map((team) => {
                    const teamProjects = getProjectsByTeam(team.id);
                    return (
                        <div key={team.id} className="space-y-1">
                            {/* Team Header */}
                            <div className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                {team.name}
                                <span className="bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px]">
                                    {teamProjects.length}
                                </span>
                            </div>

                            {/* Project List */}
                            <div className="space-y-1">
                                {teamProjects.length === 0 ? (
                                    <div className="text-xs text-slate-400 px-3 py-2 italic">
                                        プロジェクトはありません
                                    </div>
                                ) : (
                                    teamProjects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleProjectClick(project.id)}
                                            className="w-full text-left group flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-cyan-100 flex items-center justify-center shrink-0">
                                                    <Folder className="w-4 h-4 text-cyan-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-slate-700 truncate group-hover:text-cyan-700">
                                                        {project.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 truncate">
                                                        {project.description || 'No description'}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
