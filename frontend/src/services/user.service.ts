import apiClient from './api';

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'AREA_MANAGER' | 'SITE_MANAGER';
    permissions: string[];
    createdAt: string;
    updatedAt: string;
    projectAccess?: Array<{
        project: {
            id: string;
            name: string;
            location?: string;
        };
    }>;
}

export interface CreateUserData {
    email: string;
    password: string;
    name: string;
    role?: string;
    permissions?: string[];
    projectIds?: string[];
}

export interface UpdateUserData {
    email?: string;
    name?: string;
    role?: string;
    permissions?: string[];
}

export interface Project {
    id: string;
    name: string;
    location?: string;
}

export interface ChangePasswordData {
    currentPassword?: string;
    newPassword: string;
}

export const userService = {
    // Get all users
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get('/users');
        return response.data.users;
    },

    // Get user by ID
    getById: async (id: string): Promise<User> => {
        const response = await apiClient.get(`/users/${id}`);
        return response.data.user;
    },

    // Create new user
    create: async (data: CreateUserData): Promise<User> => {
        const response = await apiClient.post('/users', data);
        return response.data.user;
    },

    // Update user
    update: async (id: string, data: UpdateUserData): Promise<User> => {
        const response = await apiClient.put(`/users/${id}`, data);
        return response.data.user;
    },

    // Delete user
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    // Change password
    changePassword: async (id: string, data: ChangePasswordData): Promise<void> => {
        await apiClient.put(`/users/${id}/password`, data);
    },

    // Get user's project access
    getUserProjects: async (id: string): Promise<Project[]> => {
        const response = await apiClient.get(`/users/${id}/projects`);
        return response.data.projects;
    },

    // Update user's project access
    updateUserProjects: async (id: string, projectIds: string[]): Promise<Project[]> => {
        const response = await apiClient.put(`/users/${id}/projects`, { projectIds });
        return response.data.projects;
    },
};
