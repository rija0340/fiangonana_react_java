import createApiService from '../../../services/apiService';

const planningService = createApiService('planning');

// Add custom methods for planning configurations and statistics if endpoints exist
// Since backend doesn't have /config and /stats endpoints, we'll use the basic CRUD methods
// from the createApiService, plus session-specific methods

// Planning session methods
planningService.getAllSessions = async () => {
  try {
    const response = await fetch('http://localhost:8082/api/planning/sessions');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching planning sessions:', error);
    throw error;
  }
};

planningService.getSessionById = async (id) => {
  try {
    const response = await fetch(`http://localhost:8082/api/planning/sessions/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching planning session:', error);
    throw error;
  }
};

planningService.createSession = async (sessionData) => {
  try {
    const response = await fetch('http://localhost:8082/api/planning/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating planning session:', error);
    throw error;
  }
};

planningService.updateSession = async (id, sessionData) => {
  try {
    const response = await fetch(`http://localhost:8082/api/planning/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating planning session:', error);
    throw error;
  }
};

planningService.deleteSession = async (id) => {
  try {
    const response = await fetch(`http://localhost:8082/api/planning/sessions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting planning session:', error);
    throw error;
  }
};

// Planning by session methods
planningService.getPlanningBySession = async (sessionId) => {
  try {
    const response = await fetch(`http://localhost:8082/api/planning/session/${sessionId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching planning by session:', error);
    throw error;
  }
};

export default planningService;