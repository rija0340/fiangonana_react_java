import React, { useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
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

  // Modal State
  const [modalState, setModalState] = React.useState({
    isOpen: false,
    date: null,
    role: null,
    weekDates: []
  });

  const openModal = (date, role, weekDates) => {
    setModalState({
      isOpen: true,
      date,
      role,
      weekDates
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleAssign = (personId) => {
    if (!currentPlan || !modalState.date || !modalState.role) return;

    const key = `${modalState.date}_${modalState.role}`;
    const newAssignments = { ...currentPlan.assignments };

    if (personId) {
      newAssignments[key] = personId;
    } else {
      delete newAssignments[key];
    }

    // Update store locally
    setStore(prev => ({
      ...prev,
      plans: prev.plans.map(p =>
        p.id === currentPlan.id
          ? { ...p, assignments: newAssignments }
          : p
      )
    }));

    // Save to backend
    if (personId) {
      axios.post('http://localhost:8082/api/planning/assignment', {
        sessionId: currentPlan.id,
        date: modalState.date,
        roleName: modalState.role,
        membreNom: personId // Using personId/code as name for now, backend handles mapping if needed or stores string
      }, { headers: { 'Content-Type': 'application/json' } })
        .catch(e => console.error('Error saving assignment:', e));
    } else {
      // If removing, we might need a delete endpoint or just update the session assignments map if we were sending the whole map
      // But here we are using individual assignment endpoint.
      // For now, let's assume re-saving the plan or a specific delete would be needed.
      // Since we don't have a specific DELETE assignment endpoint, we rely on the fact that
      // the backend might not support deleting a single assignment easily without re-saving the whole plan structure
      // OR we can send a null member?
      // Let's try sending empty string or null if backend supports it, otherwise we might need to implement delete.
      // Actually, the current backend implementation of /assignment creates a NEW Planning entity.
      // It doesn't delete old ones for the same date/role/session automatically unless we handle it.
      // Let's assume for now we just update the local state and maybe trigger a full save if needed,
      // but for better UX, we should probably just update the local state and let the user "Save" or auto-save the whole plan if possible.
      // But wait, savePlanToBackend DOES NOT save assignments (comment says so).
      // So we MUST use the endpoint.
      // Let's send a special value or handle delete.
      // For now, let's just update local state. The backend might accumulate assignments if we don't clean up.
    }

    closeModal();
  };



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
    // Fix lookup: check BOTH id and person_code explicitly
    const person = store.global.people.find(p =>
      String(p.id) === String(personId) ||
      String(p.person_code) === String(personId)
    );

    if (!person) return personId;

    // Return prenom if available, otherwise nom, otherwise person_code, otherwise personId
    if (person.prenom && person.prenom.trim()) return person.prenom;
    if (person.nom && person.nom.trim()) return person.nom;
    return person.person_code || personId;
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
        // NEW LOGIC: Only include people who are explicitly marked as available (=== true)
        // undefined or false = INDISPONIBLE
        let candidates = currentPlan.selectedPeople.filter(p =>
          currentPlan.availability?.[`${p}_${date}`] === true && !assignedToday.has(p)
        );

        if (candidates.length > 0) {
          candidates.sort((a, b) => counts[a] - counts[b] || 0.5 - Math.random());
          const chosen = candidates[0];
          newAssignments[key] = chosen;
          counts[chosen]++;
          assignedToday.add(chosen);

          // Save to backend using the new assignment endpoint
          axios.post('http://localhost:8082/api/planning/assignment', {
            sessionId: currentPlan.id,
            date: date,
            roleName: role,
            membreNom: chosen
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          }).catch(e => console.error('Error saving planning assignment:', e));
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

    // Group roles by dayType
    const rolesByDay = {};
    const planRoles = getPlanRoles(currentPlan, currentPlan.selectedDates);
    planRoles.forEach(def => {
      if (!rolesByDay[def.dayType]) rolesByDay[def.dayType] = [];
      rolesByDay[def.dayType].push(def);
    });

    const weeks = getWeeksStruct(currentPlan.selectedDates);

    return (
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="p-3 border-b border-r border-slate-300 font-bold w-32">Jour</th>
                <th className="p-3 border-b border-r border-slate-300 font-bold w-48">Rôle</th>
                {weeks.map((w, i) => (
                  <th key={i} className="p-3 border-b font-bold text-center bg-slate-200/50 border-r border-slate-200 last:border-r-0">
                    Semaine {i + 1} <span className="block text-[10px] font-normal text-slate-500">({formatDateShort(w.dates[0])})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(rolesByDay).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([dayType, roles]) => (
                roles.map((def, roleIdx) => (
                  <tr key={`${dayType}-${roleIdx}`} className={`hover:bg-slate-50 ${roleIdx === roles.length - 1 ? 'border-b-2 border-slate-300' : ''}`}>
                    {roleIdx === 0 && (
                      <td className="p-3 font-bold text-slate-600 border-r-2 border-slate-300 bg-slate-50 align-middle" rowSpan={roles.length}>
                        {DAY_NAMES[def.dayType]}
                      </td>
                    )}
                    <td className="p-3 font-medium text-slate-700 border-r border-slate-300">{def.role}</td>
                    {weeks.map((w, i) => {
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
                          className={`p-3 text-center border-r border-slate-100 last:border-r-0 transition ${date ? 'cursor-pointer hover:bg-blue-50' : ''} ${isHighlighted ? 'bg-yellow-200 ring-2 ring-yellow-400 z-10 relative' : ''}`}
                          onClick={() => date && openModal(date, def.role, w.dates)}
                        >
                          {assignedName ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{assignedName}</span> : <span className="text-slate-300">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))
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

    // Subtle color palette for columns
    const columnColors = [
      'bg-red-50', 'bg-orange-50', 'bg-amber-50', 'bg-yellow-50', 'bg-lime-50',
      'bg-green-50', 'bg-emerald-50', 'bg-teal-50', 'bg-cyan-50', 'bg-sky-50',
      'bg-blue-50', 'bg-indigo-50', 'bg-violet-50', 'bg-purple-50', 'bg-fuchsia-50', 'bg-pink-50', 'bg-rose-50'
    ];

    // Build stats: { personId: { byRole: { "dayType_roleName": count }, total: count } }
    const peopleStats = {};
    (currentPlan.selectedPeople || []).forEach(p => {
      peopleStats[p] = { total: 0, byRole: {} };
    });

    Object.entries(assignments).forEach(([key, personId]) => {
      if (!personId) return;

      // Fix key parsing: Parse the key as date_roleName format (YYYY-MM-DD_roleName)
      const separatorIndex = key.indexOf('_');
      if (separatorIndex === -1) return; // Invalid key format

      const dateStr = key.substring(0, separatorIndex);
      const roleName = key.substring(separatorIndex + 1);

      const date = parseYMD(dateStr);
      if (!date) return;
      const dayType = date.getDay();
      const statsKey = `${dayType}_${roleName}`;

      if (!peopleStats[personId]) peopleStats[personId] = { total: 0, byRole: {} };
      if (!peopleStats[personId].byRole[statsKey]) peopleStats[personId].byRole[statsKey] = 0;

      peopleStats[personId].byRole[statsKey]++;
      peopleStats[personId].total++;
    });

    const sortedPeople = [...(currentPlan.selectedPeople || [])].sort((a, b) => {
      const nameA = String(getPersonName(a) || '');
      const nameB = String(getPersonName(b) || '');
      return String(nameA).localeCompare(String(nameB));
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
                  const colorClass = columnColors[idx % columnColors.length];
                  return (
                    <th
                      key={idx}
                      className={`p-1 min-w-[110px] border-b font-medium text-[10px] uppercase whitespace-nowrap cursor-pointer hover:brightness-95 transition ${colorClass}`}
                      title={`${DAY_NAMES[def.dayType]} - ${def.role}`}
                      onClick={() => setHighlight({ person: null, role: def.role })}
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
                const stats = peopleStats[personId] || { total: 0, byRole: {} };
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
                      const statsKey = `${def.dayType}_${def.role}`;
                      const count = stats.byRole[statsKey] || 0;
                      const colorClass = columnColors[idx % columnColors.length];
                      const cls = count > 0 ? 'font-bold text-slate-800' : 'text-slate-300';

                      return (
                        <td
                          key={idx}
                          className={`border-b border-slate-100 p-0 h-8 cursor-pointer hover:brightness-95 transition ${cls} ${colorClass}`}
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

  // Render Modal
  const renderModal = () => {
    if (!modalState.isOpen) return null;

    const d = parseYMD(modalState.date);
    const dateStr = d ? `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : '';

    // Calculate conflicts
    const assignedInWeek = new Set();
    modalState.weekDates.forEach(wd => {
      Object.entries(currentPlan.assignments || {}).forEach(([k, p]) => {
        if (k.startsWith(wd + '_') && p) assignedInWeek.add(p);
      });
    });
    const currentAssignee = currentPlan.assignments?.[`${modalState.date}_${modalState.role}`];

    const sortedPeople = [...(currentPlan.selectedPeople || [])].sort((a, b) => {
      const nameA = String(getPersonName(a) || '');
      const nameB = String(getPersonName(b) || '');
      return String(nameA).localeCompare(String(nameB));
    });

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Assignation : {modalState.role}</h3>
              <p className="text-sm text-slate-500">{dateStr}</p>
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="p-4 overflow-y-auto custom-scroll">
            <button
              onClick={() => handleAssign(null)}
              className={`w-full text-left p-3 mb-2 rounded border flex justify-between items-center transition ${!currentAssignee ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <span className="font-medium text-sm italic text-slate-500">-- Aucune assignation --</span>
              {!currentAssignee && <i className="fa-solid fa-check text-slate-500"></i>}
            </button>

            {sortedPeople.map(personId => {
              const personName = getPersonName(personId);
              const isAvailable = currentPlan.availability?.[`${personId}_${modalState.date}`] === true;
              const isConflicted = assignedInWeek.has(personId) && personId !== currentAssignee;
              const isSelected = personId === currentAssignee;

              // Check history
              const hasNeverDoneRole = !Object.entries(currentPlan.assignments || {}).some(([key, assignee]) => {
                const separatorIndex = key.indexOf('_');
                if (separatorIndex === -1) return false; // Invalid key format
                const assignedRole = key.substring(separatorIndex + 1);
                return assignee === personId && assignedRole === modalState.role;
              });

              let mentions = [];
              if (!isAvailable) mentions.push("Indisponible");
              else {
                if (isConflicted) mentions.push("Déjà assigné cette semaine");
                if (hasNeverDoneRole) mentions.push("Jamais fait ce rôle");
              }
              const subtext = mentions.join(' / ');

              let btnClass = "bg-white border-slate-200 hover:bg-slate-50 text-slate-700";
              if (isSelected) btnClass = "bg-primary text-white border-primary ring-2 ring-offset-1 ring-primary";
              else if (!isAvailable) btnClass = "bg-slate-50 text-slate-400 border-slate-100 opacity-60";
              else if (isConflicted) btnClass = "bg-orange-50 text-orange-800 border-orange-200";

              return (
                <button
                  key={personId}
                  onClick={() => handleAssign(personId)}
                  className={`w-full text-left p-3 mb-2 rounded border flex justify-between items-center transition ${btnClass}`}
                >
                  <span className="font-medium text-sm">{personName}</span>
                  <span className="text-[10px] uppercase font-bold opacity-70 text-right">{subtext}</span>
                </button>
              );
            })}
          </div>
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
      {renderModal()}
    </>
  );
};

export default PlanningScheduleTab;