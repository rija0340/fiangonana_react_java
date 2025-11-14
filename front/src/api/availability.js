// src/api/availability.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api',
});

const availabilityApi = {
  // Get all availability for a planning session
  getBySession: async (sessionId) => {
    const response = await api.get(`/planning/sessions/${sessionId}/availability`);
    return response.data;
  },

  // Get availability for a specific member in a planning session
  getBySessionAndMember: async (sessionId, memberId) => {
    const response = await api.get(`/planning/sessions/${sessionId}/availability/membre/${memberId}`);
    return response.data;
  },

  // Create new availability
  create: async (sessionId, availability) => {
    const response = await api.post(`/planning/sessions/${sessionId}/availability`, availability);
    return response.data;
  },

  // Update availability
  update: async (sessionId, id, availability) => {
    const response = await api.put(`/planning/sessions/${sessionId}/availability/${id}`, availability);
    return response.data;
  },

  // Delete availability
  delete: async (sessionId, id) => {
    const response = await api.delete(`/planning/sessions/${sessionId}/availability/${id}`);
    return response.data;
  }
};

export default availabilityApi;