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

  // Auto-save function to persist plan changes to backend
  const savePlanToBackend = useCallback(async (plan) => {
    if (!plan || !plan.id) return;

    try {
      const sessionData = {
        nom: plan.nom || plan.title,
        description: plan.description || "Planning",
        selectedDates: plan.selectedDates || [],
        customRoles: typeof plan.customRoles === 'string'
          ? plan.customRoles
          : JSON.stringify(plan.customRoles || {}),
        availability: typeof plan.availability === 'string'
          ? plan.availability
          : JSON.stringify(plan.availability || {}),
        selectedPeople: plan.selectedPeople || [],
      };

      await axios.put(`http://localhost:8082/api/planning/sessions/${plan.id}`, sessionData, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error auto-saving plan:', error);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setStore(prev => ({ ...prev, loading: true, error: null }));
      const plans = await planningService.getAllSessions(); // Use sessions instead of plans

      // Parse customRoles if it's a string
      const parsedPlans = plans.map(plan => ({
        ...plan,
        customRoles: typeof plan.customRoles === 'string'
          ? (plan.customRoles ? JSON.parse(plan.customRoles) : {})
          : (plan.customRoles || {}),
        availability: typeof plan.availability === 'string'
          ? (plan.availability ? JSON.parse(plan.availability) : {})
          : (plan.availability || {}),
        assignments: plan.assignments || {}
      }));

      setStore(prev => ({ ...prev, plans: parsedPlans, loading: false }));
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

  const loadAssignmentsForSession = useCallback(async (sessionId) => {
    try {
      // Don't set global loading to true to avoid full screen spinner on switch
      const assignmentsList = await planningService.getPlanningBySession(sessionId);

      // Convert list to map: { "date_role": "membreNom" }
      const assignmentsMap = {};
      assignmentsList.forEach(a => {
        if (a.date && a.roleName) {
          const key = `${a.date}_${a.roleName}`;
          assignmentsMap[key] = a.membreNom;
        }
      });

      setStore(prev => ({
        ...prev,
        plans: prev.plans.map(p =>
          p.id === sessionId
            ? { ...p, assignments: assignmentsMap }
            : p
        )
      }));

      return assignmentsMap;
    } catch (error) {
      console.error("Error loading assignments:", error);
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
    if (planId) {
      loadAssignmentsForSession(planId);
    }
  }, [loadAssignmentsForSession]);

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
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;

      const updatedPlan = { ...currentPlan, title: newTitle, nom: newTitle };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId ? updatedPlan : p
        )
      };
    });
  }, [savePlanToBackend]);

  const togglePlanPerson = useCallback((personId) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;

      const isSelected = currentPlan.selectedPeople?.includes(personId);
      const newSelectedPeople = isSelected
        ? currentPlan.selectedPeople.filter(p => p !== personId)
        : [...(currentPlan.selectedPeople || []), personId];

      const updatedPlan = { ...currentPlan, selectedPeople: newSelectedPeople };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

  const selectAllPeopleForPlan = useCallback((selectAll) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;

      // Use person_code instead of id for consistency with backend
      const allPeopleCodes = prev.global.people
        .filter(p => p && p.person_code)
        .map(p => p.person_code);

      const updatedPlan = {
        ...currentPlan,
        selectedPeople: selectAll ? allPeopleCodes : []
      };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

  const toggleDispo = useCallback((personId, date, isAvailable) => {
    setStore(prev => {
      const currentPlan = prev.plans.find(p => p.id === prev.currentPlanId);
      if (!currentPlan) return prev;

      const key = `${personId}_${date}`;
      const newAvailability = { ...currentPlan.availability, [key]: isAvailable };

      const updatedPlan = { ...currentPlan, availability: newAvailability };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

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

      const updatedPlan = { ...currentPlan, customRoles: newCustomRoles };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

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

      const updatedPlan = { ...currentPlan, customRoles: clearedCustomRoles };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        ),
        newPlanRoleName: '' // Clear input field
      };
    });
  }, [savePlanToBackend]);

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

      const updatedPlan = { ...currentPlan, customRoles: newCustomRoles };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

  const renameCustomPlanRole = useCallback((dayType, oldRoleName, newRoleName) => {
    if (!newRoleName.trim() || oldRoleName === newRoleName) return;

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

      if (!added.includes(oldRoleName)) return prev;

      const newAdded = added.map(r => r === oldRoleName ? newRoleName : r);

      const newDayCustom = {
        ...dayCustom,
        add: newAdded
      };

      const newCustomRoles = {
        ...customRoles,
        [dayType]: newDayCustom
      };

      const updatedPlan = { ...currentPlan, customRoles: newCustomRoles };

      // Auto-save to backend
      savePlanToBackend(updatedPlan);

      return {
        ...prev,
        plans: prev.plans.map(p =>
          p.id === prev.currentPlanId
            ? updatedPlan
            : p
        )
      };
    });
  }, [savePlanToBackend]);

  // Functions for Global Tab
  const addRole = useCallback((dayType, roleName) => {
    setStore(prev => {
      const newRolesConfig = { ...(prev.global.rolesConfig || {}) };
      const dayRoles = newRolesConfig[dayType] || [];
      if (!dayRoles.includes(roleName)) {
        newRolesConfig[dayType] = [...dayRoles, roleName];
      }

      // Also update global.roles array to keep it in sync (mock object if needed)
      // This helps with finding the role object later for renaming/deleting if needed
      const newRoles = [...(prev.global.roles || [])];
      // Check if it already exists to avoid duplicates
      if (!newRoles.some(r => r.nom === roleName)) {
        newRoles.push({
          nom: roleName,
          jour: { ordreAffichage: parseInt(dayType) } // Mock structure
        });
      }

      return {
        ...prev,
        global: {
          ...prev.global,
          rolesConfig: newRolesConfig,
          roles: newRoles
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

  const renameGlobalRole = useCallback((dayType, oldRoleName, newRoleName) => {
    if (!newRoleName.trim() || oldRoleName === newRoleName) return;

    setStore(prev => {
      const newRolesConfig = { ...(prev.global.rolesConfig || {}) };
      const dayRoles = newRolesConfig[dayType] || [];

      if (!dayRoles.includes(oldRoleName)) return prev;

      newRolesConfig[dayType] = dayRoles.map(r => r === oldRoleName ? newRoleName : r);

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
    loadAssignmentsForSession,
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
    renameCustomPlanRole,
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
    removeGlobalRole,
    renameGlobalRole,
    savePlanToBackend // Add savePlanToBackend to context
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};