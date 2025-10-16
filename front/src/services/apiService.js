// src/services/apiService.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api',
});

/**
 * Generic service for CRUD operations on any resource
 * @param {string} resource - e.g., 'membres', 'kilasy'
 */
const createApiService = (resource) => {
  return {
    /**
     * Get all items (with optional query params)
     * @param {Object} [params] - Optional query parameters
     * @returns {Promise<Array>}
     */
    getAll: async (params = {}) => {
      const response = await api.get(`/${resource}`, { params });
      console.log('get all data');
      console.log(response.data);
      return response.data;
    },

    /**
     * Get item by ID
     * @param {string|number} id
     * @returns {Promise<Object>}
     */
    getById: async (id) => {
      const response = await api.get(`/${resource}/${id}`);
            console.log('get all data');
      console.log(response.data);
      return response.data; // assuming your API wraps data in { data: { ... } }
    },

    /**
     * Create new item
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    create: async (data) => {
      const response = await api.post(`/${resource}`, data);
      console.log(`create ${resource} response`, response);
      return response.data;
    },

    /**
     * Update item by ID
     * @param {string|number} id
     * @param {Object} data
     * @returns {Promise<Object>}
     */
    update: async (id, data) => {
      const response = await api.put(`/${resource}/${id}`, data);
      return response.data;
    },

    /**
     * Delete item by ID
     * @param {string|number} id
     * @returns {Promise<Object>}
     */
    delete: async (id) => {
      const response = await api.delete(`/${resource}/${id}`);
      return response.data;
    },
  };
};

export default createApiService;