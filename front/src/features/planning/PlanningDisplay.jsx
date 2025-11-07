import React, { useState, useEffect } from 'react';
import planningApi from './../../api/planning';
import dayApi from './../../api/jour';
import roleApi from './../../api/role';
import membreApi from './../../features/membre/services/api';

const PlanningDisplay = ({ nbSemaines, modeEquite, modeDebug }) => {
  const [planning, setPlanning] = useState([]);
  const [jours, setJours] = useState([]);
  const [roles, setRoles] = useState({}); // {jourId: [roles]}
  const [personnes, setPersonnes] = useState([]);
  const [message, setMessage] = useState('');
  const [highlightedCell, setHighlightedCell] = useState(null);

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
      } catch (error) {
        console.error('Error fetching planning data:', error);
      }
    };

    fetchData();
  }, []);

  // Load existing planning
  useEffect(() => {
    const fetchPlanning = async () => {
      try {
        const planningResult = await planningApi.getAll();
        setPlanning(planningResult);
      } catch (error) {
        console.error('Error fetching planning:', error);
      }
    };

    fetchPlanning();
  }, []);

  const generatePlanning = async () => {
    if (jours.length === 0) {
      setMessage({ type: 'error', content: 'Veuillez d\'abord configurer des jours' });
      return;
    }

    if (personnes.length === 0) {
      setMessage({ type: 'error', content: 'Veuillez d\'abord ajouter des personnes' });
      return;
    }

    try {
      // First clear existing planning
      await planningApi.reset();

      // Create a counter for each person
      const compteurs = {};
      personnes.forEach(p => compteurs[p.id] = 0);

      const newPlanning = [];
      const erreurs = [];

      for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        for (const jour of jours) { // Respect the current order of jours array
          const rolesJour = roles[jour.id] || [];
          const personnesDisponibles = personnes.filter(p => {
            // In a complete implementation, we'd check disponibilite records
            // For now, we'll consider all persons available
            return true;
          });

          if (personnesDisponibles.length === 0) {
            erreurs.push(`Semaine ${semaine}, ${jour.nom}: Aucune personne disponible`);
            continue;
          }

          for (const role of rolesJour) {
            let personneTrouvee = null;

            // Filter people already assigned to this day this week
            const personnesDejaAssignees = newPlanning
              .filter(aff => aff.numeroSemaine === semaine && aff.jour.id === jour.id)
              .map(aff => aff.membre.id);

            let personnesEligibles = personnesDisponibles.filter(p =>
              !personnesDejaAssignees.includes(p.id)
            );

            if (personnesEligibles.length === 0) {
              // Aucune personne disponible, laisser vide
              erreurs.push(`Semaine ${semaine}, ${jour.nom}, ${role.nom}: Aucune personne disponible (contrainte respectée)`);
              continue;
            }

            // Rule of rotation: favor people who have not done this role yet
            const personnesSansRole = personnesEligibles.filter(p => {
              return !newPlanning.some(aff => aff.membre.id === p.id && aff.role.id === role.id);
            });

            // If there are people who have not done this role, favor them
            if (personnesSansRole.length > 0) {
              personnesEligibles = personnesSansRole;
            }

            if (modeEquite) {
              // Find the person with the least assignments
              const minCompteur = Math.min(...personnesEligibles.map(p => compteurs[p.id]));
              const candidats = personnesEligibles.filter(p => compteurs[p.id] === minCompteur);

              personneTrouvee = candidats[Math.floor(Math.random() * candidats.length)];
            } else {
              // Simple random mode
              personneTrouvee = personnesEligibles[
                Math.floor(Math.random() * personnesEligibles.length)
              ];
            }

            if (personneTrouvee) {
              const newPlanningEntry = {
                numeroSemaine: semaine,
                jour: { id: jour.id, nom: jour.nom },
                role: { id: role.id, nom: role.nom },
                membre: { id: personneTrouvee.id, prenom: personneTrouvee.prenom || personneTrouvee.nom }
              };
              
              newPlanning.push(newPlanningEntry);
              compteurs[personneTrouvee.id]++;
              
              // Save to API
              await planningApi.create(newPlanningEntry);
            }
          }
        }
      }

      // Update state with the created planning
      setPlanning(newPlanning);

      if (erreurs.length > 0 && modeDebug) {
        setMessage({ type: 'error', content: `Planning généré avec ${erreurs.length} problème(s)` });
        console.log('Erreurs:', erreurs);
      } else if (erreurs.length > 0) {
        setMessage({ type: 'error', content: 'Planning généré (certains rôles n\'ont pas pu être affectés)' });
      } else {
        setMessage({ type: 'success', content: `Planning généré avec succès pour ${nbSemaines} semaine(s) !` });
      }
    } catch (error) {
      console.error('Error generating planning:', error);
      setMessage({ type: 'error', content: `Erreur lors de la génération: ${error.message}` });
    }
  };

  const resetPlanning = async () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser le planning ? Toutes les affectations seront supprimées.')) {
      return;
    }

    try {
      await planningApi.reset();
      setPlanning([]);
      setMessage({ type: 'success', content: 'Planning réinitialisé' });
    } catch (error) {
      console.error('Error resetting planning:', error);
      setMessage({ type: 'error', content: `Erreur lors de la réinitialisation: ${error.message}` });
    }
  };

  const handleCellClick = async (semaine, jour, role) => {
    // For now, we'll just show an autocomplete dropdown with available persons
    // In a complete implementation, we'd use the autocomplete functionality
    
    // Get available persons for this day (incomplete implementation)
    const personnesDisponibles = personnes;
    
    if (personnesDisponibles.length === 0) {
      setMessage({ type: 'error', content: `Aucune personne disponible pour ${jour.nom}` });
      return;
    }

    // In a full implementation, we'd show the autocomplete dropdown here
    // For now, we'll just select a random person
    const selectedPersonne = personnesDisponibles[Math.floor(Math.random() * personnesDisponibles.length)];
    
    // Check if there's already an assignment for this week, day, and role
    const existingAssignment = planning.find(aff => 
      aff.numeroSemaine === semaine && 
      aff.jour.id === jour.id && 
      aff.role.id === role.id
    );
    
    if (existingAssignment) {
      // Update existing assignment
      const updatedAssignment = {
        ...existingAssignment,
        membre: selectedPersonne
      };
      
      try {
        await planningApi.update(existingAssignment.id, updatedAssignment);
        setPlanning(prev => 
          prev.map(aff => 
            aff.id === existingAssignment.id ? updatedAssignment : aff
          )
        );
        setMessage({ type: 'success', content: `Affectation mise à jour` });
      } catch (error) {
        console.error('Error updating assignment:', error);
        setMessage({ type: 'error', content: `Erreur lors de la mise à jour: ${error.message}` });
      }
    } else {
      // Create new assignment
      const newAssignment = {
        numeroSemaine: semaine,
        jour: { id: jour.id, nom: jour.nom },
        role: { id: role.id, nom: role.nom },
        membre: { id: selectedPersonne.id, prenom: selectedPersonne.prenom || selectedPersonne.nom }
      };
      
      try {
        const savedAssignment = await planningApi.create(newAssignment);
        setPlanning(prev => [...prev, savedAssignment]);
        setMessage({ type: 'success', content: `Affectation ajoutée` });
      } catch (error) {
        console.error('Error adding assignment:', error);
        setMessage({ type: 'error', content: `Erreur lors de l'ajout: ${error.message}` });
      }
    }
  };

  const highlightCell = (semaine, jour, role) => {
    setHighlightedCell({ semaine, jourId: jour.id, roleId: role.id });
  };

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

    // Create headers for desktop view
    let headerHTML = (
      <tr className="planning-desktop-view">
        <th className="border-r border-gray-300">Jour</th>
        <th className="border-r border-gray-300">Rôle</th>
        {Array.from({ length: nbSemaines }, (_, i) => (
          <th key={i + 1} className="text-center">Semaine {i + 1}</th>
        ))}
      </tr>
    );

    // Group planning by day and role
    const groupedByDayRole = {};
    jours.forEach(jour => {
      if (roles[jour.id]) {
        roles[jour.id].forEach(role => {
          const key = `${jour.id}-${role.id}`;
          groupedByDayRole[key] = { jour, role, assignments: [] };
        });
      }
    });

    // Add assignments to grouped structure
    planning.forEach(aff => {
      const key = `${aff.jour.id}-${aff.role.id}`;
      if (groupedByDayRole[key]) {
        groupedByDayRole[key].assignments[aff.numeroSemaine - 1] = aff.membre;
      }
    });

    // Render body rows for desktop view
    const bodyRows = [];
    Object.values(groupedByDayRole).forEach((item, idx) => {
      const { jour, role, assignments } = item;
      const isFirstRole = idx === 0 || 
        (idx > 0 && groupedByDayRole[Object.keys(groupedByDayRole)[idx - 1]].jour.id !== jour.id);
      
      const sameDayRoles = Object.values(groupedByDayRole).filter(i => i.jour.id === jour.id);
      const rowspan = sameDayRoles.length;
      
      bodyRows.push(
        <tr key={`${jour.id}-${role.id}`} className="planning-desktop-view">
          {isFirstRole && (
            <td rowSpan={rowspan} className="font-semibold bg-gray-50 border-r border-gray-300 align-top">
              {jour.nom}
            </td>
          )}
          
          <td className="bg-gray-50 border-r border-gray-300">{role.nom}</td>
          
          {Array.from({ length: nbSemaines }, (_, semIdx) => {
            const membre = assignments[semIdx];
            const displayText = membre ? (membre.prenom || membre.nom) : <span className="planning-empty-cell">Vide</span>;
            const isHighlighted = highlightedCell && 
              highlightedCell.semaine === semIdx + 1 && 
              highlightedCell.jourId === jour.id && 
              highlightedCell.roleId === role.id;
            const cellClass = `text-center ${membre ? 'planning-editable-cell' : 'planning-editable-cell planning-empty-cell'} ${isHighlighted ? 'planning-highlight-cell' : ''}`;
            
            return (
              <td 
                key={semIdx}
                className={cellClass}
                onClick={() => handleCellClick(semIdx + 1, jour, role)}
                data-semaine={semIdx + 1}
                data-jour={jour.id}
                data-role={role.id}
                data-personne={membre ? membre.id : ''}
              >
                {displayText}
              </td>
            );
          })}
        </tr>
      );
    });

    // Mobile view - group by week
    const mobileRows = [];
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
      mobileRows.push(
        <tr key={`mobile-week-${semaine}`} className="planning-mobile-view">
          <td colSpan="3" className="planning-week-header bg-gray-100 font-bold text-center py-3">
            Semaine {semaine}
          </td>
        </tr>
      );

      Object.values(groupedByDayRole).forEach(item => {
        const { jour, role } = item;
        const aff = planning.find(a =>
          a.numeroSemaine === semaine &&
          a.jour.id === jour.id &&
          a.role.id === role.id
        );

        const membre = aff ? aff.membre : null;
        const displayText = membre ? (membre.prenom || membre.nom) : <span className="planning-empty-cell">Vide</span>;
        const isHighlighted = highlightedCell && 
          highlightedCell.semaine === semaine && 
          highlightedCell.jourId === jour.id && 
          highlightedCell.roleId === role.id;
        const cellClass = `${membre ? 'planning-editable-cell' : 'planning-editable-cell planning-empty-cell'} ${isHighlighted ? 'planning-highlight-cell' : ''}`;

        mobileRows.push(
          <tr key={`mobile-${jour.id}-${role.id}-${semaine}`} className="planning-mobile-view">
            <td data-label="Jour" className="font-semibold">{jour.nom}</td>
            <td data-label="Rôle">{role.nom}</td>
            <td 
              data-label="Personne" 
              className={cellClass}
              onClick={() => handleCellClick(semaine, jour, role)}
              data-semaine={semaine}
              data-jour={jour.id}
              data-role={role.id}
              data-personne={membre ? membre.id : ''}
            >
              {displayText}
            </td>
          </tr>
        );
      });
    }

    return (
      <>
        <thead>{headerHTML}</thead>
        <tbody>
          {bodyRows}
          {mobileRows}
        </tbody>
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
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <i className={`fas ${
              message.type === 'success' ? 'fa-check-circle' :
              message.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            }`}></i>
            <span>{message.content}</span>
          </div>
        </div>
      )}

      <div className="planning-table-container bg-white">
        <table id="tableauPlanning" className="w-full">
          {renderPlanningTable()}
        </table>
      </div>
    </div>
  );
};

export default PlanningDisplay;