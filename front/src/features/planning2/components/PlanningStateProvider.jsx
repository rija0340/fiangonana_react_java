import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import planningService from '../services/planningService';
import membreApi from '../../membre/services/api';
import axios from 'axios';

const PlanningContext = createContext();

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningStateProvider');
  }
  return context;
};

export const PlanningStateProvider = ({ children }) => {
  const [store, setStore] = useState({
    plans: [],
    sessions: [],
    currentPlanId: null,
    global: {
      days: [],
      roles: [],
      people: [],
      rolesConfig: {},
      dayMapping: {} // Maps ordreAffichage (0-6) to jour ID
    },
    currentSession: null,
    loading: false,
    error: null
  });

  const [activeTab, setActiveTab] = useState('global');
  const [toast, setToast] = useState(null);
  const [planRoleDayType, setPlanRoleDayType] = useState('0'); // Default to Sunday
  const [newPlanRoleName, setNewPlanRoleName] = useState('');
  const [highlight, setHighlight] = useState({ person: null, role: null });
  const [newRoleName, setNewRoleName] = useState('');
  const [roleDayType, setRoleDayType] = useState('0'); // Default to Sunday

  // Compute currentPlan from store
  const currentPlan = useMemo(() => {
    return store.plans.find(p => p.id === store.currentPlanId) || null;
  }, [store.plans, store.currentPlanId]);

  // Load global data (roles and people) on mount
  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = useCallback(async () => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));

      // Load roles from backend
      const rolesResponse = await axios.get('http://localhost:8082/api/roles');
      const roles = rolesResponse.data;

      // Load days (jours) from backend
      const joursResponse = await axios.get('http://localhost:8082/api/jours');
      const jours = joursResponse.data;

      // Load people from backend
      const people = await membreApi.getAll();

      // Create a mapping from ordreAffichage (0-6) to jour ID
      // This allows us to use JavaScript day of week (0=Sunday, 6=Saturday) to find the corresponding jour ID
      const dayMapping = {};
      jours.forEach(jour => {
        if (jour.ordreAffichage !== null && jour.ordreAffichage !== undefined) {
          dayMapping[jour.ordreAffichage.toString()] = jour.id;
        }
      });

      // Organize roles by day type (using ordreAffichage as key for compatibility with HTML version)
      const rolesConfig = {};
      roles.forEach(role => {
        if (role.jour && role.jour.ordreAffichage !== null && role.jour.ordreAffichage !== undefined) {
          const dayKey = role.jour.ordreAffichage.toString();
          if (!rolesConfig[dayKey]) {
            rolesConfig[dayKey] = [];
          }
          rolesConfig[dayKey].push(role.nom);
        }
      });

      setStore(prev => ({
        ...prev,
        global: {
          days: jours,
          roles: roles,
          people: people,
          rolesConfig: rolesConfig,
          dayMapping: dayMapping // Add mapping for easy lookup
        },
        loading: false
      }));
    } catch (error) {
      console.error('Error loading global data:', error);
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const plans = await planningService.getAllSessions(); // Use sessions instead of plans
      setStore(prev => ({ ...prev, plans, loading: false }));
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
    }
  }, []);

  const setCurrentPlan = useCallback((plan) => {
    setStore(prev => ({ ...prev, currentPlan: plan }));
  }, []);

  const setCurrentPlanId = useCallback((planId) => {
    setStore(prev => ({ ...prev, currentPlanId: planId }));
  }, []);

  const setCurrentSession = useCallback((session) => {
    setStore(prev => ({ ...prev, currentSession: session }));
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const sessions = await planningService.getAllSessions();
      setStore(prev => ({ ...prev, sessions, loading: false }));
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
    }
  }, []);

  const loadPlansBySession = useCallback(async (sessionId) => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const plans = await planningService.getPlanningBySession(sessionId);
      setStore(prev => ({ ...prev, plans, loading: false }));
      return plans;
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  }, []);

  const createSession = useCallback(async (sessionData) => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const newSession = await planningService.createSession(sessionData);
      setStore(prev => ({ ...prev, sessions: [...prev.sessions, newSession], loading: false }));
      return newSession;
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  }, []);

  const updateSession = useCallback(async (id, sessionData) => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const updatedSession = await planningService.updateSession(id, sessionData);
      setStore(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === id ? updatedSession : s),
        loading: false
      }));
      return updatedSession;
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  }, []);

  const deleteSession = useCallback(async (id) => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      await planningService.deleteSession(id);
      setStore(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== id),
        loading: false
      }));
    } catch (error) {
      setStore(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  }, []);

  const switchPlan = useCallback((planId) => {
    setStore(prev => ({ ...prev, currentPlanId: planId }));
  }, []);

  const deletePlan = useCallback((planId) => {
    setStore(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== planId),
      currentPlanId: prev.currentPlanId === planId ? null : prev.currentPlanId
    }));
  }, []);

  const addPlan = useCallback((plan) => {
    setStore(prev => ({
      ...prev,
      plans: [...prev.plans, plan],
      currentPlanId: plan.id // Set as current plan when added
    }));
  }, []);

  // Functions for PlanningConfigTab
  const updatePlanTitle = useCallback((newTitle) => {
    setStore(prev => ({
      ...prev,
      plans: prev.plans.map(p => 
        p.id === prev.currentPlanId ? { ...p, title: newTitle } : p
      )
    }));
  }, []);

  const togglePlanPerson = useCallback((personId) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const isSelected = currentPlan.selectedPeople?.includes(personId);
      const newSelectedPeople = isSelected
        ? currentPlan.selectedPeople.filter(p => p !== personId)
        : [...(currentPlan.selectedPeople || []), personId];
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, selectedPeople: newSelectedPeople } 
            : p
        )
      };
    });
  }, []);

  const selectAllPeopleForPlan = useCallback((selectAll) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const allPeopleIds = prev.global.people
        .filter(p => p && p.id)
        .map(p => p.id);
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, selectedPeople: selectAll ? allPeopleIds : [] } 
            : p
        )
      };
    });
  }, []);

  const toggleDispo = useCallback((personId, date, isAvailable) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const key = `${personId}_${date}`;
      const newAvailability = { ...currentPlan.availability, [key]: isAvailable };
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, availability: newAvailability } 
            : p
        )
      };
    });
  }, []);

  const togglePlanRole = useCallback((dayType, role, enable) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const customRoles = currentPlan.customRoles ? 
        typeof currentPlan.customRoles === 'string' ? 
          JSON.parse(currentPlan.customRoles) : 
          currentPlan.customRoles : 
        {};
      
      const dayCustom = customRoles[dayType] || {};
      const removed = dayCustom.remove || [];
      const added = dayCustom.add || [];
      
      let newRemoved, newAdded;
      if (enable) {
        // Enable role: remove from 'remove' list if present
        newRemoved = removed.filter(r => r !== role);
        newAdded = added;
      } else {
        // Disable role: add to 'remove' list if not in 'add' list
        if (!added.includes(role)) {
          newRemoved = [...removed, role];
        } else {
          newRemoved = removed;
        }
        newAdded = added;
      }
      
      const newDayCustom = {
        ...dayCustom,
        remove: newRemoved,
        add: newAdded
      };
      
      const newCustomRoles = {
        ...customRoles,
        [dayType]: newDayCustom
      };
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, customRoles: newCustomRoles } 
            : p
        )
      };
    });
  }, []);

  const addCustomPlanRole = useCallback((dayType, roleName) => {
    if (!roleName.trim()) return;
    
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const customRoles = currentPlan.customRoles ? 
        typeof currentPlan.customRoles === 'string' ? 
          JSON.parse(currentPlan.customRoles) : 
          currentPlan.customRoles : 
        {};
      
      const dayCustom = customRoles[dayType] || {};
      const added = dayCustom.add || [];
      
      if (added.includes(roleName)) return prev;
      
      const newDayCustom = {
        ...dayCustom,
        add: [...added, roleName]
      };
      
      const newCustomRoles = {
        ...customRoles,
        [dayType]: newDayCustom
      };
      
      // Also clear from the remove list if it was there
      const clearedCustomRoles = {
        ...newCustomRoles,
        [dayType]: {
          ...newDayCustom,
          remove: (newDayCustom.remove || []).filter(r => r !== roleName)
        }
      };
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, customRoles: clearedCustomRoles } 
            : p
        ),
        newPlanRoleName: '' // Clear input field
      };
    });
  }, []);

  const removeCustomPlanRole = useCallback((dayType, roleName) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;
      
      const customRoles = currentPlan.customRoles ? 
        typeof currentPlan.customRoles === 'string' ? 
          JSON.parse(currentPlan.customRoles) : 
          currentPlan.customRoles : 
        {};
      
      const dayCustom = customRoles[dayType] || {};
      const added = dayCustom.add || [];
      
      const newDayCustom = {
        ...dayCustom,
        add: added.filter(r => r !== roleName)
      };
      
      const newCustomRoles = {
        ...customRoles,
        [dayType]: newDayCustom
      };
      
      return {
        ...prev,
        plans: prev.plans.map(p => 
          p.id === prev.currentPlanId 
            ? { ...p, customRoles: newCustomRoles } 
            : p
        )
      };
    });
  }, []);

  // Functions for Global Tab
  const addRole = useCallback((dayType, roleName) => {
    setStore(prev => {
      const newRolesConfig = { ...(prev.global.rolesConfig || {}) };
      const dayRoles = newRolesConfig[dayType] || [];
      if (!dayRoles.includes(roleName)) {
        newRolesConfig[dayType] = [...dayRoles, roleName];
      }
      
      return {
        ...prev,
        global: {
          ...prev.global,
          rolesConfig: newRolesConfig
        }
      };
    });
  }, []);

  const removeGlobalRole = useCallback((dayType, roleName) => {
    setStore(prev => {
      const newRolesConfig = { ...(prev.global.rolesConfig || {}) };
      const dayRoles = newRolesConfig[dayType] || [];
      newRolesConfig[dayType] = dayRoles.filter(r => r !== roleName);
      
      return {
        ...prev,
        global: {
          ...prev.global,
          rolesConfig: newRolesConfig
        }
      };
    });
  }, []);

  const value = {
    store,
    setStore,
    currentPlan, // Add currentPlan to context
    activeTab,
    setActiveTab,
    toast,
    setToast,
    loading: store.loading,
    loadPlans,
    loadSessions,
    loadPlansBySession,
    loadGlobalData, // Add loadGlobalData to context
    setCurrentPlan,
    setCurrentPlanId,
    setCurrentSession,
    createSession,
    updateSession,
    deleteSession,
    switchPlan,
    deletePlan,
    addPlan,
    // Config tab functions
    planRoleDayType,
    setPlanRoleDayType,
    newPlanRoleName,
    setNewPlanRoleName,
    togglePlanRole,
    addCustomPlanRole,
    removeCustomPlanRole,
    updatePlanTitle,
    selectAllPeopleForPlan,
    togglePlanPerson,
    toggleDispo,
    // Schedule tab functions
    highlight,
    setHighlight,
    // Global tab functions
    newRoleName,
    setNewRoleName,
    roleDayType,
    setRoleDayType,
    addRole,
    removeGlobalRole
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};