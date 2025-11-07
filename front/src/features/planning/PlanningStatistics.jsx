import React, { useState, useEffect } from 'react';
import planningApi from './../../api/planning';
import dayApi from './../../api/jour';
import roleApi from './../../api/role';
import membreApi from './../../features/membre/services/api';

const PlanningStatistics = () => {
  const [planning, setPlanning] = useState([]);
  const [jours, setJours] = useState([]);
  const [roles, setRoles] = useState({}); // {jourId: [roles]}
  const [personnes, setPersonnes] = useState([]);
  const [filteredPersonnes, setFilteredPersonnes] = useState([]);
  const [filteredSemaines, setFilteredSemaines] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [nbSemaines, setNbSemaines] = useState(4);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch days
        const joursResult = await dayApi.getAll();
        setJours(joursResult);
        
        // Fetch roles and organize them by day
        const rolesResult = await roleApi.getAll();
        const rolesByJour = {};
        rolesResult.forEach(role => {
          if (!rolesByJour[role.jour.id]) {
            rolesByJour[role.jour.id] = [];
          }
          rolesByJour[role.jour.id].push(role);
        });
        setRoles(rolesByJour);
        
        // Fetch members
        const personnesResult = await membreApi.getAll();
        setPersonnes(personnesResult);
        setFilteredPersonnes(personnesResult.map(p => p.id));
        
        // Fetch planning
        const planningResult = await planningApi.getAll();
        setPlanning(planningResult);
      } catch (error) {
        console.error('Error fetching statistics data:', error);
      }
    };

    fetchData();
  }, []);

  // Initialize filters based on data
  useEffect(() => {
    if (planning.length > 0 && personnes.length > 0) {
      // Determine the number of weeks based on planning
      const maxSemaine = Math.max(...planning.map(aff => aff.numeroSemaine));
      setNbSemaines(maxSemaine);
      setFilteredSemaines(Array.from({ length: maxSemaine }, (_, i) => i + 1));
      setFilteredRoles([...new Set(planning.map(aff => aff.role.id))]);
      
      // Initialize with all selected
      setFilteredPersonnes(personnes.map(p => p.id));
      setFilteredSemaines(Array.from({ length: maxSemaine }, (_, i) => i + 1));
      setFilteredRoles([...new Set(planning.map(aff => aff.role.id))]);
    }
  }, [planning, personnes]);

  // Calculate stats when filters change
  useEffect(() => {
    if (planning.length === 0 || filteredPersonnes.length === 0) return;

    const calculateStats = () => {
      const newStats = {};

      personnes.filter(p => filteredPersonnes.includes(p.id)).forEach(personne => {
        // Count total assignments for this person with filters
        const personAssignments = planning.filter(aff =>
          aff.membre.id === personne.id &&
          filteredSemaines.includes(aff.numeroSemaine) &&
          filteredRoles.includes(aff.role.id)
        );

        // Group by role, day, and week
        const parRole = {};
        const parJour = {};
        const parSemaine = {};
        
        personAssignments.forEach(aff => {
          // Count by role
          parRole[aff.role.nom] = (parRole[aff.role.nom] || 0) + 1;
          // Count by day
          parJour[aff.jour.nom] = (parJour[aff.jour.nom] || 0) + 1;
          // Count by week
          parSemaine[aff.numeroSemaine] = (parSemaine[aff.numeroSemaine] || 0) + 1;
        });

        newStats[personne.id] = {
          personne,
          total: personAssignments.length,
          parRole,
          parJour,
          parSemaine,
          details: personAssignments
        };
      });

      setStats(newStats);
    };

    calculateStats();
  }, [planning, filteredPersonnes, filteredSemaines, filteredRoles, personnes]);

  const toggleFilterPersonne = (personneId) => {
    setFilteredPersonnes(prev => 
      prev.includes(personneId) 
        ? prev.filter(id => id !== personneId) 
        : [...prev, personneId]
    );
  };

  const toggleAllPersonnes = () => {
    if (filteredPersonnes.length === personnes.length) {
      setFilteredPersonnes([]);
    } else {
      setFilteredPersonnes(personnes.map(p => p.id));
    }
  };

  const toggleFilterSemaine = (semaine) => {
    setFilteredSemaines(prev => 
      prev.includes(semaine) 
        ? prev.filter(s => s !== semaine) 
        : [...prev, semaine]
    );
  };

  const toggleAllSemaines = () => {
    const allSemaines = Array.from({ length: nbSemaines }, (_, i) => i + 1);
    if (filteredSemaines.length === allSemaines.length) {
      setFilteredSemaines([]);
    } else {
      setFilteredSemaines(allSemaines);
    }
  };

  const toggleFilterRole = (roleId) => {
    setFilteredRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(r => r !== roleId) 
        : [...prev, roleId]
    );
  };

  const toggleAllRoles = () => {
    const allRoleIds = [...new Set(planning.map(aff => aff.role.id))];
    if (filteredRoles.length === allRoleIds.length) {
      setFilteredRoles([]);
    } else {
      setFilteredRoles(allRoleIds);
    }
  };

  if (planning.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <i className="fas fa-chart-line text-6xl mb-4 text-gray-300"></i>
        <p className="text-lg">Générez un planning pour voir les statistiques</p>
      </div>
    );
  }

  if (filteredPersonnes.length === 0 || filteredSemaines.length === 0 || filteredRoles.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <i className="fas fa-exclamation-circle text-6xl mb-4 text-gray-300"></i>
        <p className="text-lg">Veuillez sélectionner au moins un filtre dans chaque catégorie</p>
      </div>
    );
  }

  // Calculate overview stats
  const totalAffectations = planning.filter(aff =>
    filteredPersonnes.includes(aff.membre.id) &&
    filteredSemaines.includes(aff.numeroSemaine) &&
    filteredRoles.includes(aff.role.id)
  ).length;

  const nbPersonnes = Object.keys(stats).length;
  const moyenne = nbPersonnes > 0 ? totalAffectations / nbPersonnes : 0;
  const maxAff = nbPersonnes > 0 ? Math.max(...Object.values(stats).map(s => s.total)) : 0;
  const minAff = nbPersonnes > 0 ? Math.min(...Object.values(stats).map(s => s.total)) : 0;

  return (
    <div>
      {/* Filtres avancés */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-filter mr-2 text-gray-700"></i>Filtres avancés
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtre Personnes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-users mr-1"></i>Personnes
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filteredPersonnes.length === personnes.length}
                  onChange={toggleAllPersonnes}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Toutes les personnes</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterPersonnesContainer">
                {personnes.map(personne => (
                  <label key={personne.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filteredPersonnes.includes(personne.id)}
                      onChange={() => toggleFilterPersonne(personne.id)}
                      className="cursor-pointer filter-personne"
                      value={personne.id}
                    />
                    <span>{personne.prenom || personne.nom}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filtre Semaines */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-calendar-week mr-1"></i>Semaines
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filteredSemaines.length === nbSemaines}
                  onChange={toggleAllSemaines}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Toutes les semaines</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterSemainesContainer">
                {Array.from({ length: nbSemaines }, (_, i) => i + 1).map(week => (
                  <label key={week} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filteredSemaines.includes(week)}
                      onChange={() => toggleFilterSemaine(week)}
                      className="cursor-pointer filter-semaine"
                      value={week}
                    />
                    <span>Semaine {week}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filtre Rôles */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <i className="fas fa-tasks mr-1"></i>Rôles
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={filteredRoles.length === [...new Set(planning.map(aff => aff.role.id))].length}
                  onChange={toggleAllRoles}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Tous les rôles</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterRolesContainer">
                {[...new Set(planning.map(aff => aff.role.id))].map(roleId => {
                  const role = [...new Set(planning.map(aff => aff.role))].find(r => r.id === roleId);
                  return (
                    <label key={roleId} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={filteredRoles.includes(roleId)}
                        onChange={() => toggleFilterRole(roleId)}
                        className="cursor-pointer filter-role"
                        value={roleId}
                      />
                      <span>{role.nom}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="planning-stat-card bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{totalAffectations}</div>
          <div className="text-sm text-gray-600">Total affectations</div>
        </div>
        <div className="planning-stat-card bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{moyenne.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Moyenne par personne</div>
        </div>
        <div className="planning-stat-card bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{maxAff}</div>
          <div className="text-sm text-gray-600">Maximum</div>
        </div>
        <div className="planning-stat-card bg-white border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{minAff}</div>
          <div className="text-sm text-gray-600">Minimum</div>
        </div>
      </div>

      {/* Détails par personne */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(stats).map(([personneId, stat]) => (
          <div key={personneId} className="planning-stat-card border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {stat.personne.prenom || stat.personne.nom}
              </h3>
              <div className="text-4xl font-bold text-gray-900">{stat.total}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Par rôle */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-tasks mr-1"></i>Par rôle:
                </div>
                <div className="space-y-1">
                  {Object.entries(stat.parRole).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                    const percentage = (count / stat.total * 100).toFixed(0);
                    return (
                      <div key={role} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{role}</span>
                        <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Par jour */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-calendar-day mr-1"></i>Par jour:
                </div>
                <div className="space-y-1">
                  {Object.entries(stat.parJour).sort((a, b) => b[1] - a[1]).map(([jour, count]) => {
                    const percentage = (count / stat.total * 100).toFixed(0);
                    return (
                      <div key={jour} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{jour}</span>
                        <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Par semaine */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-calendar-week mr-1"></i>Par semaine:
                </div>
                <div className="space-y-1">
                  {Object.entries(stat.parSemaine).sort((a, b) => a[0] - b[0]).map(([semaine, count]) => (
                    <div key={semaine} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Semaine {semaine}</span>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Détails chronologiques */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-list mr-1"></i>Détail des affectations:
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="text-left">
                      <th className="py-1 px-2">Semaine</th>
                      <th className="py-1 px-2">Jour</th>
                      <th className="py-1 px-2">Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stat.details
                      .sort((a, b) => {
                        if (a.numeroSemaine !== b.numeroSemaine) return a.numeroSemaine - b.numeroSemaine;
                        return jours.findIndex(j => j.id === a.jour.id) - 
                               jours.findIndex(j => j.id === b.jour.id);
                      })
                      .map((detail, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="py-1 px-2">{detail.numeroSemaine}</td>
                          <td className="py-1 px-2">{detail.jour.nom}</td>
                          <td className="py-1 px-2">{detail.role.nom}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanningStatistics;