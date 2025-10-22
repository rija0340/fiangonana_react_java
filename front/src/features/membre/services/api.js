// src/services/membresService.js
import createApiService from '../../../services/apiService';
import axios from 'axios';

const api = createApiService('membres');

// Add custom endpoint(s)
api.import = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('http://localhost:8082/api/excel/membres/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

// Add endpoint to get all categories
api.getCategories = async () => {
  const response = await axios.get('http://localhost:8082/api/membres/categories');
  return response.data;
};

export default api;
