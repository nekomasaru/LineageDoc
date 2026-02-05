import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Team } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface ProjectState {
    teams: Team[];
    projects: Project[];
    activeTeamId: string | null;
    activeProjectId: string | null;

    // Actions
    setTeams: (teams: Team[]) => void;
    addTeam: (name: string) => Team;
    updateTeam: (id: string, updates: Partial<Team>) => void;
    setActiveTeam: (id: string | null) => void;
    updateTeamGovernance: (id: string, governance: Partial<Team['governance']>) => void;

    setProjects: (projects: Project[]) => void;
    addProject: (teamId: string, name: string, description?: string, tags?: string[]) => Project;
    updateProject: (id: string, updates: Partial<Project>) => void;
    updateProjectGovernance: (id: string, governance: Partial<Project['governance']>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Selectors matchers
    getProjectsByTeam: (teamId: string) => Project[];
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            teams: [],
            projects: [],
            activeTeamId: null,
            activeProjectId: null,

            setTeams: (teams) => set({ teams }),

            addTeam: (name) => {
                const newTeam: Team = {
                    id: uuidv4(),
                    name,
                    members: ['user-me'], // Mock current user
                };
                set((state) => ({
                    teams: [...state.teams, newTeam],
                    activeTeamId: state.activeTeamId || newTeam.id, // Set active if first team
                }));
                return newTeam;
            },

            updateTeam: (id, updates) => set((state) => ({
                teams: state.teams.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            })),

            setActiveTeam: (id) => set({ activeTeamId: id }),

            updateTeamGovernance: (id, governance) => set((state) => ({
                teams: state.teams.map((t) => (t.id === id ? { ...t, governance: { ...t.governance, ...governance } } : t)),
            })),

            setProjects: (projects) => set({ projects }),

            addProject: (teamId, name, description = '', tags = []) => {
                const newProject: Project = {
                    id: uuidv4(),
                    teamId,
                    name,
                    description,
                    tags,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    projects: [...state.projects, newProject],
                    activeProjectId: newProject.id, // Auto-select new project
                }));
                return newProject;
            },

            updateProject: (id, updates) => set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                ),
            })),

            updateProjectGovernance: (id, governance) => set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === id ? { ...p, governance: { ...p.governance, ...governance }, updatedAt: new Date().toISOString() } : p
                ),
            })),

            deleteProject: (id) => set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
            })),

            setActiveProject: (id) => set({ activeProjectId: id }),

            getProjectsByTeam: (teamId) => {
                return get().projects.filter((p) => p.teamId === teamId);
            },
        }),
        {
            name: 'linea-project-storage',
            onRehydrateStorage: () => (state) => {
                // Initialize default team/project if empty
                if (state && state.teams.length === 0) {
                    const defaultTeam = { id: 'default-team', name: 'マイチーム', members: ['me'] };
                    const defaultProject = {
                        id: 'default-project',
                        teamId: 'default-team',
                        name: 'メインプロジェクト',
                        description: '既定のプロジェクト',
                        tags: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    state.setTeams([defaultTeam]);
                    state.setProjects([defaultProject]);
                    state.setActiveTeam(defaultTeam.id);
                    state.setActiveProject(defaultProject.id);
                }
            }
        }
    )
);
