import React, { useEffect } from 'react';
import axios from 'axios';
import PlanningGlobalTab from './components/PlanningGlobalTab';
import PlanningConfigTab from './components/PlanningConfigTab';
import PlanningScheduleTab from './components/PlanningScheduleTab';
import StatsTab from './components/StatsTab';
import { PlanningStateProvider, usePlanning } from './components/PlanningStateProvider';

const Planning2Content = () => {
    const {
        store,
        currentPlan, // Now comes from context
        activeTab,
        setActiveTab,
        toast,
        setToast,
        loading,
        switchPlan,
        deletePlan,
        addPlan,
        loadPlans
    } = usePlanning();

    // Load plans on component mount
    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    // Set the first plan as current if none is selected and plans are available
    useEffect(() => {
        if (store.plans.length > 0 && !store.currentPlanId) {
            switchPlan(store.plans[0].id);
        }
    }, [store.plans, store.currentPlanId, switchPlan]);

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
                            {store.plans.length > 0 ? (
                                <select
                                    value={store.currentPlanId || ''}
                                    onChange={(e) => switchPlan(Number(e.target.value))}
                                    className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer p-0"
                                >
                                    {store.plans.map(p => <option key={p.id} value={p.id}>{p.title || p.nom}</option>)}
                                </select>
                            ) : (
                                <span className="text-sm font-bold text-slate-400 italic">Aucun planning</span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                const planName = prompt("Entrez le nom du nouveau planning:");
                                if (planName) {
                                    // Create new plan
                                    const today = new Date();
                                    const defaultDates = [];
                                    for (let i = 0; i < 4; i++) {
                                        const nextSunday = new Date(today);
                                        nextSunday.setDate(today.getDate() + (7 + 0 - today.getDay()) % 7 + (i * 7));
                                        const y = nextSunday.getFullYear();
                                        const m = String(nextSunday.getMonth() + 1).padStart(2, '0');
                                        const d = String(nextSunday.getDate()).padStart(2, '0');
                                        defaultDates.push(`${y}-${m}-${d}`);
                                    }

                                    axios.post('http://localhost:8082/api/planning/sessions', {
                                        nom: planName,
                                        description: "Nouveau planning",
                                        selectedDates: defaultDates,
                                        customRoles: JSON.stringify({}),
                                        selectedPeople: store.global.people.map(m => m.id) // Use the global selected people
                                    }, {
                                        headers: {
                                            'Content-Type': 'application/json'
                                        }
                                    })
                                        .then(res => {
                                            const createdPlan = res.data;
                                            const newPlan = {
                                                ...createdPlan,
                                                selectedPeople: store.global.people.map(m => m.id), // Include global selected people
                                                selectedDates: defaultDates,
                                                customRoles: {},
                                                availability: {},
                                                assignments: {}
                                            };
                                            addPlan(newPlan);
                                            // Switch to the newly created plan
                                            switchPlan(newPlan.id);
                                            setToast({ msg: "Nouveau planning créé", type: 'info' });
                                        })
                                        .catch(e => {
                                            console.error("Erreur détaillée:", e);
                                            let errorMsg = "Erreur inconnue";
                                            if (e.response) {
                                                errorMsg = e.response.data.message || e.response.statusText || "Erreur serveur";
                                            } else if (e.request) {
                                                errorMsg = "Erreur réseau - impossible de contacter le serveur";
                                            } else {
                                                errorMsg = e.message || "Erreur de configuration";
                                            }
                                            setToast({ msg: `Erreur: ${errorMsg}`, type: 'error' });
                                        });
                                }
                            }}
                            className="ml-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1"
                            title="Nouveau Planning"
                        >
                            <i className="fa-solid fa-plus"></i>
                            <span>Créer</span>
                        </button>
                    </div>

                    <nav className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'global' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}
                        >
                            Global
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'config' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}
                        >
                            Config
                        </button>
                        <button
                            onClick={() => setActiveTab('planning')}
                            className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'planning' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}
                        >
                            Planning
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-600 ${activeTab === 'stats' ? 'active-tab bg-white shadow-sm text-primary' : ''}`}
                        >
                            Stats
                        </button>
                    </nav>

                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (currentPlan && window.confirm("Supprimer définitivement ce planning ?")) {
                                    try {
                                        await axios.delete(`http://localhost:8082/api/planning/sessions/${currentPlan.id}`);
                                        deletePlan(currentPlan.id);
                                        setToast({ msg: "Planning supprimé", type: 'info' });
                                    } catch (e) {
                                        console.error(e);
                                        setToast({ msg: "Erreur suppression", type: 'error' });
                                    }
                                }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition"
                            title="Supprimer ce planning"
                        >
                            <i className="fa-solid fa-trash"></i>
                        </button>
                        <button
                            onClick={() => {
                                // Export data as JSON
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store));
                                const a = document.createElement('a');
                                a.href = dataStr;
                                a.download = "plandivin_backup.json";
                                a.click();
                            }}
                            className="p-2 text-slate-400 hover:text-primary transition"
                            title="Sauvegarder backup JSON"
                        >
                            <i className="fa-solid fa-save"></i>
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm("ATTENTION: Cela va effacer toutes les données et plannings. Continuer ?")) {
                                    axios.delete('http://localhost:8082/api/planning/reset')
                                        .then(() => {
                                            window.location.reload();
                                        })
                                        .catch(e => console.error(e));
                                }
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition"
                            title="Réinitialiser tout"
                        >
                            <i className="fa-solid fa-bomb"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-hidden bg-slate-50 relative">
                {/* Toast */}
                {toast && (
                    <div className="absolute top-4 right-4 z-50">
                        <div className={`${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white px-4 py-2 rounded shadow-lg text-sm`}>
                            {toast.msg}
                        </div>
                    </div>
                )}

                {/* Render appropriate tab */}
                <div className="h-full overflow-y-auto p-6">
                    {activeTab === 'global' && <PlanningGlobalTab />}
                    {activeTab === 'config' && <PlanningConfigTab />}
                    {activeTab === 'planning' && <PlanningScheduleTab />}
                    {activeTab === 'stats' && <StatsTab />}
                </div>
            </main>
        </div>
    );
};

const Planning2 = () => {
    return (
        <PlanningStateProvider>
            <Planning2Content />
        </PlanningStateProvider>
    );
};

export default Planning2;