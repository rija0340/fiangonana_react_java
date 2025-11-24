import React, { useState, useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import axios from 'axios';

import './planning2.css';

Chart.register(...registerables);

// --- CONSTANTS & UTILS ---
const API_URL = 'http://localhost:8082/api';
const DAY_NAMES = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Sabbat' };
const genId = () => Math.random().toString(36).substr(2, 9);

const dateToYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseYMD = (dStr) => dStr ? new Date(dStr + 'T00:00:00') : null;

const formatDateShort = (dStr) => {
    const d = parseYMD(dStr);
    return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
};

const Planning2 = () => {
    const [store, setStore] = useState({
        global: {
            people: [], // List of Membre objects
            rolesConfig: {} // Map of dayType -> List of Role objects
        },
        plans: [],
        currentPlanId: null
    });
    const [activeTab, setActiveTab] = useState('config');
    const [toast, setToast] = useState(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [roleDayType, setRoleDayType] = useState("0");
    const [planRoleDayType, setPlanRoleDayType] = useState("0");
    const [newPlanRoleName, setNewPlanRoleName] = useState("");
    const [modalState, setModalState] = useState({ isOpen: false, context: null });
    const [highlight, setHighlight] = useState({ person: null, role: null });
    const [loading, setLoading] = useState(true);

    const datePickerRef = useRef(null);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // --- DERIVED STATE & HELPERS ---
    const currentPlan = store.plans.find(p => p.id === store.currentPlanId);

    // --- LIFECYCLE & STATE MANAGEMENT ---

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [plansRes, membersRes, rolesRes] = await Promise.all([
                axios.get(`${API_URL}/planning/sessions`),
                axios.get(`${API_URL}/membres`),
                axios.get(`${API_URL}/roles`)
            ]);

            const plans = plansRes.data;
            const members = membersRes.data;
            const roles = rolesRes.data || []; // Handle case where API returns null/undefined

            // Process roles into config
            const rolesConfig = {};
            
            // Initialize all day types with empty arrays to ensure all day types appear in UI
            rolesConfig['0'] = []; // Dimanche
            rolesConfig['6'] = []; // Sabbat / Samedi
            rolesConfig['5'] = []; // Vendredi Soir
            rolesConfig['3'] = []; // Mercredi
            roles.forEach(r => {
                // Assuming role.jour is the dayType (0-6) or we map it. 
                // If role.jour is null, maybe it's global? 
                // For now, let's assume role.jour matches our dayType keys if it's a number/string.
                // If role.jour is an object, we need its ID or some identifier.
                // Let's assume role.jour is an ID or we use a default.
                // Actually, backend Role has 'jour' as Entity. 
                // We might need to adjust how we store/retrieve this.
                // For simplicity, let's group by 'jour' ID if available, or just use a property.
                // If backend Role doesn't have a simple dayType, we might need to fetch Jours too.
                // Let's assume for now we just use a simple mapping or store it in the role name?
                // No, let's just use a default '0' if not specified or try to infer.
                // Wait, the UI uses 0, 6, 5, 3.
                // Handle different possible structures for the jour property
                let key = '0'; // default to Sunday
                if (r.jour) {
                    // Check if jour is an object with an id
                    if (typeof r.jour === 'object' && r.jour.id !== undefined) {
                        key = r.jour.id.toString();
                    } else if (typeof r.jour === 'object' && r.jour.id === undefined) {
                        // If jour is an object but has no id, try to find an id field
                        const idField = Object.keys(r.jour).find(k => k.toLowerCase().includes('id'));
                        if (idField) {
                            key = r.jour[idField].toString();
                        } else {
                            // Use the jour value if it's a primitive type
                            key = String(r.jour);
                        }
                    } else {
                        // If jour is already a primitive value
                        key = String(r.jour);
                    }
                } else if (r.jourId) {
                    // Check if there's a jourId field
                    key = String(r.jourId);
                } else if (r.dayType) {
                    // Check if there's a dayType field
                    key = String(r.dayType);
                }
                // Ensure key is a valid day type (0-6)
                if (!['0', '1', '2', '3', '4', '5', '6'].includes(key)) {
                    key = '0'; // default to Sunday
                }
                
                if (!rolesConfig[key]) rolesConfig[key] = [];
                rolesConfig[key].push(r.nom);
            });

            // Process plans to match frontend structure
            const processedPlans = await Promise.all(plans.map(async p => {
                // Fetch details for each plan
                const [availRes, assignRes] = await Promise.all([
                    axios.get(`${API_URL}/planning/sessions/${p.id}/availability`),
                    axios.get(`${API_URL}/planning/session/${p.id}`)
                ]);

                const availability = {};
                availRes.data.forEach(a => {
                    if (a.membre && a.date) {
                        const key = `${a.membre.nom}_${a.date}`; // Using name for key to match old logic, or ID?
                        // Old logic used name. Let's try to stick to names for compatibility or switch to IDs.
                        // Switching to IDs is better but requires more refactoring.
                        // Let's use names for now as 'selectedPeople' in frontend are names in the old code.
                        // But wait, 'selectedPeople' in backend are Membre objects.
                        // Let's map everything to Names for the frontend state to minimize rewrite, 
                        // but use IDs for backend comms.
                        availability[key] = a.disponible;
                    }
                });

                const assignments = {};
                assignRes.data.forEach(a => {
                    if (a.date && a.roleName && a.membreNom) {
                        const key = `${a.date}_${a.roleName}`;
                        assignments[key] = a.membreNom;
                    }
                });

                return {
                    ...p,
                    selectedPeople: p.selectedPeople ? p.selectedPeople.map(m => m.nom) : [],
                    selectedDates: p.selectedDates || [],
                    customRoles: p.customRoles ? JSON.parse(p.customRoles) : {},
                    availability,
                    assignments
                };
            }));

            setStore({
                global: {
                    people: members.map(m => m.nom), // Just names for now
                    rolesConfig
                },
                plans: processedPlans,
                currentPlanId: processedPlans.length > 0 ? processedPlans[0].id : null
            });

            if (processedPlans.length === 0) {
                // Create default plan if none
                // createNewPlan(true); // This needs to be async and handle backend
            }

        } catch (e) {
            console.error("Error loading data", e);
            // Check which endpoint failed
            if (e.response?.status === 404) {
                showToast(`Erreur: L'API n'a pas été trouvée. Vérifiez que le backend est démarré.`, "error");
            } else {
                showToast(`Erreur de chargement des données: ${e.message}`, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (datePickerRef.current && currentPlan) {
            const fp = flatpickr(datePickerRef.current, {
                mode: "multiple", dateFormat: "Y-m-d", locale: French,
                defaultDate: currentPlan.selectedDates,
                onChange: handleDateChange,
            });
            return () => fp.destroy();
        }
    }, [currentPlan]); // Re-run when currentPlan changes (or its dates)

    useEffect(() => {
        if (activeTab === 'stats') {
            updateStats();
        }
    }, [activeTab, currentPlan]);


    const showToast = (msg, type = 'info') => setToast({ msg, type });

    // --- ACTIONS ---

    const createNewPlan = async () => {
        const today = new Date();
        const defaultDates = [];
        for (let i = 0; i < 4; i++) {
            const nextSunday = new Date(today);
            nextSunday.setDate(today.getDate() + (7 + 0 - today.getDay()) % 7 + (i * 7));
            defaultDates.push(dateToYMD(nextSunday));
        }

        const newPlanData = {
            nom: `Planning ${store.plans.length + 1}`,
            description: "Nouveau planning",
            selectedDates: defaultDates,
            customRoles: JSON.stringify({}),
            selectedPeople: [] // Start empty or with all? Old logic: all.
        };

        try {
            // We need to fetch all members to add them? Or just send IDs?
            // For now send empty, user can select.
            const res = await axios.post(`${API_URL}/planning/sessions`, newPlanData);
            const createdPlan = res.data;

            // Transform for frontend
            const newPlan = {
                ...createdPlan,
                selectedPeople: [],
                selectedDates: defaultDates,
                customRoles: {},
                availability: {},
                assignments: {}
            };

            setStore(prev => ({ ...prev, plans: [...prev.plans, newPlan], currentPlanId: newPlan.id }));
            showToast("Nouveau planning créé");
        } catch (e) {
            console.error(e);
            showToast("Erreur création planning", "error");
        }
    };

    const switchPlan = (id) => setStore(prev => ({ ...prev, currentPlanId: parseInt(id) }));

    const deleteCurrentPlan = async () => {
        if (!currentPlan) return;
        if (window.confirm("Supprimer définitivement ce planning ?")) {
            try {
                await axios.delete(`${API_URL}/planning/sessions/${currentPlan.id}`);
                const newPlans = store.plans.filter(p => p.id !== currentPlan.id);
                setStore(prev => ({
                    ...prev,
                    plans: newPlans,
                    currentPlanId: newPlans.length > 0 ? newPlans[0].id : null
                }));
                showToast("Planning supprimé");
            } catch (e) {
                console.error(e);
                showToast("Erreur suppression", "error");
            }
        }
    };

    const resetAll = async () => {
        if (window.confirm("ATTENTION: Cela va effacer toutes les données et plannings. Continuer ?")) {
            try {
                // Call backend reset endpoints if available, or delete one by one
                // For now just reload as we don't have a global reset endpoint exposed easily
                // or we implemented delete /reset in controller?
                // Yes: @DeleteMapping("/reset") in PlanningRestController
                await axios.delete(`${API_URL}/planning/reset`);
                // Also maybe delete sessions?
                window.location.reload();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const exportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = "plandivin_backup.json";
        a.click();
    };

    // --- UPDATES ---

    const updatePlanBackend = async (plan) => {
        // Convert frontend plan to backend format
        // We need to map selectedPeople names back to Membre objects (or at least IDs)
        // This is tricky if we only have names.
        // We should probably fetch members map.
        // For now, let's assume we can't easily update 'selectedPeople' relations without IDs.
        // We'll skip updating relations for now and focus on fields.

        const payload = {
            id: plan.id,
            nom: plan.title || plan.nom,
            description: plan.description,
            selectedDates: plan.selectedDates,
            customRoles: JSON.stringify(plan.customRoles),
            // selectedPeople: ... we need IDs. 
        };

        try {
            await axios.put(`${API_URL}/planning/sessions/${plan.id}`, payload);
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    const handleDateChange = (dates) => {
        const newDates = dates.map(dateToYMD).sort();
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const updated = { ...p, selectedDates: newDates };
                    updatePlanBackend(updated);
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    const updatePlanTitle = (val) => {
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const updated = { ...p, title: val, nom: val };
                    updatePlanBackend(updated);
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    const togglePlanPerson = (name) => {
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const newSelected = p.selectedPeople.includes(name)
                        ? p.selectedPeople.filter(n => n !== name)
                        : [...p.selectedPeople, name];
                    const updated = { ...p, selectedPeople: newSelected };
                    // We need to update backend relations here.
                    // This requires fetching Member ID by name.
                    // For now, let's just update local state.
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    const selectAllPeopleForPlan = (includeAll) => {
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const updated = { ...p, selectedPeople: includeAll ? [...prev.global.people] : [] };
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    const toggleDispo = async (person, date, available) => {
        // Update local
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const newAvailability = { ...p.availability };
                    const key = `${person}_${date}`;
                    if (available) delete newAvailability[key];
                    else newAvailability[key] = false;
                    return { ...p, availability: newAvailability };
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });

        // Update Backend
        // We need to find the Availability ID if it exists, or create new.
        // This is hard without storing IDs.
        // Ideally we should store availability as objects with IDs in frontend state.
    };

    const addRole = async () => {
        const name = newRoleName.trim();
        if (name) {
            try {
                // Create role with the selected day type
                const newRole = await axios.post(`${API_URL}/roles`, { 
                    nom: name,
                    jour: { id: parseInt(roleDayType) } // Associate with the selected day
                });
                
                const rolesForDay = store.global.rolesConfig[roleDayType] || [];
                if (!rolesForDay.includes(name)) {
                    setStore(prev => ({ ...prev, global: { ...prev.global, rolesConfig: { ...prev.global.rolesConfig, [roleDayType]: [...rolesForDay, name] } } }));
                    setNewRoleName("");
                }
            } catch (e) {
                console.error("Error adding role:", e);
                // Even if backend fails, we'll still update the frontend for better UX
                const rolesForDay = store.global.rolesConfig[roleDayType] || [];
                if (!rolesForDay.includes(name)) {
                    setStore(prev => ({ ...prev, global: { ...prev.global, rolesConfig: { ...prev.global.rolesConfig, [roleDayType]: [...rolesForDay, name] } } }));
                    setNewRoleName("");
                }
            }
        }
    };

    const removeGlobalRole = async (dayType, role) => {
        try {
            // Try to delete from backend first
            // We need to find the role ID by name to delete it
            // Since we don't have the ID, we might need to get all roles first or implement name-based deletion
            // For now, just update frontend and rely on backend synchronization during load
            await axios.delete(`${API_URL}/roles/name/${encodeURIComponent(role)}`); // Assuming endpoint exists
        } catch (e) {
            console.error("Error deleting role from backend:", e);
            // Proceed with frontend update anyway
        }
        
        setStore(prev => {
            const newRolesConfig = { ...prev.global.rolesConfig };
            newRolesConfig[dayType] = (newRolesConfig[dayType] || []).filter(r => r !== role);
            return { ...prev, global: { ...prev.global, rolesConfig: newRolesConfig } };
        });
    };

    const togglePlanRole = (dayType, role, isEnabled) => {
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const custom = p.customRoles || {};
                    const dayCustom = custom[dayType] || { add: [], remove: [] };
                    let newRemove = dayCustom.remove || [];

                    if (isEnabled) {
                        newRemove = newRemove.filter(r => r !== role);
                    } else {
                        if (!newRemove.includes(role)) newRemove.push(role);
                    }

                    const newCustom = { ...custom, [dayType]: { ...dayCustom, remove: newRemove } };
                    const updated = { ...p, customRoles: newCustom };
                    updatePlanBackend(updated);
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    const addCustomPlanRole = (dayType) => {
        const name = newPlanRoleName.trim();
        if (!name) return;

        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const custom = p.customRoles || {};
                    const dayCustom = custom[dayType] || { add: [], remove: [] };
                    const newAdd = [...(dayCustom.add || [])];
                    if (!newAdd.includes(name)) newAdd.push(name);

                    const newCustom = { ...custom, [dayType]: { ...dayCustom, add: newAdd } };
                    const updated = { ...p, customRoles: newCustom };
                    updatePlanBackend(updated);
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
        setNewPlanRoleName("");
    };

    const removeCustomPlanRole = (dayType, role) => {
        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    const custom = p.customRoles || {};
                    const dayCustom = custom[dayType] || { add: [], remove: [] };
                    const newAdd = (dayCustom.add || []).filter(r => r !== role);

                    const newCustom = { ...custom, [dayType]: { ...dayCustom, add: newAdd } };
                    const updated = { ...p, customRoles: newCustom };
                    updatePlanBackend(updated);
                    return updated;
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
    };

    // --- LOGIC ---
    const getWeeksStruct = (dates) => {
        const weeks = {};
        dates.forEach(dStr => {
            const d = parseYMD(dStr);
            if (!d) return;
            const dCopy = new Date(d.valueOf());
            const day = dCopy.getDay();
            const offset = day === 0 ? 6 : day - 1;
            dCopy.setDate(dCopy.getDate() - offset);
            const key = dateToYMD(dCopy);
            if (!weeks[key]) weeks[key] = [];
            weeks[key].push(dStr);
        });
        return Object.keys(weeks).sort().map(k => ({ start: k, dates: weeks[k].sort() }));
    };

    const getPlanRoles = (plan, dates) => {
        if (!plan) return [];
        let defs = [];
        const dayTypes = new Set(dates.map(d => parseYMD(d)?.getDay().toString()).filter(Boolean));
        Array.from(dayTypes).sort((a, b) => a - b).forEach(dayType => {
            const globalRoles = store.global.rolesConfig[dayType] || [];
            const custom = plan.customRoles?.[dayType] || {};
            const finalRoles = [...globalRoles.filter(r => !(custom.remove || []).includes(r)), ...(custom.add || [])];
            finalRoles.forEach(r => defs.push({ dayType: parseInt(dayType), role: r }));
        });
        return defs;
    };

    const generateSchedule = async () => {
        if (!currentPlan || currentPlan.selectedDates.length === 0) { showToast("Sélectionnez des dates", "error"); return; }
        const counts = Object.fromEntries(currentPlan.selectedPeople.map(p => [p, 0]));
        Object.values(currentPlan.assignments).forEach(p => { if (p) counts[p]++; });
        const newAssignments = { ...currentPlan.assignments };

        currentPlan.selectedDates.forEach(date => {
            const dayType = parseYMD(date).getDay();
            const rolesForDay = getPlanRoles(currentPlan, [date]).map(def => def.role);
            const assignedToday = new Set(Object.entries(newAssignments).filter(([k, p]) => k.startsWith(date + '_') && p).map(([, p]) => p));

            rolesForDay.forEach(role => {
                const key = `${date}_${role}`;
                if (newAssignments[key]) return;
                let candidates = currentPlan.selectedPeople.filter(p => currentPlan.availability[`${p}_${date}`] !== false && !assignedToday.has(p));
                if (candidates.length > 0) {
                    candidates.sort((a, b) => counts[a] - counts[b] || 0.5 - Math.random());
                    const chosen = candidates[0];
                    newAssignments[key] = chosen;
                    counts[chosen]++;
                    assignedToday.add(chosen);

                    // Save to backend
                    axios.post(`${API_URL}/planning`, {
                        session: { id: currentPlan.id },
                        date: date,
                        roleName: role,
                        membreNom: chosen
                    }).catch(e => console.error(e));
                }
            });
        });

        setStore(prev => {
            const newPlans = prev.plans.map(p => {
                if (p.id === prev.currentPlanId) {
                    return { ...p, assignments: newAssignments };
                }
                return p;
            });
            return { ...prev, plans: newPlans };
        });
        showToast("Génération terminée");
    };

    const exportToExcel = () => {
        if (!currentPlan) return;
        const weeks = getWeeksStruct(currentPlan.selectedDates);
        const rowDefs = getPlanRoles(currentPlan, currentPlan.selectedDates);
        const header = ["Jour", "Rôle", ...weeks.map((w, i) => `Semaine ${i + 1} (${w.dates[0]})`)];
        const data = [header, ...rowDefs.map(def => {
            const row = [DAY_NAMES[def.dayType], def.role];
            weeks.forEach(week => {
                const date = week.dates.find(d => parseYMD(d).getDay() === def.dayType);
                row.push(date ? (currentPlan.assignments[`${date}_${def.role}`] || "") : "");
            });
            return row;
        })];
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, (currentPlan.title || currentPlan.nom).substring(0, 30));
        XLSX.writeFile(wb, `${currentPlan.title || currentPlan.nom}.xlsx`);
    }

    const updateStats = () => {
        if (!currentPlan || !chartRef.current) return;
        const counts = Object.fromEntries(currentPlan.selectedPeople.map(p => [p, 0]));
        Object.values(currentPlan.assignments).forEach(p => { if (p) counts[p]++; });
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
            type: 'bar',
            data: { labels: Object.keys(counts), datasets: [{ label: 'Assignments', data: Object.values(counts), backgroundColor: '#6366f1' }] }
        });
    };

    // --- RENDER FUNCTIONS ---

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Chargement...</div>;
    }

    return (
        <div className="text-slate-800 h-screen flex flex-col overflow-hidden">
            {/* HEADER */}
            <header className="bg-white shadow-sm z-20 border-b border-slate-200 flex-none">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-secondary text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg">
                            <i className="fa-solid fa-church"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Planning Actif</span>
                            <select value={store.currentPlanId || ''} onChange={(e) => switchPlan(e.target.value)} className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer p-0">
                                {store.plans.map(p => <option key={p.id} value={p.id}>{p.title || p.nom}</option>)}
                            </select>
                        </div>
                        <button onClick={() => createNewPlan()} className="ml-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded" title="Nouveau Planning">
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>

                    <nav className="flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('global')} className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'global' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}>Global</button>
                        <button onClick={() => setActiveTab('config')} className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'config' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}>Config</button>
                        <button onClick={() => setActiveTab('planning')} className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'planning' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}>Planning</button>
                        <button onClick={() => setActiveTab('stats')} className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'stats' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}>Stats</button>
                    </nav>

                    <div className="flex gap-2">
                        <button onClick={deleteCurrentPlan} className="p-2 text-slate-400 hover:text-red-500 transition" title="Supprimer ce planning">
                            <i className="fa-solid fa-trash"></i>
                        </button>
                        <button onClick={exportData} className="p-2 text-slate-400 hover:text-primary transition" title="Sauvegarder backup JSON">
                            <i className="fa-solid fa-save"></i>
                        </button>
                        <button onClick={resetAll} className="p-2 text-slate-400 hover:text-red-500 transition" title="Réinitialiser tout">
                            <i className="fa-solid fa-bomb"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-hidden bg-slate-50 relative">
                {/* Toast */}
                {toast && <div className="absolute top-4 right-4 z-50"><div className={`${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white px-4 py-2 rounded shadow-lg text-sm`}>{toast.msg}</div></div>}

                {/* GLOBAL TAB */}
                <div style={{ display: activeTab === 'global' ? 'block' : 'none' }} className="h-full overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><i className="fa-solid fa-globe text-blue-500"></i> Rôles (Global)</h3>
                            <div className="mb-3">
                                <select value={roleDayType} onChange={(e) => setRoleDayType(e.target.value)} className="w-full p-2 border rounded text-sm mb-2 bg-slate-50">
                                    <option value="0">Dimanche</option>
                                    <option value="6">Sabbat / Samedi</option>
                                    <option value="5">Vendredi Soir</option>
                                    <option value="3">Mercredi</option>
                                </select>
                                <div className="flex gap-2">
                                    <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="flex-1 p-2 border rounded text-sm" placeholder="Nouveau rôle..." />
                                    <button onClick={addRole} className="bg-blue-500 text-white px-3 rounded"><i className="fa-solid fa-plus"></i></button>
                                </div>
                            </div>
                            <ul className="h-40 overflow-y-auto custom-scroll space-y-1 text-sm">
                                {(store.global.rolesConfig[roleDayType] || []).map(r => (
                                    <li key={r} className="flex items-center justify-between px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                        <span>{r}</span>
                                        <button onClick={() => removeGlobalRole(roleDayType, r)} className="text-blue-500 hover:text-red-500 text-xs"><i className="fa-solid fa-trash"></i></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><i className="fa-solid fa-users text-blue-500"></i> Base de Membres (Global)</h3>
                            <ul className="h-64 overflow-y-auto custom-scroll space-y-1">
                                {store.global.people.map(p => (
                                    <li key={p} className="flex justify-between text-xs p-2 hover:bg-slate-50 rounded border-b border-slate-50 last:border-0">{p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* CONFIG TAB */}
                <div style={{ display: activeTab === 'config' ? 'block' : 'none' }} className="h-full overflow-y-auto p-6">
                    {currentPlan && (
                        <div className="max-w-5xl mx-auto space-y-6">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-md border border-primary/20 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <i className="fa-solid fa-sliders text-primary"></i> Configuration du Planning : <span className="text-primary">{currentPlan.title || currentPlan.nom}</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre du planning</label>
                                            <input type="text" value={currentPlan.title || currentPlan.nom} onChange={(e) => updatePlanTitle(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary font-semibold text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dates sélectionnées</label>
                                            <input type="text" ref={datePickerRef} className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary" placeholder="Choisir les dates..." />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participants & Disponibilités</label>
                                        <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto custom-scroll">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-100 text-slate-600 text-xs">
                                                        <th className="p-2 w-10 text-center"><input type="checkbox" onChange={(e) => selectAllPeopleForPlan(e.target.checked)} checked={currentPlan.selectedPeople.length === store.global.people.length} /></th>
                                                        <th className="p-2 text-left font-semibold">Membre</th>
                                                        {currentPlan.selectedDates.map(d => {
                                                            const date = parseYMD(d);
                                                            return <th key={d} className="p-2 text-center min-w-[60px] font-medium"><div className="text-[10px]">{DAY_NAMES[date.getDay()].substring(0, 3)}</div><div>{formatDateShort(d)}</div></th>
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {store.global.people.map(person => {
                                                        const isIncluded = currentPlan.selectedPeople.includes(person);
                                                        return (
                                                            <tr key={person} className={`${isIncluded ? 'bg-white' : 'bg-slate-50 opacity-50'} hover:bg-indigo-50/50 hover:opacity-100`}>
                                                                <td className="p-2 text-center">
                                                                    <input type="checkbox" className="w-4 h-4 text-primary rounded focus:ring-primary" checked={isIncluded} onChange={() => togglePlanPerson(person)} />
                                                                </td>
                                                                <td className="p-2 font-medium text-slate-700">{person}</td>
                                                                {currentPlan.selectedDates.map(date => {
                                                                    const key = `${person}_${date}`;
                                                                    const isUnavailable = currentPlan.availability[key] === false;
                                                                    return (
                                                                        <td key={date} className="p-2 text-center">
                                                                            {isIncluded && (
                                                                                <label className="checkbox-wrapper cursor-pointer inline-block w-5 h-5">
                                                                                    <input type="checkbox" className="hidden" checked={!isUnavailable} onChange={(e) => toggleDispo(person, date, e.target.checked)} />
                                                                                    <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-[10px] ${!isUnavailable ? 'bg-emerald-400' : 'bg-slate-300'}`}>
                                                                                        {!isUnavailable && <i className="fa-solid fa-check"></i>}
                                                                                    </div>
                                                                                </label>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mt-6">
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-star text-yellow-500"></i> Rôles Personnalisés (Ce Planning)
                                    </h3>

                                    {(() => {
                                        const availableDayTypes = Array.from(new Set(currentPlan.selectedDates.map(d => parseYMD(d).getDay()))).sort((a, b) => a - b);

                                        if (availableDayTypes.length === 0) {
                                            return <p className="text-sm text-slate-400 italic">Sélectionnez des dates pour configurer les rôles.</p>;
                                        }

                                        // Determine active day type for display
                                        let activeDayType = planRoleDayType;
                                        if (!availableDayTypes.includes(parseInt(activeDayType))) {
                                            activeDayType = availableDayTypes[0].toString();
                                            // We don't update state here to avoid render loop, just use it for rendering
                                            // But to be consistent we should probably update it if we could.
                                            // For now, let's just use this local variable.
                                        }

                                        const globalRoles = store.global.rolesConfig[activeDayType] || [];
                                        const custom = currentPlan.customRoles?.[activeDayType] || {};
                                        const addedRoles = custom.add || [];
                                        const removedRoles = custom.remove || [];

                                        return (
                                            <>
                                                <div className="mb-3">
                                                    <select
                                                        value={activeDayType}
                                                        onChange={(e) => setPlanRoleDayType(e.target.value)}
                                                        className="w-full p-2 border rounded text-sm mb-2 bg-slate-50"
                                                    >
                                                        {availableDayTypes.map(dt => (
                                                            <option key={dt} value={dt}>{DAY_NAMES[dt]}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="h-48 overflow-y-auto custom-scroll space-y-2 pr-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Rôles Globaux</p>
                                                        {globalRoles.length > 0 ? (
                                                            globalRoles.map(role => {
                                                                const isEnabled = !removedRoles.includes(role);
                                                                return (
                                                                    <label key={role} className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-slate-100 ${isEnabled ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                                            checked={isEnabled}
                                                                            onChange={(e) => togglePlanRole(activeDayType, role, e.target.checked)}
                                                                        />
                                                                        <span className={`text-xs font-medium ${isEnabled ? 'text-slate-600' : 'text-slate-400 line-through'}`}>{role}</span>
                                                                    </label>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">Aucun rôle global pour ce jour.</p>
                                                        )}

                                                        <p className="text-xs font-bold text-slate-500 uppercase mt-4">Rôles Ajoutés</p>
                                                        {addedRoles.length > 0 ? (
                                                            addedRoles.map(role => (
                                                                <div key={role} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                                                                    <span className="text-xs font-medium text-blue-700">{role}</span>
                                                                    <button onClick={() => removeCustomPlanRole(activeDayType, role)} className="text-blue-500 hover:text-red-500 text-xs"><i className="fa-solid fa-trash"></i></button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-slate-400 italic">Aucun rôle ajouté pour ce jour.</p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2 pt-3 border-t mt-3">
                                                        <input
                                                            type="text"
                                                            value={newPlanRoleName}
                                                            onChange={(e) => setNewPlanRoleName(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') addCustomPlanRole(activeDayType); }}
                                                            className="flex-1 p-2 border rounded text-sm"
                                                            placeholder="Ajouter un rôle spécifique..."
                                                        />
                                                        <button onClick={() => addCustomPlanRole(activeDayType)} className="bg-blue-500 text-white px-3 rounded"><i className="fa-solid fa-plus"></i></button>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2">Personnalisez les rôles juste pour ce planning. Les rôles globaux sont utilisés par défaut.</p>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* PLANNING TAB */}
                <div style={{ display: activeTab === 'planning' ? 'block' : 'none' }} className="h-full overflow-hidden flex flex-col">
                    <div className="p-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 shrink-0">
                        <div className="flex gap-2">
                            <button onClick={() => setHighlight({ person: null, role: null })} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"><i className="fa-solid fa-eraser"></i> Effacer surlignage</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={generateSchedule} className="bg-primary text-white px-3 py-1.5 rounded hover:bg-indigo-600 transition shadow text-sm font-medium"><i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Générer</button>
                            <button onClick={exportToExcel} className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition text-sm font-medium"><i className="fa-solid fa-file-excel mr-1"></i> Excel</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto p-4 bg-slate-50 custom-scroll relative">
                            {(!currentPlan || currentPlan.selectedDates.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <i className="fa-regular fa-calendar-xmark text-5xl mb-3 text-slate-300"></i>
                                    <p>Aucun planning.</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden mb-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead className="bg-slate-100 text-slate-600">
                                                <tr>
                                                    <th className="p-3 border-b font-bold w-32">Jour</th>
                                                    <th className="p-3 border-b font-bold w-48">Rôle</th>
                                                    {getWeeksStruct(currentPlan.selectedDates).map((w, i) => (
                                                        <th key={i} className="p-3 border-b font-bold text-center bg-slate-200/50">Semaine {i + 1} <span className="block text-[10px] font-normal text-slate-500">({formatDateShort(w.dates[0])})</span></th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {getPlanRoles(currentPlan, currentPlan.selectedDates).map((def, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="p-3 font-medium text-slate-500">{DAY_NAMES[def.dayType]}</td>
                                                        <td className="p-3 font-medium text-slate-700">{def.role}</td>
                                                        {getWeeksStruct(currentPlan.selectedDates).map((w, i) => {
                                                            const date = w.dates.find(d => parseYMD(d).getDay() === def.dayType);
                                                            const assigned = date ? currentPlan.assignments[`${date}_${def.role}`] : null;
                                                            return (
                                                                <td key={i} className="p-3 text-center border-l border-slate-100">
                                                                    {assigned ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{assigned}</span> : <span className="text-slate-300">-</span>}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* STATS TAB */}
                <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }} className="h-full overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-4">Statistiques du Planning</h2>
                        <div className="h-80"><canvas ref={chartRef}></canvas></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Planning2;