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

// Add endpoint to export membres to Excel
api.exportToExcel = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Add filters to the query parameters
  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key] !== 'all') {
      params.append(key, filters[key]);
    }
  });
  
  const response = await axios({
    method: 'GET',
    url: `http://localhost:8082/api/excel/membres/export?${params.toString()}`,
    responseType: 'blob' // Important: This tells axios to treat the response as a binary file
  });
  
  return response;
};

export default api;
