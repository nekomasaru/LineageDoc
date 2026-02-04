'use client';

import { useProjectStore } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import { useDocumentStore } from '@/stores/documentStore';
import { Folder, Clock, FileText, Plus } from 'lucide-react';

export function DashboardView() {
    const { projects, teams } = useProjectStore();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 mt-1">チームとプロジェクトの管理</p>
                </div>
                <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600/80 text-white rounded-lg cursor-not-allowed shadow-sm font-medium"
                    title="現在作成機能は制限されています"
                >
                    <Plus className="w-5 h-5" />
                    新規プロジェクト
                </button>
            </div>

            {/* Teams Sections */}
            <div className="space-y-12">
                {teams.map(team => (
                    <TeamSection key={team.id} team={team} />
                ))}
            </div>
        </div>
    );
}

function TeamSection({ team }: { team: any }) {
    const { getProjectsByTeam } = useProjectStore();
    const { documents } = useDocumentStore();
    const { setCurrentDocument } = useAppStore();

    const teamProjects = getProjectsByTeam(team.id);

    if (teamProjects.length === 0) return null;

    const handleProjectClick = (projectId: string) => {
        // プロジェクトに紐づくドキュメントを検索
        const projectDocs = documents.filter(d => d.projectId === projectId);

        if (projectDocs.length > 0) {
            // ドキュメントが存在する場合、最初のドキュメントを開く
            // (更新日時順などが望ましいが、現状は配列順)
            const latestDoc = projectDocs[0];
            setCurrentDocument(latestDoc.id, latestDoc.title);
        } else {
            // ドキュメントがない場合
            // 現状はアラートを出さず、コンソールログのみ
            console.log(`Project ${projectId} has no documents.`);

            // 将来的にはここで「新規ドキュメント作成」へ誘導するか、
            // 空のプロジェクト詳細画面（Hub内）へ遷移すべき
        }
    };

    return (
        <section>
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                {team.name}
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    {teamProjects.length}
                </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamProjects.map(project => {
                    const projectDocs = documents.filter(d => d.projectId === project.id);
                    const docCount = projectDocs.length;

                    return (
                        <div
                            key={project.id}
                            onClick={() => handleProjectClick(project.id)}
                            className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-600">
                                    <Folder className="w-5 h-5" />
                                </div>
                                {/* <span className="text-xs font-mono text-slate-400">PRJ-{project.id.slice(0,4)}</span> */}
                            </div>

                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-cyan-700 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10 min-h-[2.5rem]">
                                {project.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 pt-3">
                                <div className="flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{docCount} Docs</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>-</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
