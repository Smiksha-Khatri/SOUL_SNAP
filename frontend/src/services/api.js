import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Journal API
export const journalApi = {
  create: (data) => api.post('/journal', data),
  getAll: (params) => api.get('/journal', { params }),
  getOne: (id) => api.get(`/journal/${id}`),
  update: (id, data) => api.put(`/journal/${id}`, data),
  delete: (id) => api.delete(`/journal/${id}`)
};

// Chat API
export const chatApi = {
  send: (message, saveAsMemory = null) => api.post('/chat', { message, save_as_memory: saveAsMemory }),
  getHistory: (params) => api.get('/chat/history', { params }),
  clearHistory: () => api.delete('/chat/history'),
  saveMemory: () => api.post('/chat/save-memory')
};

// Memories API
export const memoriesApi = {
  create: (data) => api.post('/memories', data),
  getAll: (params) => api.get('/memories', { params }),
  delete: (id) => api.delete(`/memories/${id}`),
  generateCapsule: (days = 7) => api.post('/memories/capsule', null, { params: { days } }),
  getCapsules: (limit = 10) => api.get('/memories/capsules', { params: { limit } })
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  quickMood: (emotion, note = null) => api.post('/dashboard/quick-mood', { emotion, note }),
  generateWeeklyReport: () => api.post('/dashboard/weekly-report'),
  getWeeklyReports: (limit = 10) => api.get('/dashboard/weekly-reports', { params: { limit } }),
  getTimeline: (days = 30) => api.get('/dashboard/timeline', { params: { days } })
};

// Media API
export const mediaApi = {
  getSignature: (resourceType = 'image', folder = 'uploads') => 
    api.get('/media/signature', { params: { resource_type: resourceType, folder } }),
  delete: (publicId, resourceType = 'image') => 
    api.delete(`/media/${publicId}`, { params: { resource_type: resourceType } })
};

// Upload to Cloudinary
export const uploadToCloudinary = async (file, folder = 'uploads', resourceType = 'image') => {
  const { data: sig } = await mediaApi.getSignature(resourceType, folder);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.api_key);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder || folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error?.message || `Upload failed (${response.status})`);
  }

  return result;
};

export default api;
