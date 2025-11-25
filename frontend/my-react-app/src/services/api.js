import axios from 'axios';

// Create axios instance with base configuration
// In development, Vite proxy will handle /api requests
// In production, use VITE_API_URL env variable or default to localhost
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  signup: async (email, password) => {
    const response = await api.post('/signup', { email, password });
    return response.data;
  },
};

// ===== DOCUMENT GENERATION API =====
export const documentAPI = {
  // Generate Word document JSON and save to DB
  generateWord: async (mainTopic, sections) => {
    const response = await api.post('/generate-word-json', {
      main_topic: mainTopic,
      sections: sections,
    });
    return response.data;
  },

  // Generate PPT JSON and save to DB
  generatePPT: async (topic, slides) => {
    const response = await api.post('/generate-ppt-json', {
      topic: topic,
      slides: slides,
    });
    return response.data;
  },

  // Suggest outline using AI
  suggestOutline: async (topic, docType) => {
    const response = await api.post('/suggest-outline', {
      topic: topic,
      doc_type: docType,
    });
    return response.data;
  },
};

// ===== EXPORT API =====
export const exportAPI = {
  // Export Word document
  exportWord: async (document) => {
    const response = await api.post(
      '/word',
      { document },
      {
        responseType: 'blob', // Important for file downloads
      }
    );
    return response.data;
  },

  // Export PPT
  exportPPT: async (presentation) => {
    const response = await api.post(
      '/ppt',
      { presentation },
      {
        responseType: 'blob', // Important for file downloads
      }
    );
    return response.data;
  },
};

// ===== PROJECT API =====
export const projectAPI = {
  // Get all projects for current user
  getProjects: async () => {
    const response = await api.get('/projects/my');
    return response.data;
  },

  // Get versions for a project
  getProjectVersions: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/versions`);
    return response.data;
  },

  // Get specific version content
  // Returns version object with content extracted from config field
  getVersionContent: async (projectId, versionId) => {
    const response = await api.get(`/projects/${projectId}/versions/${versionId}`);
    const data = response.data;
    
    // Extract content from version.config (which stores the document/PPT JSON)
    // Config might be stored as a JSON string, so parse it if needed
    let content = data.version?.config || null;
    if (content && typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse config as JSON:', e);
      }
    }
    
    return {
      version: data.version,
      content: content
    };
  },

  // Submit feedback (like/dislike)
  submitFeedback: async (projectId, versionId, sectionTitle, liked) => {
    const response = await api.post(`/projects/${projectId}/versions/${versionId}/feedback`, {
      section_title: sectionTitle,
      liked: liked,
    });
    return response.data;
  },

  // AI refinement
  refineContent: async (projectId, versionId, sectionTitle, refinementPrompt) => {
    const response = await api.post(`/projects/${projectId}/versions/${versionId}/refine`, {
      section_title: sectionTitle,
      refinement_prompt: refinementPrompt,
    });
    return response.data;
  },

  // Add comment
  addComment: async (projectId, versionId, sectionTitle, comment) => {
    const response = await api.post(`/projects/${projectId}/versions/${versionId}/comments`, {
      section_title: sectionTitle,
      comment: comment,
    });
    return response.data;
  },

  // Get feedback for a version
  getFeedback: async (projectId, versionId) => {
    const response = await api.get(`/projects/${projectId}/versions/${versionId}/feedback`);
    return response.data;
  },

  // Download document
  downloadDocument: async (projectId, versionId) => {
    const response = await api.get(
      `/projects/${projectId}/versions/${versionId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default api;

