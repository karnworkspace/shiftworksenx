import apiClient from './api';

export interface Project {
  id: string;
  name: string;
  location?: string;
  themeColor: string;
  description?: string;
  managerId?: string;
  responsiblePerson?: string;
  subProjects?: { name: string; percentage: number }[];
  isActive: boolean;
  editCutoffDay?: number;
  editCutoffNextMonth?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  location?: string;
  themeColor?: string;
  description?: string;
  managerId?: string;
  subProjects?: { name: string; percentage: number }[];
  isActive?: boolean;
  editCutoffDay?: number;
  editCutoffNextMonth?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  location?: string;
  themeColor?: string;
  description?: string;
  managerId?: string;
  subProjects?: { name: string; percentage: number }[];
  isActive?: boolean;
  editCutoffDay?: number;
  editCutoffNextMonth?: boolean;
}

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data.projects;
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data.project;
  },

  // Create new project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data.project;
  },

  // Update project
  update: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data.project;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
