/// <reference types="vitest" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from '../projectStore';
import { projectService } from '../../services/project.service';

vi.mock('../../services/project.service', () => ({
  projectService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockProjects = [
  { id: 'p1', name: 'Project 1', themeColor: '#000', isActive: true, createdAt: '', updatedAt: '' },
  { id: 'p2', name: 'Project 2', themeColor: '#000', isActive: true, createdAt: '', updatedAt: '' },
];

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      loading: false,
      error: null,
      selectedProjectId: '',
    });
    vi.resetAllMocks();
  });

  it('fetches projects and preserves selected id when valid', async () => {
    (projectService.getAll as any).mockResolvedValue(mockProjects);
    useProjectStore.setState({ selectedProjectId: 'p2' });
    await useProjectStore.getState().fetchProjects();
    const state = useProjectStore.getState();
    expect(state.projects).toHaveLength(2);
    expect(state.selectedProjectId).toBe('p2');
  });

  it('fetches projects and selects first when previous selection invalid', async () => {
    (projectService.getAll as any).mockResolvedValue(mockProjects);
    useProjectStore.setState({ selectedProjectId: 'missing' });
    await useProjectStore.getState().fetchProjects();
    expect(useProjectStore.getState().selectedProjectId).toBe('p1');
  });

  it('adds, updates, and deletes a project', async () => {
    (projectService.create as any).mockResolvedValue(mockProjects[0]);
    const created = await useProjectStore.getState().addProject({
      name: 'Project 1',
      themeColor: '#000',
    });
    expect(created?.id).toBe('p1');
    expect(useProjectStore.getState().projects).toHaveLength(1);

    (projectService.update as any).mockResolvedValue({ ...mockProjects[0], name: 'Updated' });
    const updated = await useProjectStore.getState().updateProject('p1', { name: 'Updated' });
    expect(updated?.name).toBe('Updated');

    (projectService.delete as any).mockResolvedValue(undefined);
    const deleted = await useProjectStore.getState().deleteProject('p1');
    expect(deleted).toBe(true);
    expect(useProjectStore.getState().projects).toHaveLength(0);
  });

  it('handles service errors', async () => {
    (projectService.getAll as any).mockRejectedValue({ response: { data: { error: 'boom' } } });
    await useProjectStore.getState().fetchProjects();
    expect(useProjectStore.getState().error).toBe('boom');

    (projectService.create as any).mockRejectedValue({ response: { data: { error: 'create fail' } } });
    const created = await useProjectStore.getState().addProject({ name: 'x', themeColor: '#000' });
    expect(created).toBeNull();
    expect(useProjectStore.getState().error).toBe('create fail');
  });
});
