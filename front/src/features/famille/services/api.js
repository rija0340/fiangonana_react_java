// src/services/membresService.js
import createApiService from '../../../services/apiService';
import axios from 'axios';

const api = createApiService('familles');

// Add custom endpoint to associate members with a family
api.addMembers = async (familleId, memberIds) => {
  const response = await axios.post(`http://localhost:8082/api/familles/${familleId}/membres`, memberIds, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export default api;
