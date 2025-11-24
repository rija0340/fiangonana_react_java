import React, { useState, useEffect } from 'react';
import membreApi from '../membre/services/api';
import roleApi from '../../api/role';
import jourApi from '../../api/jour';

const GlobalConfig = () => {
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState({});
    const [jours, setJours] = useState([]);
    const [selectedJour, setSelectedJour] = useState('');
    const [newRole, setNewRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersData, rolesData, joursData] = await Promise.all([
                    membreApi.getAll(),
                    roleApi.getAll(),
                    jourApi.getAll()
                ]);
                setMembers(membersData);
                groupRolesByDay(rolesData);
                setJours(joursData);
                if (joursData.length > 0) {
                    setSelectedJour(joursData[0].id);
                }
            } catch (err) {
                setError('Failed to fetch data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const groupRolesByDay = (rolesData) => {
        const grouped = rolesData.reduce((acc, role) => {
            const dayId = role.jour ? role.jour.id : 'aucun';
            if (!acc[dayId]) {
                acc[dayId] = [];
            }
            acc[dayId].push(role);
            return acc;
        }, {});
        setRoles(grouped);
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRole.trim()) return;
        const jour = jours.find(j => j.id === parseInt(selectedJour));
        try {
            const addedRole = await roleApi.create({ nom: newRole, jour: jour });
            const dayId = jour ? jour.id : 'aucun';
            setRoles(prevRoles => {
                const updatedRoles = { ...prevRoles };
                if (!updatedRoles[dayId]) {
                    updatedRoles[dayId] = [];
                }
                updatedRoles[dayId].push(addedRole);
                return updatedRoles;
            });
            setNewRole('');
        } catch (err) {
            setError('Failed to add role');
            console.error(err);
        }
    };

    const handleDeleteRole = async (roleId) => {
        try {
            await roleApi.delete(roleId);
            setRoles(prevRoles => {
                const updatedRoles = { ...prevRoles };
                for (const dayId in updatedRoles) {
                    updatedRoles[dayId] = updatedRoles[dayId].filter(role => role.id !== roleId);
                }
                return updatedRoles;
            });
        } catch (err) {
            setError('Failed to delete role');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    const currentRoles = selectedJour ? roles[selectedJour] || [] : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 h-full">
            {/* Members List */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-users text-blue-500"></i> Base de Membres (Global)
                </h3>
                <div className="overflow-y-auto flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                <div className="bg-slate-200 border-2 border-dashed rounded-xl w-16 h-16" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{member.nom} {member.prenom}</p>
                                    <p className="text-xs text-slate-500 truncate">{member.famille?.adresse || 'Adresse non spécifiée'}</p>
                                    <div className="flex gap-1 mt-1">
                                        {member.baptemeDate ? (
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Baptisé(e)</span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Non baptisé(e)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Roles Configuration */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-tags text-purple-500"></i> Rôles par Jour
                </h3>
                
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jour</label>
                    <select
                        value={selectedJour}
                        onChange={(e) => setSelectedJour(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary"
                    >
                        {jours.map(jour => (
                            <option key={jour.id} value={jour.id}>{jour.nom}</option>
                        ))}
                    </select>
                </div>
                
                <div className="overflow-y-auto flex-grow mb-4">
                    <div className="space-y-2">
                        {currentRoles.map(role => (
                            <div key={role.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">{role.nom}</span>
                                <button 
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-1 text-red-500 hover:bg-red-100 rounded-full"
                                    title="Supprimer le rôle"
                                >
                                    <i className="fa-solid fa-trash text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <form onSubmit={handleAddRole} className="mt-auto">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            placeholder="Nouveau rôle..."
                            className="flex-1 p-2 border border-slate-300 rounded focus:ring-primary focus:border-primary"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-indigo-700 transition"
                        >
                            <i className="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GlobalConfig;