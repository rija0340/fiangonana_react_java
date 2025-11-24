import React, { useRef, useEffect } from 'react';
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
    currentPlan,
    activeTab,
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
    toggleDispo
  } = usePlanning();

  const datePickerRef = useRef(null);

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
        onChange: (dates) => {
          const newDates = dates.map(date => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }).sort();

          // Update the current plan with new dates
          if (currentPlan) {
            const updatedPlan = { ...currentPlan, selectedDates: newDates };
            import('axios').then(axios => {
              axios.default.put(`http://localhost:8082/api/planning/sessions/${currentPlan.id}`, {
                ...currentPlan,
                selectedDates: newDates,
                customRoles: typeof currentPlan.customRoles === 'string' ? currentPlan.customRoles : JSON.stringify(currentPlan.customRoles),
                selectedPeople: currentPlan.selectedPeople || []
              }).catch(e => console.error("Auto-save failed", e));
            });
          }
        },
      });
      return () => fp.destroy();
    }
  }, [currentPlan]);

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
              <input
                type="text"
                value={currentPlan.title || currentPlan.nom}
                onChange={(e) => updatePlanTitle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dates sélectionnées</label>
              <input
                type="text"
                ref={datePickerRef}
                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary"
                placeholder="Choisir les dates..."
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participants & Disponibilités</label>
            <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto custom-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs">
                    <th className="p-2 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => selectAllPeopleForPlan(e.target.checked)}
                        checked={currentPlan.selectedPeople.length === store.global.people.length}
                      />
                    </th>
                    <th className="p-2 text-left font-semibold">Membre</th>
                    {currentPlan.selectedDates.map(d => {
                      const date = parseYMD(d);
                      return (
                        <th key={d} className="p-2 text-center min-w-[60px] font-medium">
                          <div className="text-[10px]">{DAY_NAMES[date.getDay()].substring(0, 3)}</div>
                          <div>{formatDateShort(d)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {store.global.people
                    .map(person => {
                      const isIncluded = currentPlan.selectedPeople.includes(person.id || person.person_code);
                      return (
                        <tr
                          key={person.id || person.person_code}
                          className={`${isIncluded ? 'bg-white' : 'bg-slate-50 opacity-50'} hover:bg-indigo-50/50 hover:opacity-100`}
                        >
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-primary rounded focus:ring-primary"
                              checked={isIncluded}
                              onChange={() => togglePlanPerson(person.id || person.person_code)}
                            />
                          </td>
                          <td className="p-2 font-medium text-slate-700">{person.nom || person.person_code}</td>
                          {currentPlan.selectedDates.map(date => {
                            const key = `${person.id || person.person_code}_${date}`;
                            const isUnavailable = currentPlan.availability?.[key] === false;
                            return (
                              <td key={date} className="p-2 text-center">
                                {isIncluded && (
                                  <label className="checkbox-wrapper cursor-pointer inline-block w-5 h-5">
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={!isUnavailable}
                                      onChange={(e) => toggleDispo(person.id || person.person_code, date, e.target.checked)}
                                    />
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

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPlanRoleName}
                      onChange={(e) => setNewPlanRoleName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCustomPlanRole(activeDayType, e.target.value); }}
                      className="flex-1 p-2 border rounded text-sm"
                      placeholder="Ajouter un rôle spécifique..."
                    />
                    <button onClick={() => addCustomPlanRole(activeDayType, newPlanRoleName)} className="bg-blue-500 text-white px-3 rounded"><i className="fa-solid fa-plus"></i></button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Personnalisez les rôles juste pour ce planning. Les rôles globaux sont utilisés par défaut.</p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PlanningConfigTab;