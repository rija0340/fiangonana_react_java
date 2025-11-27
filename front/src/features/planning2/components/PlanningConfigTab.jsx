import React, { useRef, useEffect } from 'react';
import axios from 'axios';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import { usePlanning } from './PlanningStateProvider';

const DAY_NAMES = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Sabbat' };

const formatDateShort = (dStr) => {
  const d = dStr ? new Date(dStr + 'T00:00:00') : null;
  return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
};

const PlanningConfigTab = () => {
  const {
    store,
    currentPlan, // Now comes from context
    activeTab,
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
    setStore
  } = usePlanning();

  const datePickerRef = useRef(null);
  const [editingRole, setEditingRole] = React.useState(null);
  const [editRoleName, setEditRoleName] = React.useState('');

  // Format date string to Date object
  const parseYMD = (dStr) => dStr ? new Date(dStr + 'T00:00:00') : null;

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

  // Initialize flatpickr when currentPlan changes
  useEffect(() => {
    if (datePickerRef.current && currentPlan) {
      const fp = flatpickr(datePickerRef.current, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        locale: French,
        defaultDate: currentPlan.selectedDates,
        closeOnSelect: false, // Ne ferme pas le calendrier après sélection
        onChange: (dates) => {
          const newDates = dates.map(date => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }).sort();

          // Update the current plan with new dates in the store
          if (currentPlan) {
            setStore(prev => ({
              ...prev,
              plans: prev.plans.map(p =>
                p.id === currentPlan.id
                  ? { ...p, selectedDates: newDates }
                  : p
              )
            }));

            // Also save to backend
            axios.put(`http://localhost:8082/api/planning/sessions/${currentPlan.id}`, {
              ...currentPlan,
              selectedDates: newDates,
              customRoles: typeof currentPlan.customRoles === 'string' ? currentPlan.customRoles : JSON.stringify(currentPlan.customRoles),
              selectedPeople: currentPlan.selectedPeople || []
            }, {
              headers: {
                'Content-Type': 'application/json'
              }
            }).catch(e => console.error("Auto-save failed", e));
          }
        },
      });
      return () => fp.destroy();
    }
  }, [currentPlan, setStore]);

  if (!currentPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
        <i className="fa-regular fa-calendar-plus text-6xl mb-4 text-slate-300"></i>
        <h3 className="text-xl font-bold text-slate-600 mb-2">Aucun planning sélectionné</h3>
        <p className="text-slate-500 text-center mb-6 max-w-md">
          Commencez par créer un nouveau planning en cliquant sur le bouton "Nouveau" dans la barre d'outils.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-sliders text-primary"></i> Configuration du Planning : <span className="text-primary">{currentPlan.title || currentPlan.nom}</span>
          </h3>
          <div className="text-sm text-slate-500">
            <i className="fa-solid fa-calendar-days mr-1"></i>
            {currentPlan.selectedDates?.length || 0} jours sélectionnés
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: General Info & Roles */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre du planning</label>
              <input
                type="text"
                value={currentPlan.title || currentPlan.nom}
                onChange={(e) => updatePlanTitle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary font-semibold text-slate-700 mb-4"
              />

              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dates sélectionnées</label>
              <input
                type="text"
                ref={datePickerRef}
                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary"
                placeholder="Choisir les dates..."
              />
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-star text-yellow-500"></i> Rôles Personnalisés
              </h3>

              {(() => {
                const availableDayTypes = Array.from(new Set((currentPlan.selectedDates || []).map(d => parseYMD(d).getDay()))).sort((a, b) => a - b);

                if (availableDayTypes.length === 0) {
                  return <p className="text-sm text-slate-400 italic">Sélectionnez des dates pour configurer les rôles.</p>;
                }

                // Determine active day type for display
                let activeDayType = planRoleDayType;
                if (!availableDayTypes.includes(parseInt(activeDayType))) {
                  activeDayType = availableDayTypes[0].toString();
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
                      <div className="h-64 overflow-y-auto custom-scroll space-y-2 pr-2">
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
                              {editingRole && editingRole.role === role && editingRole.dayType === activeDayType ? (
                                <div className="flex gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editRoleName}
                                    onChange={(e) => setEditRoleName(e.target.value)}
                                    className="flex-1 p-1 text-xs border rounded"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        renameCustomPlanRole(activeDayType, role, editRoleName);
                                        setEditingRole(null);
                                      } else if (e.key === 'Escape') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingRole(null);
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    renameCustomPlanRole(activeDayType, role, editRoleName);
                                    setEditingRole(null);
                                  }} className="text-green-600 hover:text-green-800 text-xs px-1"><i className="fa-solid fa-check"></i></button>
                                  <button onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingRole(null);
                                  }} className="text-red-500 hover:text-red-700 text-xs px-1"><i className="fa-solid fa-times"></i></button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-medium text-blue-700">{role}</span>
                                  <div className="">
                                    <button onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingRole({ role, dayType: activeDayType });
                                      setEditRoleName(role);
                                    }} className="text-blue-500 hover:text-blue-700 text-xs" title="Modifier">&#x270E;</button>
                                    <button onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeCustomPlanRole(activeDayType, role);
                                    }} className="text-blue-500 hover:text-red-500 text-xs" title="Supprimer">&#x1F5D1;</button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">Aucun rôle ajouté pour ce jour.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPlanRoleName}
                          onChange={(e) => setNewPlanRoleName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') addCustomPlanRole(activeDayType, e.target.value); }}
                          className="flex-1 p-2 border rounded text-sm"
                          placeholder="Ajouter un rôle..."
                        />
                        <button onClick={() => addCustomPlanRole(activeDayType, newPlanRoleName)} className="bg-blue-500 text-white px-3 rounded"><i className="fa-solid fa-plus"></i></button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Participants Table */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Participants & Disponibilités
                <span className="ml-2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                  {(store.global.people || []).filter(p => (currentPlan.selectedPeople || []).includes(p.person_code || p.id)).length}
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newAvailability = { ...currentPlan.availability };
                    (currentPlan.selectedPeople || []).forEach(personId => {
                      (currentPlan.selectedDates || []).forEach(date => {
                        const key = `${personId}_${date}`;
                        newAvailability[key] = true;
                      });
                    });

                    setStore(prev => ({
                      ...prev,
                      plans: prev.plans.map(p =>
                        p.id === currentPlan.id
                          ? { ...p, availability: newAvailability }
                          : p
                      )
                    }));
                  }}
                  className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded flex items-center gap-1 transition"
                  title="Marquer tous comme disponibles"
                >
                  <i className="fa-solid fa-check-double"></i>
                  <span>Tous dispos</span>
                </button>
                <button
                  onClick={() => {
                    const newAvailability = { ...currentPlan.availability };
                    (currentPlan.selectedPeople || []).forEach(personId => {
                      (currentPlan.selectedDates || []).forEach(date => {
                        const key = `${personId}_${date}`;
                        newAvailability[key] = false;
                      });
                    });

                    setStore(prev => ({
                      ...prev,
                      plans: prev.plans.map(p =>
                        p.id === currentPlan.id
                          ? { ...p, availability: newAvailability }
                          : p
                      )
                    }));
                  }}
                  className="text-xs bg-slate-400 hover:bg-slate-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition"
                  title="Marquer tous comme indisponibles"
                >
                  <i className="fa-solid fa-xmark"></i>
                  <span>Tous indispos</span>
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto custom-scroll h-[600px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 text-slate-600 text-xs shadow-sm">
                    <th className="p-2 w-10 text-center bg-slate-100">
                      <i className="fa-solid fa-user-check"></i>
                    </th>
                    <th className="p-2 text-left font-semibold bg-slate-100">Membre Sélectionné</th>
                    {(currentPlan.selectedDates || []).map(d => {
                      const date = parseYMD(d);
                      return (
                        <th key={d} className="p-2 text-center min-w-[60px] font-medium bg-slate-100">
                          <div className="text-[10px]">{DAY_NAMES[date.getDay()].substring(0, 3)}</div>
                          <div>{formatDateShort(d)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(store.global.people || [])
                    .filter(person => {
                      const personId = person.person_code || person.id;
                      return (currentPlan.selectedPeople || []).includes(personId);
                    })
                    .map(person => {
                      const personId = person.person_code || person.id;
                      return (
                        <tr
                          key={personId}
                          className="bg-white hover:bg-indigo-50/50"
                        >
                          <td className="p-2 text-center">
                            <i className="fa-solid fa-check text-emerald-500"></i>
                          </td>
                          <td className="p-2 font-medium text-slate-700">{person.prenom || person.nom || person.person_code}</td>
                          {(currentPlan.selectedDates || []).map(date => {
                            const key = `${personId}_${date}`;
                            const isAvailable = currentPlan.availability?.[key] === true;
                            return (
                              <td key={date} className="p-2 text-center">
                                <label className="checkbox-wrapper cursor-pointer inline-block w-5 h-5">
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isAvailable}
                                    onChange={(e) => toggleDispo(personId, date, e.target.checked)}
                                  />
                                  <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-[10px] ${isAvailable ? 'bg-emerald-400' : 'bg-slate-300'}`}>
                                    {isAvailable && <i className="fa-solid fa-check"></i>}
                                  </div>
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              💡 Par défaut, tous les membres sont indisponibles. Cochez les cases pour les rendre disponibles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningConfigTab;