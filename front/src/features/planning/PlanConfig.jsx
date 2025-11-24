import React, { useState, useEffect } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import membreApi from '../membre/services/api';

const PlanConfig = ({ plan, updatePlan }) => {
    const [allMembers, setAllMembers] = useState([]);
    
    // Local state for inputs to avoid re-rendering the whole app on every keystroke
    const [localTitle, setLocalTitle] = useState('');

    useEffect(() => {
        membreApi.getAll().then(setAllMembers).catch(err => console.error("Failed to fetch members:", err));
    }, []);

    useEffect(() => {
        if (plan) {
            setLocalTitle(plan.nom || '');
        }
    }, [plan]);

    if (!plan) {
        return <div className="p-6 text-center">Sélectionnez un planning pour commencer.</div>;
    }

    const handleTitleBlur = () => {
        if (localTitle !== plan.nom) {
            updatePlan(plan.id, { ...plan, nom: localTitle });
        }
    };

    const handleDateChange = (dates) => {
        const dateStrings = dates.map(d => d.toISOString().split('T')[0]).sort();
        updatePlan(plan.id, { ...plan, selectedDates: dateStrings });
    };

    const toggleMemberSelection = (memberId) => {
        const currentSelected = plan.selectedPeople || [];
        const newSelected = currentSelected.includes(memberId)
            ? currentSelected.filter(id => id !== memberId)
            : [...currentSelected, memberId];
        updatePlan(plan.id, { ...plan, selectedPeople: newSelected });
    };
    
    const selectAllPeopleForPlan = (includeAll) => {
        const newSelected = includeAll ? allMembers.map(m => m.id) : [];
        updatePlan(plan.id, { ...plan, selectedPeople: newSelected });
    };

    const toggleAvailability = (memberId, date) => {
        const currentAvail = plan.availability || {};
        const key = `${memberId}_${date}`;
        const newAvail = { ...currentAvail };
        if (newAvail[key] === false) {
            delete newAvail[key];
        } else {
            newAvail[key] = false;
        }
        updatePlan(plan.id, { ...plan, availability: newAvail });
    };

    const formatDateShort = (dStr) => {
        const d = new Date(dStr + 'T00:00:00');
        return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
    };

    const dayNames = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Sabbat' };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <i className="fa-solid fa-sliders text-primary"></i> Configuration du Planning : <span className="text-primary">{plan.nom}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Titre du planning</label>
                            <input
                                type="text"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary font-semibold text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dates sélectionnées</label>
                            <Flatpickr
                                options={{ mode: "multiple", dateFormat: "Y-m-d", locale: French }}
                                value={plan.selectedDates || []}
                                onChange={handleDateChange}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary"
                                placeholder="Choisir les dates..."
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Participants & Disponibilités</label>
                         <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 overflow-x-auto">
                             <table className="w-full text-sm">
                                 <thead>
                                     <tr className="bg-slate-100 text-slate-600 text-xs">
                                         <th className="p-2 w-10 text-center">
                                             <input type="checkbox" 
                                                onChange={(e) => selectAllPeopleForPlan(e.target.checked)} 
                                                checked={(plan.selectedPeople || []).length === allMembers.length && allMembers.length > 0}
                                                title="Tout inclure/exclure" />
                                         </th>
                                         <th className="p-2 text-left font-semibold">Membre</th>
                                         {(plan.selectedDates || []).map(d => {
                                             const date = new Date(d + 'T00:00:00');
                                             return (
                                                 <th key={d} className="p-2 text-center min-w-[60px] font-medium" title={`${dayNames[date.getDay()]} ${date.toLocaleDateString()}`}>
                                                     <div className="text-[10px]">{dayNames[date.getDay()].substring(0,3)}</div>
                                                     <div>{formatDateShort(d)}</div>
                                                 </th>
                                             );
                                         })}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {allMembers.map(member => {
                                         const isIncluded = (plan.selectedPeople || []).includes(member.id);
                                         return (
                                             <tr key={member.id} className={`${isIncluded ? 'bg-white' : 'bg-slate-50 opacity-50'} hover:bg-indigo-50/50 hover:opacity-100`}>
                                                 <td className="p-2 text-center">
                                                     <input type="checkbox" className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                         checked={isIncluded}
                                                         onChange={() => toggleMemberSelection(member.id)}
                                                     />
                                                 </td>
                                                 <td className="p-2 font-medium text-slate-700">{member.nom} {member.prenom}</td>
                                                 {(plan.selectedDates || []).map(date => {
                                                     const key = `${member.id}_${date}`;
                                                     const isUnavailable = (plan.availability || {})[key] === false;
                                                     return (
                                                         <td key={date} className="p-2 text-center">
                                                             {isIncluded && (
                                                                 <label className="checkbox-wrapper cursor-pointer inline-block w-5 h-5">
                                                                     <input type="checkbox" className="hidden"
                                                                         checked={!isUnavailable}
                                                                         onChange={() => toggleAvailability(member.id, date)}
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
                         <div className="flex justify-end items-center mt-2">
                            <button onClick={() => selectAllPeopleForPlan(true)} className="text-xs text-primary hover:underline">Tout inclure</button>
                            <span className="text-xs text-slate-400 mx-1">/</span>
                            <button onClick={() => selectAllPeopleForPlan(false)} className="text-xs text-primary hover:underline">Tout exclure</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanConfig;
