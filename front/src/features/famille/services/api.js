// src/services/membresService.js
import createApiService from '../../../services/apiService';
import axios from 'axios';

// Create a custom axios instance with the same base URL as the main service
const familleAxios = axios.create({
  baseURL: 'http://localhost:8082/api',
});

const api = createApiService('familles');

// Add custom endpoint to associate members with a family
api.addMembers = async (familleId, memberIds) => {
  const response = await familleAxios.post(`/familles/${familleId}/membres`, memberIds, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Add custom endpoint to remove a member from a family
api.removeMember = async (familleId, memberId) => {
  const response = await familleAxios.delete(`/familles/${familleId}/membres/${memberId}`);
  return response.data;
};

export default api;
