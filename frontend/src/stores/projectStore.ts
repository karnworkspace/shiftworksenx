import { create } from 'zustand';
import { projectService, Project, CreateProjectData, UpdateProjectData } from '../services/project.service';

interface CostSharing {
  destinationProjectId: string;
  percentage: number;
}

interface ProjectStore {
  projects: Project[];
  loading: boolean;
  error: string | null;
  
  // API methods
  fetchProjects: () => Promise<void>;
  addProject: (data: CreateProjectData) => Promise<Project | null>;
  updateProject: (id: string, updates: UpdateProjectData) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Local getters
  getProject: (id: string) => Project | undefined;
  
  // Local state
  setProjects: (projects: Project[]) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectService.getAll();
      set({ projects, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to fetch projects', loading: false });
    }
  },

  addProject: async (data: CreateProjectData) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectService.create(data);
      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));
      return newProject;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to create project', loading: false });
      return null;
    }
  },

  updateProject: async (id: string, updates: UpdateProjectData) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await projectService.update(id, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
        loading: false,
      }));
      return updatedProject;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to update project', loading: false });
      return null;
    }
  },

  deleteProject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await projectService.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to delete project', loading: false });
      return false;
    }
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  setProjects: (projects: Project[]) => set({ projects }),
  
  clearError: () => set({ error: null }),
}));
