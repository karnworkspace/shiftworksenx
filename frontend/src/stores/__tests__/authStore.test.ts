/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  it('sets user and authentication state', () => {
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'a@test.com',
      name: 'Alice',
      role: 'ADMIN',
      permissions: ['view'],
    });

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Alice');
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets access token and persists to localStorage', () => {
    useAuthStore.getState().setAccessToken('token123');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('token123');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('token123');
  });

  it('clears token on logout', () => {
    useAuthStore.getState().setAccessToken('token123');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('checks permissions including SUPER_ADMIN', () => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'a@test.com',
        name: 'Alice',
        role: 'SUPER_ADMIN',
        permissions: [],
      },
    });
    expect(useAuthStore.getState().hasPermission('any')).toBe(true);

    useAuthStore.setState({
      user: {
        id: 'u2',
        email: 'b@test.com',
        name: 'Bob',
        role: 'ADMIN',
        permissions: ['edit'],
      },
    });
    expect(useAuthStore.getState().hasPermission('edit')).toBe(true);
    expect(useAuthStore.getState().hasPermission('delete')).toBe(false);
  });
});
