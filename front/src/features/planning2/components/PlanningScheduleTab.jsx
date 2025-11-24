import React, { useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { usePlanning } from './PlanningStateProvider';

const DAY_NAMES = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Sabbat' };

const PlanningScheduleTab = () => {
  const {
    store,
    currentPlan,
    highlight,
    setHighlight,
    setToast,
    setStore
  } = usePlanning();



  // Format date string to Date object
  const parseYMD = (dStr) => dStr ? new Date(dStr + 'T00:00:00') : null;

  // Format date for display
  const formatDateShort = (dStr) => {
    const d = parseYMD(dStr);
    return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
  };

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

  const dateToYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  // Helper function to get person name from ID
  // Priority: prenom > nom > person_code > personId
  const getPersonName = (personId) => {
    if (!personId) return null;
    const person = store.global.people.find(p => (p.id || p.person_code) === personId);
    if (!person) return personId;

    // Return prenom if available, otherwise nom, otherwise person_code, otherwise personId
    return person.prenom || person.nom || person.person_code || personId;
  };

  // Generate schedule function
  const generateSchedule = async () => {
    if (!currentPlan || currentPlan.selectedDates.length === 0) {
      setToast({ msg: "Sélectionnez des dates", type: "error" });
      return;
    }

    const counts = Object.fromEntries(currentPlan.selectedPeople.map(p => [p, 0]));
    Object.values(currentPlan.assignments || {}).forEach(p => {
      if (p) counts[p]++;
    });

    const newAssignments = { ...(currentPlan.assignments || {}) };

    currentPlan.selectedDates.forEach(date => {
      const dayType = parseYMD(date).getDay();
      const rolesForDay = getPlanRoles(currentPlan, [date]).map(def => def.role);
      const assignedToday = new Set(Object.entries(newAssignments).filter(([k, p]) => k.startsWith(date + '_') && p).map(([, p]) => p));

      rolesForDay.forEach(role => {
        const key = `${date}_${role}`;
        if (newAssignments[key]) return;
        let candidates = currentPlan.selectedPeople.filter(p =>
          currentPlan.availability?.[`${p}_${date}`] !== false && !assignedToday.has(p)
        );

        if (candidates.length > 0) {
          candidates.sort((a, b) => counts[a] - counts[b] || 0.5 - Math.random());
          const chosen = candidates[0];
          newAssignments[key] = chosen;
          counts[chosen]++;
          assignedToday.add(chosen);

          // Save to backend
          import('axios').then(axios =>
            axios.default.post('http://localhost:8082/api/planning', {
              session: { id: currentPlan.id },
              date: date,
              roleName: role,
              membreNom: chosen
            }, {
              headers: {
                'Content-Type': 'application/json'
              }
            }).catch(e => console.error(e))
          );
        }
      });
    });

    // Update the current plan with new assignments in the store
    if (currentPlan) {
      setStore(prev => ({
        ...prev,
        plans: prev.plans.map(p =>
          p.id === currentPlan.id
            ? { ...p, assignments: newAssignments }
            : p
        )
      }));
    }

    setToast({ msg: "Génération terminée", type: "info" });
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!currentPlan) return;

    const weeks = getWeeksStruct(currentPlan.selectedDates);
    const rowDefs = getPlanRoles(currentPlan, currentPlan.selectedDates);
    const header = ["Jour", "Rôle", ...weeks.map((w, i) => `Semaine ${i + 1} (${w.dates[0]})`)];

    const data = [header, ...rowDefs.map(def => {
      const row = [DAY_NAMES[def.dayType], def.role];
      weeks.forEach(week => {
        const date = week.dates.find(d => parseYMD(d).getDay() === def.dayType);
        const assignedId = date ? currentPlan.assignments?.[`${date}_${def.role}`] : null;
        row.push(assignedId ? (getPersonName(assignedId) || "") : "");
      });
      return row;
    })];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (currentPlan.title || currentPlan.nom).substring(0, 30));
    XLSX.writeFile(wb, `${currentPlan.title || currentPlan.nom}.xlsx`);
  };



  // Render schedule table
  const renderScheduleTable = () => {
    if (!currentPlan || currentPlan.selectedDates.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <i className="fa-regular fa-calendar-xmark text-5xl mb-3 text-slate-300"></i>
          <p>Aucun planning.</p>
        </div>
      );
    }

    return (
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
                    const assignedId = date ? currentPlan.assignments?.[`${date}_${def.role}`] : null;
                    const assignedName = getPersonName(assignedId);

                    // Check if this cell should be highlighted
                    const isHighlighted = highlight && (
                      (highlight.person === assignedId && (!highlight.role || highlight.role === def.role)) ||
                      (highlight.role === def.role && !highlight.person)
                    );

                    return (
                      <td
                        key={i}
                        className={`p-3 text-center border-l border-slate-100 transition ${isHighlighted ? 'bg-yellow-100' : ''}`}
                      >
                        {assignedName ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{assignedName}</span> : <span className="text-slate-300">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Matrix Assistant (Realtime)
  const renderMatrixAssistant = () => {
    if (!currentPlan || currentPlan.selectedDates.length === 0) {
      return null;
    }

    const assignments = currentPlan.assignments || {};
    const roleDefs = getPlanRoles(currentPlan, currentPlan.selectedDates);

    // Build stats: { personId: { roleName: count, total: count } }
    const peopleStats = {};
    (currentPlan.selectedPeople || []).forEach(p => {
      peopleStats[p] = { total: 0 };
    });

    Object.entries(assignments).forEach(([key, personId]) => {
      if (!personId) return;
      const roleName = key.split('_')[1];
      if (!peopleStats[personId]) peopleStats[personId] = { total: 0 };
      if (!peopleStats[personId][roleName]) peopleStats[personId][roleName] = 0;
      peopleStats[personId][roleName]++;
      peopleStats[personId].total++;
    });

    const sortedPeople = [...(currentPlan.selectedPeople || [])].sort((a, b) => {
      const nameA = getPersonName(a) || '';
      const nameB = getPersonName(b) || '';
      return nameA.localeCompare(nameB);
    });

    return (
      <div className="mt-4 mb-4 mr-4 ml-4 bg-white border-t border-slate-200 flex flex-col shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="p-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center px-4">
          <h3 className="font-bold text-slate-700 text-xs uppercase flex items-center gap-2">
            <i className="fa-solid fa-robot text-secondary"></i> Assistant Matriciel (Temps Réel)
          </h3>
          <span className="text-[10px] text-slate-400">Cliquez sur un nom ou un chiffre pour surligner</span>
        </div>
        <div className="overflow-x-auto custom-scroll p-4">
          <table className="w-full text-xs text-center border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr className="text-slate-500 font-medium">
                <th className="p-1 px-2 bg-slate-50 text-left sticky left-0 z-20 border-r border-b w-28 text-xs">Membre</th>
                {roleDefs.map((def, idx) => {
                  const dayShort = DAY_NAMES[def.dayType].substring(0, 3);
                  const headerText = `${dayShort} - ${def.role}`;
                  return (
                    <th
                      key={idx}
                      className="p-1 min-w-[110px] bg-slate-50 border-b font-medium text-[10px] uppercase whitespace-nowrap"
                      title={`${DAY_NAMES[def.dayType]} - ${def.role}`}
                    >
                      {headerText}
                    </th>
                  );
                })}
                <th className="p-1 px-2 bg-slate-100 border-b w-14 font-bold text-slate-700 text-xs">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPeople.map(personId => {
                const stats = peopleStats[personId] || { total: 0 };
                const personName = getPersonName(personId);
                return (
                  <tr key={personId}>
                    <td
                      className="p-1 px-2 text-left font-medium text-slate-700 border-r border-b bg-white sticky left-0 cursor-pointer hover:text-primary text-xs whitespace-nowrap"
                      onClick={() => setHighlight({ person: personId, role: null })}
                    >
                      {personName}
                    </td>
                    {roleDefs.map((def, idx) => {
                      const count = stats[def.role] || 0;
                      const cls = count > 0 ? 'font-bold text-blue-600' : 'text-slate-300';
                      return (
                        <td
                          key={idx}
                          className={`border-b border-slate-100 p-0 h-8 cursor-pointer hover:bg-yellow-50 transition ${cls}`}
                          onClick={() => setHighlight({ person: personId, role: def.role })}
                        >
                          {count || '-'}
                        </td>
                      );
                    })}
                    <td className="font-bold text-slate-800 bg-slate-50 border-b">{stats.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Current tab is handled by parent, so we just render the content
  return (
    <>
      <div className="p-3 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setHighlight({ person: null, role: null })}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"
          >
            <i className="fa-solid fa-eraser"></i> Effacer surlignage
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateSchedule}
            className="bg-primary text-white px-3 py-1.5 rounded hover:bg-indigo-600 transition shadow text-sm font-medium"
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Générer
          </button>
          <button
            onClick={exportToExcel}
            className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 transition text-sm font-medium"
          >
            <i className="fa-solid fa-file-excel mr-1"></i> Excel
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-4 bg-slate-50 custom-scroll relative">
          {renderScheduleTable()}
        </div>
        {renderMatrixAssistant()}
      </div>
    </>
  );
};

export default PlanningScheduleTab;