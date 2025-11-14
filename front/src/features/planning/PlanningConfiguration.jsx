import React, { useState, useEffect, useRef } from 'react';
import dayApi from './../../api/jour';  // Updated API service for days
import roleApi from './../../api/role';  // Updated API service for roles
import membreApi from './../../features/membre/services/api';  // Existing member API
import availabilityApi from './../../api/availability';

const PlanningConfiguration = ({
  selectedDates,
  setSelectedDates,
  membresSelectionnes,
  setMembresSelectionnes,
  rolesParTypeJour,
  setRolesParTypeJour,
  disponibilitesParDate,
  setDisponibilitesParDate,
  selectedSessionId
}) => {
  const [jours, setJours] = useState([]);
  const [personnes, setPersonnes] = useState([]);
  const [newPersonne, setNewPersonne] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDayType, setSelectedDayType] = useState('');
  const [nomNouveauRole, setNomNouveauRole] = useState('');

  const datePickerRef = useRef(null);
  const flatpickrInstance = useRef(null);

  // Initialize date picker
  useEffect(() => {
    if (window.flatpickr && datePickerRef.current) {
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
      }

      flatpickrInstance.current = window.flatpickr(datePickerRef.current, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        onChange: (selectedDates) => {
          // Use setSelectedDates to avoid duplicates
          const dateStrings = selectedDates.map(date => date.toISOString().split('T')[0]);
          setSelectedDates(dateStrings);
        }
      });

      // Set selected dates if any
      if (selectedDates.length > 0) {
        const dates = selectedDates.map(d => new Date(d));
        if (flatpickrInstance.current) {
          flatpickrInstance.current.setDate(dates);
        }
      }
    }

    return () => {
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
      }
    };
  }, [selectedDates.length, setSelectedDates]); // Re-initialize when number of dates changes

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch days
        const joursResult = await dayApi.getAll();
        setJours(joursResult);

        // Fetch members
        const personnesResult = await membreApi.getAll();
        setPersonnes(personnesResult);
      } catch (error) {
        console.error('Error fetching planning configuration:', error);
      }
    };

    fetchData();
  }, []);

  // Handle add personne
  const handleAjouterPersonne = () => {
    if (newPersonne.trim()) {
      // Check if personne already exists
      if (!personnes.some(p => p.nom === newPersonne.trim() || p.prenom === newPersonne.trim())) {
        // In the current system, we would need to create this member in the backend
        // For now, we'll add it to the local state
        setPersonnes(prev => [
          ...prev,
          {
            id: Date.now(), // Use timestamp as a unique ID
            nom: newPersonne.trim(),
            prenom: newPersonne.trim()
          }
        ]);
        setNewPersonne('');
        setMessage('Personne ajoutée avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Cette personne existe déjà.');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  // Toggle member selection for planning
  const toggleMembreSelection = (personneId) => {
    setMembresSelectionnes(prev => {
      const newMembres = [...prev];
      const index = newMembres.indexOf(personneId);
      if (index === -1) {
        newMembres.push(personneId);
      } else {
        newMembres.splice(index, 1);
      }
      return newMembres;
    });
  };

  // Toggle availability
  const toggleDisponibilite = (date, membreId) => {
    setDisponibilitesParDate(prev => {
      const newDisponibilites = { ...prev };
      if (!newDisponibilites[date]) {
        newDisponibilites[date] = {};
      }
      // Toggle the availability for the personne on this specific date
      const newState = !newDisponibilites[date][membreId];
      newDisponibilites[date][membreId] = newState;
      
      // Update the backend if we have a selected session
      if (selectedSessionId) {
        const availability = {
          date: date,
          disponible: newState,
          membre: { id: membreId }
        };
        
        // Update or create availability record
        availabilityApi.create(selectedSessionId, availability)
          .catch(error => console.error('Error saving availability:', error));
      }
      
      return newDisponibilites;
    });
  };

  // Add role to day type
  const ajouterRole = (typeJour, nomRole) => {
    setRolesParTypeJour(prev => {
      const newRoles = { ...prev };
      if (!newRoles[typeJour]) {
        newRoles[typeJour] = [];
      }
      if (!newRoles[typeJour].includes(nomRole)) {
        newRoles[typeJour] = [...newRoles[typeJour], nomRole];
      }
      return newRoles;
    });
  };

  // Get all unique days from selected dates
  const getJoursAvecDates = () => {
    const joursMap = {};
    selectedDates.forEach(dateString => {
      const date = new Date(dateString);
      const jourSemaine = date.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      if (!joursMap[jourSemaine]) {
        joursMap[jourSemaine] = {
          jour: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][jourSemaine],
          dates: []
        };
      }
      joursMap[jourSemaine].dates.push(dateString);
    });
    return joursMap;
  };

  const joursAvecDates = getJoursAvecDates();
  const typesJourDisponibles = Object.keys(joursAvecDates).map(k => parseInt(k)).sort();

  // Handle add role
  const handleAjouterRole = () => {
    if (selectedDayType && nomNouveauRole.trim()) {
      ajouterRole(parseInt(selectedDayType), nomNouveauRole.trim());
      setNomNouveauRole('');
      setMessage('Rôle ajouté avec succès !');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Remove role
  const supprimerRole = (typeJour, nomRole) => {
    setRolesParTypeJour(prev => {
      const newRoles = { ...prev };
      if (newRoles[typeJour]) {
        newRoles[typeJour] = newRoles[typeJour].filter(r => r !== nomRole);
      }
      return newRoles;
    });
  };

  // Export to JSON
  const exporterJSON = () => {
    const data = {
      personnes: personnes,
      datesSelectionnees: selectedDates,
      disponibilitesParDate: disponibilitesParDate,
      rolesParTypeJour: rolesParTypeJour,
      sessionId: selectedSessionId
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'planning-config.json';
    link.click();
  };

  // Import from JSON
  const importerJSON = () => {
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
            if (!data.personnes || !Array.isArray(data.personnes)) {
              throw new Error('Format invalide: "personnes" manquant ou non-array');
            }

            if (!data.datesSelectionnees || !Array.isArray(data.datesSelectionnees)) {
              throw new Error('Format invalide: "datesSelectionnees" manquant ou non-array');
            }

            if (!data.rolesParTypeJour || typeof data.rolesParTypeJour !== 'object') {
              throw new Error('Format invalide: "rolesParTypeJour" manquant ou non-object');
            }

            setPersonnes(data.personnes || []);
            setSelectedDates(data.datesSelectionnees || []);
            setMembresSelectionnes(data.membresSelectionnes || []);
            setDisponibilitesParDate(data.disponibilitesParDate || {});
            setRolesParTypeJour(data.rolesParTypeJour || {});
            setMessage('Configuration importée avec succès !');
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

  // Reset all data
  const reinitialiserDonnees = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
      setPersonnes([]);
      setSelectedDates([]);
      setMembresSelectionnes([]);
      setDisponibilitesParDate({});
      setRolesParTypeJour({});
      setMessage('Données réinitialisées.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div>
      {message && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Add Person */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-user-plus mr-2 text-green-500"></i>
            Ajouter une personne
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                value={newPersonne}
                onChange={(e) => setNewPersonne(e.target.value)}
                placeholder="Ex: Miora"
                className="w-full px-4 py-3 rounded-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleAjouterPersonne()}
              />
            </div>
            <p className="text-sm text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Les disponibilités seront configurées dans la grille ci-dessous
            </p>
            <button
              onClick={handleAjouterPersonne}
              className="w-full planning-btn-gradient font-semibold py-3 rounded-lg"
            >
              <i className="fas fa-user-check mr-2"></i>
              Ajouter personne
            </button>
          </div>
        </div>

        {/* People List */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-users mr-2 text-green-500"></i>
            Personnes enregistrées
          </h3>
          <div className="space-y-2" style={{ minHeight: '50px' }}>
            {personnes.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune personne enregistrée.</p>
            ) : (
              personnes.map((personne, index) => (
                <div
                  key={personne.id || index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{personne.prenom || personne.nom}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-calendar-check mr-2 text-indigo-500"></i>
          Configuration par Dates
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez des dates spécifiques et configurez les rôles et disponibilités
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sélectionner les dates
            </label>
            <input
              type="text"
              ref={datePickerRef}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
              placeholder="Cliquez pour sélectionner plusieurs dates"
            />
            <div className="text-sm text-gray-600 mt-1">
              {selectedDates.length} date(s) sélectionnée(s)
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dates sélectionnées ({selectedDates.length})
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 border rounded-lg">
              {selectedDates.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune date sélectionnée.</p>
              ) : (
                selectedDates.map((date, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    {date}
                    <button
                      onClick={() => setSelectedDates(prev => prev.filter(d => d !== date))}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sélectionner les membres pour ce planning
            </label>
            <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 border rounded-lg space-y-2">
              {personnes.length === 0 ? (
                <p className="text-gray-500 text-sm">Ajoutez des personnes pour les sélectionner ici.</p>
              ) : (
                personnes.map((personne) => (
                  <label key={personne.id} className="flex items-center gap-2 p-1 hover:bg-gray-200 rounded">
                    <input
                      type="checkbox"
                      checked={membresSelectionnes.includes(personne.id)}
                      onChange={() => toggleMembreSelection(personne.id)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm"
                    />
                    <span className="text-sm">{personne.prenom || personne.nom}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Management */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-tags mr-2 text-purple-500"></i>
          Gestion des Rôles
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ajoutez, modifiez ou supprimez des rôles pour chaque type de jour présent dans vos dates
        </p>

        {/* Overview */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Aperçu par type de jour</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typesJourDisponibles.length === 0 ? (
              <p className="text-gray-500 text-sm col-span-full">
                Sélectionnez des dates pour voir les types de jours disponibles.
              </p>
            ) : (
              typesJourDisponibles.map((typeJour) => (
                <div key={typeJour} className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-bold text-gray-800 mb-2">
                    {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][typeJour]} ({joursAvecDates[typeJour].dates.length} date(s))
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {rolesParTypeJour[typeJour]?.map((role, index) => (
                      <span
                        key={index}
                        className="planning-role-badge inline-flex items-center gap-1.5"
                      >
                        {role}
                        <button
                          onClick={() => supprimerRole(typeJour, role)}
                          className="planning-remove-btn hover:text-red-200 ml-1"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </span>
                    )) || (
                      <span className="text-gray-500 text-sm">Aucun rôle</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Role Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Ajouter un rôle</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de jour
                </label>
                <select
                  value={selectedDayType}
                  onChange={(e) => setSelectedDayType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
                >
                  <option value="">-- Sélectionner un type de jour --</option>
                  {typesJourDisponibles.map((typeJour) => (
                    <option key={typeJour} value={typeJour}>
                      {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][typeJour]} ({joursAvecDates[typeJour].dates.length} date(s))
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Les types de jour disponibles dépendent de vos dates sélectionnées
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du rôle
                </label>
                <input
                  type="text"
                  value={nomNouveauRole}
                  onChange={(e) => setNomNouveauRole(e.target.value)}
                  placeholder="Ex: CUISINIER, ORGANISATEUR, etc."
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleAjouterRole()}
                />
              </div>

              <button
                onClick={handleAjouterRole}
                className="w-full planning-btn-gradient font-semibold py-3 rounded-lg"
              >
                <i className="fas fa-plus mr-2"></i>
                Ajouter le rôle
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Détails du jour sélectionné</h4>
            <div className="border rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
              {selectedDayType ? (
                <div>
                  <h5 className="font-bold mb-2">{["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][parseInt(selectedDayType)]}</h5>
                  {rolesParTypeJour[selectedDayType]?.map((role, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-white rounded mb-2"
                    >
                      <span>{role}</span>
                      <button
                        onClick={() => supprimerRole(selectedDayType, role)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )) || <p className="text-gray-500 text-sm">Aucun rôle pour ce jour</p>}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Sélectionnez un type de jour pour voir ses rôles
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import/Export */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-exchange-alt mr-2 text-gray-700"></i>
          Import / Export de configuration
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={exporterJSON}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            <i className="fas fa-file-download mr-2"></i>
            Exporter JSON
          </button>
          <button
            onClick={importerJSON}
            className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            <i className="fas fa-file-upload mr-2"></i>
            Importer JSON
          </button>
          <button
            onClick={reinitialiserDonnees}
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            <i className="fas fa-trash-alt mr-2"></i>
            Réinitialiser complètement
          </button>
        </div>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-table mr-2 text-cyan-500"></i>
          Grille de Disponibilité
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Cochez les cases pour indiquer la disponibilité de chaque membre pour chaque date sélectionnée
        </p>
        <div className="border rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
          {selectedDates.length === 0 || personnes.length === 0 ? (
            <p className="text-gray-500 p-4 text-center">
              Sélectionnez des dates et des membres pour configurer les disponibilités.
            </p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="bg-gray-50 p-3 text-left">Personne</th>
                  {selectedDates.map((date, index) => (
                    <th key={index} className="bg-gray-50 p-3 text-left">
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personnes.map((personne, pIndex) => (
                  <tr key={personne.id || pIndex}>
                    <td className="p-3 font-medium bg-gray-50">{personne.prenom || personne.nom}</td>
                    {selectedDates.map((date, dIndex) => (
                      <td key={dIndex} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={disponibilitesParDate[date]?.[personne.id] || false}
                          onChange={() => toggleDisponibilite(date, personne.id)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningConfiguration;