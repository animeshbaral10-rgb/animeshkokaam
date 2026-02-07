import { getBackendApiUrl } from './backend-url';

const API_URL = getBackendApiUrl();

export interface ApiError {
  message: string;
  status?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText || 'Request failed' }));
      throw { message: error.message || 'Request failed', status: response.status } as ApiError;
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw { message: 'Request timeout - backend may not be running', status: 0 } as ApiError;
    }
    throw error;
  }
}

// Pets API
export const petsApi = {
  getAll: () => request<any[]>('/pets'),
  getById: (id: string) => request<any>(`/pets/${id}`),
  create: (data: any) => request<any>('/pets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/pets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/pets/${id}`, { method: 'DELETE' }),
};

// Devices API
export const devicesApi = {
  getAll: () => request<any[]>('/devices'),
  getById: (id: string) => request<any>(`/devices/${id}`),
  create: (data: any) => request<any>('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/devices/${id}`, { method: 'DELETE' }),
  linkToPet: (deviceId: string, petId: string) =>
    request<any>(`/devices/${deviceId}/link-pet`, { method: 'POST', body: JSON.stringify({ petId }) }),
};

// Geofences API
export const geofencesApi = {
  getAll: () => request<any[]>('/geofences'),
  getById: (id: string) => request<any>(`/geofences/${id}`),
  create: (data: any) => request<any>('/geofences', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/geofences/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/geofences/${id}`, { method: 'DELETE' }),
  checkLocation: (id: string, latitude: number, longitude: number) =>
    request<any>(`/geofences/${id}/check?latitude=${latitude}&longitude=${longitude}`),
};

// Alerts API
export const alertsApi = {
  getAll: (isRead?: boolean) => {
    const query = isRead !== undefined ? `?isRead=${isRead}` : '';
    return request<any[]>(`/alerts${query}`);
  },
  getUnreadCount: () => request<{ count: number }>('/alerts/unread/count'),
  markAsRead: (id: string) => request<any>(`/alerts/${id}/read`, { method: 'PATCH' }),
  checkInactivity: () => request<any>('/alerts/check-inactivity', { method: 'POST' }),
};

// Locations API
export const locationsApi = {
  getByDevice: (deviceId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request<any[]>(`/locations/device/${deviceId}${query}`);
  },
  getByPet: (petId: string, startTime?: string, endTime?: string) => {
    const params = new URLSearchParams();
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/locations/pet/${petId}${query}`);
  },
  getLatestByDevice: (deviceId: string) => request<any>(`/locations/device/${deviceId}/latest`),
  create: (data: any) => request<any>('/locations', { method: 'POST', body: JSON.stringify(data) }),
};

// Profile API
export const profileApi = {
  update: (data: any) => request<any>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Admin API
export const adminApi = {
  getStatistics: () => request<any>('/admin/statistics'),
  getAllUsers: () => request<any[]>('/admin/users'),
  getUserById: (id: string) => request<any>(`/admin/users/${id}`),
  changeUserPassword: (id: string, newPassword: string) =>
    request<any>(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ newPassword }) }),
  unlockUser: (id: string) => request<any>(`/admin/users/${id}/unlock`, { method: 'POST' }),
  lockUser: (id: string) => request<any>(`/admin/users/${id}/lock`, { method: 'POST' }),
  deleteUser: (id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }),
};

// Export all APIs
export const api = {
  pets: petsApi,
  devices: devicesApi,
  geofences: geofencesApi,
  alerts: alertsApi,
  locations: locationsApi,
  profile: profileApi,
  admin: adminApi,
};

