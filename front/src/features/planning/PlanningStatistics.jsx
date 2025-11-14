import React, { useState, useEffect, useMemo } from 'react';
import planningApi from './../../api/planning';

const PlanningStatistics = ({ planning, selectedDates, rolesParTypeJour, membresSelectionnes, personnes, selectedSessionId }) => {
  const [filteredPersonnes, setFilteredPersonnes] = useState([]);
  const [filteredSemaines, setFilteredSemaines] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [stats, setStats] = useState({});
  const [nbSemaines, setNbSemaines] = useState(4);

  // Calculate stats when filters change
  useEffect(() => {
    if (planning.length === 0 || membresSelectionnes.length === 0) return;

    const calculateStats = () => {
      const newStats = {};

      personnes.filter(p => membresSelectionnes.includes(p.id)).forEach(personne => {
        // Count total assignments for this person with filters
        const personAssignments = planning.filter(aff =>
          aff.membre?.id === personne.id &&
          (filteredSemaines.length === 0 || filteredSemaines.includes(aff.numeroSemaine)) &&
          (filteredRoles.length === 0 || filteredRoles.includes(aff.role.nom))
        );

        // Group by role, day, and week
        const parRole = {};
        const parJour = {};
        const parSemaine = {};

        personAssignments.forEach(aff => {
          // Count by role
          if (aff.role?.nom) {
            parRole[aff.role.nom] = (parRole[aff.role.nom] || 0) + 1;
          }
          // Count by day
          if (aff.jour?.nom) {
            parJour[aff.jour.nom] = (parJour[aff.jour.nom] || 0) + 1;
          }
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
  }, [planning, filteredPersonnes, filteredSemaines, filteredRoles, personnes, membresSelectionnes]);

  // Calculate weeks from selected dates
  const datesParSemaine = useMemo(() => {
    const grouped = {};
    selectedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + 1) / 7);
      
      if (!grouped[weekNumber]) {
        grouped[weekNumber] = [];
      }
      grouped[weekNumber].push(dateStr);
    });
    Object.keys(grouped).forEach(semaine => {
      grouped[semaine].sort();
    });
    return grouped;
  }, [selectedDates]);

  // Get unique week numbers
  const uniqueSemaines = useMemo(() => {
    return Object.keys(datesParSemaine).sort((a, b) => parseInt(a) - parseInt(b));
  }, [datesParSemaine]);

  // Get unique roles
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    if (planning.length > 0) {
      planning.forEach(aff => {
        if (aff.role?.nom) {
          roles.add(aff.role.nom);
        }
      });
    }
    return Array.from(roles);
  }, [planning]);

  // Initialize filters based on data
  useEffect(() => {
    if (planning.length > 0 && membresSelectionnes.length > 0) {
      setFilteredSemaines(uniqueSemaines);
      setFilteredRoles(uniqueRoles);

      // Initialize with all selected
      setFilteredPersonnes(membresSelectionnes);
      setFilteredSemaines(uniqueSemaines);
      setFilteredRoles(uniqueRoles);
    }
  }, [planning, membresSelectionnes, uniqueSemaines, uniqueRoles]);

  const toggleFilterPersonne = (personneId) => {
    setFilteredPersonnes(prev =>
      prev.includes(personneId)
        ? prev.filter(id => id !== personneId)
        : [...prev, personneId]
    );
  };

  const toggleAllPersonnes = () => {
    if (filteredPersonnes.length === membresSelectionnes.length) {
      setFilteredPersonnes([]);
    } else {
      setFilteredPersonnes([...membresSelectionnes]);
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
    if (filteredSemaines.length === uniqueSemaines.length) {
      setFilteredSemaines([]);
    } else {
      setFilteredSemaines([...uniqueSemaines]);
    }
  };

  const toggleFilterRole = (role) => {
    setFilteredRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const toggleAllRoles = () => {
    if (filteredRoles.length === uniqueRoles.length) {
      setFilteredRoles([]);
    } else {
      setFilteredRoles([...uniqueRoles]);
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
    filteredPersonnes.includes(aff.membre?.id) &&
    filteredSemaines.includes(aff.numeroSemaine) &&
    filteredRoles.includes(aff.role.nom)
  ).length;

  const nbPersonnes = Object.keys(stats).filter(id => 
    filteredPersonnes.includes(parseInt(id))
  ).length;
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
                  checked={filteredPersonnes.length === membresSelectionnes.length}
                  onChange={toggleAllPersonnes}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Tous les membres sélectionnés</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterPersonnesContainer">
                {personnes.filter(p => membresSelectionnes.includes(p.id)).map(personne => (
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
                  checked={filteredSemaines.length === uniqueSemaines.length}
                  onChange={toggleAllSemaines}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Toutes les semaines</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterSemainesContainer">
                {uniqueSemaines.map(week => (
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
                  checked={filteredRoles.length === uniqueRoles.length}
                  onChange={toggleAllRoles}
                  className="cursor-pointer"
                />
                <span className="font-semibold">Tous les rôles</span>
              </label>
              <hr className="my-2 border-gray-300" />
              <div id="filterRolesContainer">
                {uniqueRoles.map(role => (
                  <label key={role} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filteredRoles.includes(role)}
                      onChange={() => toggleFilterRole(role)}
                      className="cursor-pointer filter-role"
                      value={role}
                    />
                    <span>{role}</span>
                  </label>
                ))}
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
        {Object.entries(stats).filter(([personneId]) => 
          filteredPersonnes.includes(parseInt(personneId))
        ).map(([personneId, stat]) => (
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
                  {Object.entries(stat.parSemaine).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([semaine, count]) => (
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
                      <th className="py-1 px-2">Date</th>
                      <th className="py-1 px-2">Jour</th>
                      <th className="py-1 px-2">Rôle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stat.details
                      .sort((a, b) => {
                        if (a.numeroSemaine !== b.numeroSemaine) return a.numeroSemaine - b.numeroSemaine;
                        return new Date(a.date) - new Date(b.date);
                      })
                      .map((detail, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="py-1 px-2">{detail.numeroSemaine}</td>
                          <td className="py-1 px-2">{detail.date}</td>
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