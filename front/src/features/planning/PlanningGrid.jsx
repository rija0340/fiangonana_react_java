import React, { useState, useEffect } from 'react';
import membreApi from '../membre/services/api';
import roleApi from '../../api/role';
import jourApi from '../../api/jour';

const PlanningGrid = ({ plan, updatePlan }) => {
    const [allMembers, setAllMembers] = useState([]);
    const [rolesByDay, setRolesByDay] = useState({});
    const [selectedMembers, setSelectedMembers] = useState({});
    const [assignments, setAssignments] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (plan) {
            loadPlanningData();
        }
    }, [plan]);

    const loadPlanningData = async () => {
        try {
            // Load members and roles
            const [membersData, rolesData] = await Promise.all([
                membreApi.getAll(),
                roleApi.getAll()
            ]);
            
            setAllMembers(membersData);
            
            // Group roles by day
            const groupedRoles = rolesData.reduce((acc, role) => {
                const dayId = role.jour ? role.jour.id : 'aucun';
                if (!acc[dayId]) {
                    acc[dayId] = [];
                }
                acc[dayId].push(role);
                return acc;
            }, {});
            
            setRolesByDay(groupedRoles);

            // Initialize assignments based on plan data
            const planAssignments = plan.assignments || {};
            setAssignments(planAssignments);

            // Initialize selected members based on plan.selectedPeople
            const selectedPeople = plan.selectedPeople || [];
            const initialSelection = {};
            selectedPeople.forEach(memberId => {
                initialSelection[memberId] = true;
            });
            setSelectedMembers(initialSelection);
        } catch (error) {
            console.error("Failed to load planning data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMemberSelection = (memberId) => {
        const newSelection = { ...selectedMembers };
        if (newSelection[memberId]) {
            delete newSelection[memberId];
        } else {
            newSelection[memberId] = true;
        }
        
        setSelectedMembers(newSelection);
        
        // Update plan selected people
        const selectedPeople = Object.keys(newSelection).map(Number);
        updatePlan(plan.id, { ...plan, selectedPeople });
    };

    const handleAssignmentChange = (date, roleId, memberId) => {
        const assignmentKey = `${date}_${roleId}`;
        const newAssignments = { ...assignments };
        
        if (newAssignments[assignmentKey] === memberId) {
            delete newAssignments[assignmentKey];
        } else {
            newAssignments[assignmentKey] = memberId;
        }
        
        setAssignments(newAssignments);
        updatePlan(plan.id, { ...plan, assignments: newAssignments });
    };

    const getMemberName = (memberId) => {
        const member = allMembers.find(m => m.id === memberId);
        return member ? `${member.nom} ${member.prenom}` : 'Aucun';
    };

    if (loading) return <div className="p-6 text-center">Chargement du planning...</div>;
    if (!plan) return <div className="p-6 text-center">Veuillez sélectionner un planning.</div>;

    const selectedDates = plan.selectedDates || [];
    const selectedPeople = plan.selectedPeople || [];

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-table-cells-large text-primary"></i> Grille de Planning : <span className="text-primary">{plan.nom}</span>
                    </h3>
                    <p className="text-sm text-slate-600">Assignez des membres aux rôles pour chaque date</p>
                </div>

                {/* Members Selection Panel */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-slate-700">Membres Disponibles</h4>
                        <span className="text-sm text-slate-500">{Object.keys(selectedMembers).length} sélectionnés</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                        {allMembers.map(member => (
                            <div 
                                key={member.id}
                                onClick={() => handleMemberSelection(member.id)}
                                className={`p-2 rounded border text-center text-xs cursor-pointer transition ${
                                    selectedMembers[member.id] 
                                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700' 
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <div className="truncate">{member.nom} {member.prenom}</div>
                                {member.baptemeDate ? (
                                    <span className="text-[10px] px-1 py-0.5 bg-green-100 text-green-800 rounded-full">B</span>
                                ) : (
                                    <span className="text-[10px] px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">NB</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Planning Grid */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                    {selectedDates.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            Aucune date sélectionnée. Veuillez configurer les dates dans l'onglet Configuration.
                        </div>
                    ) : (
                        <table className="w-full text-sm min-w-max">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600">
                                    <th className="p-2 border-r border-slate-200 text-left">Rôles</th>
                                    {selectedDates.map(date => (
                                        <th key={date} className="p-2 text-center border-r border-slate-200">
                                            <div className="font-semibold">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                                            <div>{new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(rolesByDay).flatMap(([dayId, roles]) => 
                                    roles.map(role => (
                                        <tr key={`${dayId}-${role.id}`} className="hover:bg-slate-50">
                                            <td className="p-2 border-r border-slate-200 font-medium bg-slate-50">{role.nom}</td>
                                            {selectedDates.map(date => {
                                                // Check if this date matches the role's day
                                                const dateObj = new Date(date);
                                                const dateDayId = dateObj.getDay(); // 0 is Sunday, 1 is Monday, etc.
                                                const assignmentKey = `${date}_${role.id}`;
                                                const assignedMemberId = assignments[assignmentKey];

                                                return (
                                                    <td key={`${date}-${role.id}`} className="p-1 text-center border-r border-slate-200">
                                                        {dayId === 'aucun' || dayId == dateDayId ? (
                                                            <select
                                                                value={assignedMemberId || ''}
                                                                onChange={(e) => handleAssignmentChange(date, role.id, parseInt(e.target.value))}
                                                                className={`w-full p-2 text-xs rounded ${
                                                                    assignedMemberId ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                                                                } border`}
                                                            >
                                                                <option value="">-- Choisissez --</option>
                                                                {allMembers
                                                                    .filter(member => selectedMembers[member.id])
                                                                    .map(member => (
                                                                        <option key={member.id} value={member.id}>
                                                                            {member.nom} {member.prenom}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                        ) : (
                                                            <div className="p-2 text-center text-slate-400 text-xs italic">N/A</div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlanningGrid;
