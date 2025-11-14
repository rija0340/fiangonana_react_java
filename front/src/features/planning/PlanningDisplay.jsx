import React, { useState, useEffect, useMemo, useRef } from 'react';
import planningApi from './../../api/planning';
import dayApi from './../../api/jour';
import roleApi from './../../api/role';
import membreApi from './../../features/membre/services/api';
import planningSessionApi from './../../api/planningSession';
import * as XLSX from 'xlsx';

const PlanningDisplay = ({ 
  nbSemaines, 
  modeEquite, 
  modeDebug,
  selectedDates,
  rolesParTypeJour,
  membresSelectionnes,
  disponibilitesParDate,
  planning,
  setPlanning,
  generatePlanning,
  selectedSessionId
}) => {
  const [personnes, setPersonnes] = useState([]);
  const [message, setMessage] = useState('');
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [dropdownActif, setDropdownActif] = useState(null);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch members
        const personnesResult = await membreApi.getAll();
        setPersonnes(personnesResult);
      } catch (error) {
        console.error('Error fetching planning data:', error);
      }
    };

    fetchData();
  }, []);

  // Calculate weeks from selected dates
  const datesParSemaine = useMemo(() => {
    const grouped = {};
    selectedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      // Calculate week number based on the date
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
  const numeroSemaines = useMemo(() => {
    return Object.keys(datesParSemaine).sort((a, b) => parseInt(a) - parseInt(b));
  }, [datesParSemaine]);

  // Get present days of the week
  const joursPresents = useMemo(() => {
    const jours = new Set();
    selectedDates.forEach(dateStr => {
      const dateObj = new Date(dateStr);
      jours.add(dateObj.getDay());
    });
    return jours;
  }, [selectedDates]);

  // Get all unique roles
  const rolesUniques = useMemo(() => {
    const roles = new Set();
    Object.entries(rolesParTypeJour).forEach(([jourIndex, rolesJour]) => {
      if (joursPresents.has(parseInt(jourIndex))) {
        rolesJour.forEach(role => roles.add(role));
      }
    });
    return Array.from(roles);
  }, [rolesParTypeJour, joursPresents]);

  // Calculate equity for assistant
  const equite = useMemo(() => {
    const stats = {};
    personnes.forEach(p => {
      if (membresSelectionnes.includes(p.id)) {
        stats[p.id] = planning.filter(a => a.membre && a.membre.id === p.id).length;
      }
    });

    const valeurs = Object.values(stats);
    if (valeurs.length === 0) return [];

    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    const max = Math.max(...valeurs);
    const min = Math.min(...valeurs);

    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .map(([id, total]) => {
        const personne = personnes.find(p => p.id === parseInt(id));
        if (!personne) return null;
        const diff = total - moyenne;
        const status = diff > 0.5 ? 'over' : (diff < -0.5 ? 'under' : 'balanced');
        return { id, nom: personne.prenom || personne.nom, total, status, diff };
      }).filter(Boolean);
  }, [planning, personnes, membresSelectionnes]);

  // Calculate roles summary for assistant
  const rolesSummary = useMemo(() => {
    const assignesSet = new Set();
    const nonAssignesSet = new Set();

    // Add all roles from rolesParTypeJour
    Object.values(rolesParTypeJour).forEach(roles => {
      roles.forEach(role => nonAssignesSet.add(role));
    });

    // Remove assigned roles
    planning.forEach(item => {
      if (item.membre && item.membre.id) {
        assignesSet.add(item.role.nom);
        nonAssignesSet.delete(item.role.nom);
      }
    });

    return {
      assignes: Array.from(assignesSet),
      nonAssignes: Array.from(nonAssignesSet)
    };
  }, [planning, rolesParTypeJour]);

  // Update assignment
  const modifierAffectationParDate = (dateStr, role, nouvellePersonneId) => {
    setPlanning(prev => {
      // Find and remove the old assignment
      let newPlanning = prev.filter(aff =>
        !(aff.date === dateStr && aff.role.nom === role)
      );

      // Add the new assignment if a person is selected
      if (nouvellePersonneId) {
        // Find the date object
        const dateObj = new Date(dateStr);
        const jourIndex = dateObj.getDay();
        const nomJour = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][jourIndex];
        
        // Calculate week number
        const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
        const days = Math.floor((dateObj - startOfYear) / (24 * 60 * 60 * 1000));
        const numeroSemaine = Math.ceil((days + 1) / 7);

        // Find the role object
        const roleObj = { nom: role };

        // Find the membre object
        const membre = personnes.find(p => p.id === nouvellePersonneId);

        if (membre) {
          newPlanning.push({
            date: dateStr,
            jour: { id: jourIndex, nom: nomJour },
            role: roleObj,
            membre: membre,
            numeroSemaine: numeroSemaine
          });
        }
      }

      return newPlanning;
    });
  };

  // Open autocomplete for specific date
  const ouvrirAutocompletePourUneDate = (cell, dateStr, role, personneActuelleId) => {
    // Close existing dropdown
    if (dropdownActif) {
      document.body.removeChild(dropdownActif);
      setDropdownActif(null);
    }

    // Get available people for this date
    const personnesDisponibles = Object.keys(disponibilitesParDate[dateStr] || {})
      .filter(membreId => disponibilitesParDate[dateStr][membreId] && membresSelectionnes.includes(parseInt(membreId)))
      .map(id => parseInt(id));

    if (personnesDisponibles.length === 0) {
      setMessage(`Aucune personne disponible pour cette date (${dateStr})`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Get people already assigned to this date
    const personnesDejaAssignees = planning
      .filter(aff => aff.date === dateStr)
      .map(aff => aff.membre.id);

    // Create dropdown
    const rect = cell.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'planning-autocomplete-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.minWidth = '200px';
    dropdown.style.zIndex = '1000';

    // Empty option
    const emptyOption = document.createElement('div');
    emptyOption.className = 'planning-autocomplete-item';
    emptyOption.innerHTML = '<span style="color: #9ca3af; font-style: italic;">Vider</span>';
    emptyOption.onclick = () => {
      modifierAffectationParDate(dateStr, role, null);
      document.body.removeChild(dropdown);
      setDropdownActif(null);
    };
    dropdown.appendChild(emptyOption);

    // Separator
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid #e5e7eb';
    separator.style.margin = '0.25rem 0';
    dropdown.appendChild(separator);

    // Person options
    personnesDisponibles.forEach(personneId => {
      const personne = personnes.find(p => p.id === personneId);
      if (!personne) return;

      const option = document.createElement('div');
      option.className = 'planning-autocomplete-item';
      
      if (personneId === personneActuelleId) {
        option.classList.add('selected');
      }

      if (personnesDejaAssignees.includes(personneId)) {
        option.innerHTML = `${personne.prenom || personne.nom} <span style="color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem;">⚠ déjà assigné</span>`;
      } else {
        option.textContent = personne.prenom || personne.nom;
      }

      option.onclick = () => {
        modifierAffectationParDate(dateStr, role, personneId);
        document.body.removeChild(dropdown);
        setDropdownActif(null);
      };
      dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);
    setDropdownActif(dropdown);
  };

  // Export to Excel
  const exporterExcel = () => {
    if (planning.length === 0) {
      setMessage('Aucun planning à exporter.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const data = [['Semaine', 'Date', 'Jour', 'Rôle', 'Personne']];
    planning.forEach(item => {
      data.push([
        item.numeroSemaine, 
        item.date, 
        item.jour.nom, 
        item.role.nom, 
        item.membre?.prenom || item.membre?.nom || 'Non assigné'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Planning');
    XLSX.writeFile(wb, 'planning.xlsx');
  };

  // Export planning to JSON
  const exporterPlanningJSON = () => {
    const data = {
      planning: planning,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'planning.json';
    link.click();
  };

  // Import planning from JSON
  const importerPlanningJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);

            // Validate structure
            if (!data.planning) {
              throw new Error('Format invalide: structure du fichier incomplète');
            }

            setPlanning(data.planning || []);
            setMessage('Planning importé avec succès !');
            setTimeout(() => setMessage(''), 3000);
          } catch (error) {
            setMessage(`Erreur lors de l'importation : ${error.message}`);
            setTimeout(() => setMessage(''), 3000);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Reset planning
  const resetPlanning = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser le planning ? Toutes les affectations seront supprimées.')) {
      setPlanning([]);
      setMessage('Planning réinitialisé');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  // Render the planning table
  const renderPlanningTable = () => {
    if (planning.length === 0) {
      return (
        <div className="text-center text-gray-500 py-12">
          <i className="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
          <p className="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
        </div>
      );
    }

    // Group planning by week
    const planningByWeek = {};
    planning.forEach(item => {
      if (!planningByWeek[item.numeroSemaine]) {
        planningByWeek[item.numeroSemaine] = [];
      }
      planningByWeek[item.numeroSemaine].push(item);
    });

    return (
      <>
        {/* Desktop View */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="planning-desktop-view">
              <th className="border-r border-gray-300">Jour</th>
              <th className="border-r border-gray-300">Rôle</th>
              {numeroSemaines.map(numSemaine => {
                const dates = datesParSemaine[numSemaine];
                let formatted;
                if (dates.length === 1) {
                  const dateObj = new Date(dates[0]);
                  formatted = dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                } else {
                  const dateDebut = new Date(dates[0]);
                  const dateFin = new Date(dates[dates.length - 1]);
                  const formattedDebut = dateDebut.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                  const formattedFin = dateFin.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                  formatted = `${formattedDebut}-${formattedFin}`;
                }
                return (
                  <th key={numSemaine} className="text-center">
                    Semaine {numSemaine}
                    <br />
                    <span className="text-xs font-normal">{formatted}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Desktop View - Grouped by Day and Role */}
            {JOURS_SEMAINE.map((nomJour, jourIndex) => {
              const rolesDuJour = rolesParTypeJour[jourIndex] || [];
              if (rolesDuJour.length === 0) return null;
              if (!joursPresents.has(jourIndex)) return null;

              return rolesDuJour.map((role, roleIndex) => {
                const isFirstRole = roleIndex === 0;
                const rowspan = rolesDuJour.length;

                return (
                  <tr key={`${jourIndex}-${role}`} className="planning-desktop-view">
                    {isFirstRole && (
                      <td rowSpan={rowspan} className="font-semibold bg-gray-50 border-r border-gray-300 align-top">
                        {nomJour}
                      </td>
                    )}
                    <td className="bg-gray-50 border-r border-gray-300">
                      {role}
                    </td>
                    {numeroSemaines.map(numSemaine => {
                      const dates = datesParSemaine[numSemaine];
                      let affectation = null;
                      for (const date of dates) {
                        affectation = planning.find(p =>
                          p.date === date &&
                          p.role.nom === role &&
                          p.jour.nom === nomJour
                        );
                        if (affectation) break;
                      }

                      const personne = affectation ? affectation.membre : null;
                      const displayText = personne ? (personne.prenom || personne.nom) : 'Vide';
                      const cellClass = `text-center planning-editable-cell ${!personne ? 'planning-empty-cell' : ''}`;

                      return (
                        <td
                          key={numSemaine}
                          className={cellClass}
                          onClick={(e) => {
                            // Find the cell element
                            const cell = e.target;
                            if (affectation) {
                              // Open autocomplete for editing with current person
                              ouvrirAutocompletePourUneDate(cell, affectation.date, role, personne.id);
                            } else {
                              // Find an appropriate date from the week for the role
                              const dates = datesParSemaine[numSemaine];
                              if (dates.length > 0) {
                                // Find a date that matches the day of the week for this role
                                const dateForRole = dates.find(date => {
                                  const dateObj = new Date(date);
                                  const dateJourIndex = dateObj.getDay();
                                  return dateJourIndex === jourIndex; // Compare with the day index for this row
                                });

                                // If no specific date found for this day type, use the first date as fallback
                                const targetDate = dateForRole || dates[0];
                                ouvrirAutocompletePourUneDate(cell, targetDate, role, null);
                              }
                            }
                          }}
                        >
                          {displayText}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="md:hidden">
          {numeroSemaines.map(numSemaine => {
            const dates = datesParSemaine[numSemaine];
            const dateDebut = new Date(dates[0]);
            const dateFin = new Date(dates[dates.length - 1]);
            const formatted = `${dateDebut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} au ${dateFin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}`;

            return (
              <React.Fragment key={`mobile-${numSemaine}`}>
                <tr className="planning-mobile-view">
                  <td colSpan={3} className="planning-week-header bg-gray-100 font-bold text-center py-3">
                    Semaine {numSemaine}
                    <br />
                    <span className="text-xs font-normal">{formatted}</span>
                  </td>
                </tr>
                {JOURS_SEMAINE.map(nomJour => {
                  const jourIndex = JOURS_SEMAINE.indexOf(nomJour);
                  const rolesDuJour = rolesParTypeJour[jourIndex] || [];
                  if (!joursPresents.has(jourIndex)) return null;

                  return rolesDuJour.map(role => {
                    let affectation = null;
                    for (const date of dates) {
                      affectation = planning.find(p =>
                        p.date === date &&
                        p.role.nom === role &&
                        p.jour.nom === nomJour
                      );
                      if (affectation) break;
                    }

                    const personne = affectation ? affectation.membre : null;
                    const displayText = personne ? (personne.prenom || personne.nom) : 'Vide';

                    return (
                      <tr key={`mobile-${numSemaine}-${jourIndex}-${role}`} className="planning-mobile-view">
                        <td data-label="Jour" className="font-semibold">
                          {nomJour}
                        </td>
                        <td data-label="Rôle">
                          {role}
                        </td>
                        <td
                          data-label="Personne"
                          className={`planning-editable-cell ${!personne ? 'planning-empty-cell' : ''}`}
                          onClick={(e) => {
                            // Find the cell element
                            const cell = e.target;
                            if (affectation) {
                              // Open autocomplete for editing with current person
                              ouvrirAutocompletePourUneDate(cell, affectation.date, role, personne.id);
                            } else {
                              // Find an appropriate date from the week for the role
                              const dates = datesParSemaine[numSemaine];
                              if (dates.length > 0) {
                                // Find a date that matches the day of the week for this role
                                const dateForRole = dates.find(date => {
                                  const dateObj = new Date(date);
                                  const dateJourIndex = dateObj.getDay();
                                  return dateJourIndex === jourIndex; // Compare with the day index for this row
                                });

                                // If no specific date found for this day type, use the first date as fallback
                                const targetDate = dateForRole || dates[0];
                                ouvrirAutocompletePourUneDate(cell, targetDate, role, null);
                              }
                            }
                          }}
                        >
                          {displayText}
                        </td>
                      </tr>
                    );
                  });
                })}
              </React.Fragment>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={generatePlanning}
          className="flex-1 md:flex-none planning-btn-gradient font-semibold py-3 px-8 rounded-lg"
        >
          <i className="fas fa-magic mr-2"></i>GÉNÉRER PLANNING
        </button>
        <button
          onClick={generatePlanning}
          className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          <i className="fas fa-redo mr-2"></i>RÉESSAYER
        </button>
        <button
          onClick={resetPlanning}
          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          <i className="fas fa-trash-alt mr-2"></i>RÉINITIALISER
        </button>
        <button
          onClick={exporterExcel}
          className="flex-1 md:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          <i className="fas fa-file-excel mr-2"></i>
          EXPORTER EXCEL
        </button>
        <button
          onClick={exporterPlanningJSON}
          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          <i className="fas fa-download mr-2"></i>
          EXPORTER PLANNING
        </button>
        <button
          onClick={importerPlanningJSON}
          className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          <i className="fas fa-upload mr-2"></i>
          IMPORTER PLANNING
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {/* Summary */}
      {planning.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
            Résumé du Planning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="planning-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total affectations</p>
                  <p className="text-2xl font-bold text-gray-900">{planning.length}</p>
                </div>
                <i className="fas fa-tasks text-3xl text-blue-500"></i>
              </div>
            </div>
            <div className="planning-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Semaines</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(datesParSemaine).length}
                  </p>
                </div>
                <i className="fas fa-calendar-week text-3xl text-green-500"></i>
              </div>
            </div>
            <div className="planning-stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Personnes affectées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...new Set(planning.map(p => p.membre?.id))].filter(Boolean).length}
                  </p>
                </div>
                <i className="fas fa-users text-3xl text-green-500"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Assistant */}
      {planning.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <i className="fas fa-robot mr-2 text-blue-500"></i>
            Assistant en temps réel
          </h3>

          {/* Equity Analysis */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-sm mb-2">Analyse d'équité :</h4>
            <p className="text-xs text-gray-600 mb-2">
              Moyenne : {(planning.length / membresSelectionnes.length || 1).toFixed(1)} affectations par personne
            </p>
            <div className="space-y-1 text-xs">
              {equite.map(({ nom, total, status, diff }) => {
                const statusText = status === 'over' ? 'Trop assigné' : (status === 'under' ? 'Peu assigné' : 'Équilibré');
                const statusColor = status === 'over' ? 'text-red-600' : (status === 'under' ? 'text-yellow-600' : 'text-green-600');
                return (
                  <div key={nom} className="flex justify-between">
                    <span>{nom}:</span>
                    <span className={statusColor}>{total} ({statusText})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Roles Summary */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h4 className="font-semibold text-sm mb-2">Résumé des rôles :</h4>
            <div className="flex flex-wrap gap-2">
              {rolesSummary.assignes.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-green-600">Assigné : </span>
                  {rolesSummary.assignes.map(role => (
                    <span key={role} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                      {role}
                    </span>
                  ))}
                </div>
              )}
              {rolesSummary.nonAssignes.length > 0 && (
                <div className="w-full mt-2">
                  <span className="text-xs font-semibold text-red-600">Non assigné : </span>
                  {rolesSummary.nonAssignes.map(role => (
                    <span key={role} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="planning-table-container bg-white">
        <table className="w-full">
          {renderPlanningTable()}
        </table>
      </div>
    </div>
  );
};

export default PlanningDisplay;