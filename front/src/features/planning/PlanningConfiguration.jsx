import React, { useState, useEffect } from 'react';
import dayApi from './../../api/jour';  // Updated API service for days
import roleApi from './../../api/role';  // Updated API service for roles
import membreApi from './../../features/membre/services/api';  // Existing member API

const PlanningConfiguration = ({ nbSemaines }) => {
  const [jours, setJours] = useState([]);
  const [roles, setRoles] = useState({}); // {jourId: [roles]}
  const [personnes, setPersonnes] = useState([]);
  const [newJour, setNewJour] = useState('');
  const [newRoles, setNewRoles] = useState('');
  const [newPersonne, setNewPersonne] = useState('');
  const [message, setMessage] = useState('');

  // For editing
  const [selectedJour, setSelectedJour] = useState('');
  const [newRole, setNewRole] = useState('');
  const [selectedPersonne, setSelectedPersonne] = useState('');
  const [disponibilitesPersonne, setDisponibilitesPersonne] = useState([]);
  
  const [disponibilites, setDisponibilites] = useState({});

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
        console.error('Error fetching planning configuration:', error);
      }
    };

    fetchData();
  }, []);

  const handleAddJourAvecRoles = async () => {
    if (!newJour.trim()) {
      setMessage({ type: 'error', content: 'Veuillez entrer un nom de jour' });
      return;
    }

    if (!newRoles.trim()) {
      setMessage({ type: 'error', content: 'Veuillez entrer au moins un rôle' });
      return;
    }

    try {
      // Create the day
      const newJourObj = await dayApi.create({ nom: newJour.trim() });
      setJours([...jours, newJourObj]);

      // Create roles for the day
      const rolesArray = newRoles.trim().split('\n').map(r => r.trim()).filter(r => r);
      const createdRoles = [];
      
      for (const roleName of rolesArray) {
        const newRoleObj = await roleApi.create({ 
          nom: roleName, 
          jour: { id: newJourObj.id } 
        });
        createdRoles.push(newRoleObj);
      }

      // Update roles state
      setRoles(prev => ({
        ...prev,
        [newJourObj.id]: [...(prev[newJourObj.id] || []), ...createdRoles]
      }));

      // Reset form
      setNewJour('');
      setNewRoles('');

      setMessage({ type: 'success', content: `Jour "${newJour}" ajouté avec ${rolesArray.length} rôle(s)` });
    } catch (error) {
      console.error('Error adding day with roles:', error);
      setMessage({ type: 'error', content: `Erreur lors de l'ajout: ${error.message}` });
    }
  };

  const handleAddPersonne = async () => {
    if (!newPersonne.trim()) {
      setMessage({ type: 'error', content: 'Veuillez entrer un nom' });
      return;
    }

    try {
      const personneData = {
        nom: newPersonne.trim(),
        prenom: newPersonne.trim(), // Using nom as prenom if no explicit prenom
        telephone: '',
        dateBapteme: null,
        dateNaissance: null,
        occupation: '',
        observation: '',
        sexe: 'Autre' // Default value
      };

      const newPersonneObj = await membreApi.create(personneData);
      setPersonnes([...personnes, newPersonneObj]);

      setNewPersonne('');
      setMessage({ type: 'success', content: `Personne "${newPersonne}" ajoutée` });
    } catch (error) {
      console.error('Error adding personne:', error);
      setMessage({ type: 'error', content: `Erreur lors de l'ajout: ${error.message}` });
    }
  };

  const handleAddRoleToJour = async () => {
    if (!selectedJour || !newRole.trim()) {
      setMessage({ type: 'error', content: 'Veuillez remplir tous les champs' });
      return;
    }

    try {
      const jour = jours.find(j => j.id.toString() === selectedJour);
      if (!jour) {
        setMessage({ type: 'error', content: 'Jour non trouvé' });
        return;
      }

      const newRoleObj = await roleApi.create({ 
        nom: newRole.trim(), 
        jour: { id: parseInt(selectedJour) } 
      });

      // Update roles state
      setRoles(prev => ({
        ...prev,
        [selectedJour]: [...(prev[selectedJour] || []), newRoleObj]
      }));

      setNewRole('');
      setMessage({ type: 'success', content: `Rôle "${newRole}" ajouté` });
    } catch (error) {
      console.error('Error adding role to day:', error);
      setMessage({ type: 'error', content: `Erreur lors de l'ajout: ${error.message}` });
    }
  };

  const handleDeleteJour = async (jourId) => {
    if (!window.confirm('Supprimer ce jour et tous ses rôles ?')) return;

    try {
      await dayApi.delete(jourId);
      
      // Update state
      setJours(jours.filter(j => j.id !== jourId));
      setRoles(prev => {
        const newRoles = {...prev};
        delete newRoles[jourId];
        return newRoles;
      });

      setMessage({ type: 'success', content: 'Jour supprimé' });
    } catch (error) {
      console.error('Error deleting day:', error);
      setMessage({ type: 'error', content: `Erreur lors de la suppression: ${error.message}` });
    }
  };

  const handleDeleteRole = async (roleId, jourId) => {
    if (!window.confirm('Supprimer ce rôle ?')) return;

    try {
      await roleApi.delete(roleId);
      
      // Update state
      setRoles(prev => ({
        ...prev,
        [jourId]: (prev[jourId] || []).filter(r => r.id !== roleId)
      }));

      setMessage({ type: 'success', content: 'Rôle supprimé' });
    } catch (error) {
      console.error('Error deleting role:', error);
      setMessage({ type: 'error', content: `Erreur lors de la suppression: ${error.message}` });
    }
  };

  const handleDeletePersonne = async (personneId) => {
    if (!window.confirm('Supprimer cette personne ?')) return;

    try {
      await membreApi.delete(personneId);
      
      // Update state
      setPersonnes(personnes.filter(p => p.id !== personneId));

      setMessage({ type: 'success', content: 'Personne supprimée' });
    } catch (error) {
      console.error('Error deleting personne:', error);
      setMessage({ type: 'error', content: `Erreur lors de la suppression: ${error.message}` });
    }
  };

  // Load roles for selected day
  useEffect(() => {
    if (selectedJour) {
      // We already have all roles loaded, just need to get roles for selected day
    } else {
      setDisponibilitesPersonne([]);
    }
  }, [selectedJour, roles]);

  // Load disponibilites for selected personne
  useEffect(() => {
    if (selectedPersonne) {
      const personne = personnes.find(p => p.id === parseInt(selectedPersonne));
      if (personne) {
        // In the full implementation, we would track personne disponibilites
        // For now, we'll just use the existing information
      }
    } else {
      setDisponibilitesPersonne([]);
    }
  }, [selectedPersonne, personnes]);

  const getDisponibilitesForPersonne = (personneId) => {
    // In a full implementation, this would come from a disponibilite table
    // For now, we'll return all available jours
    return jours.map(j => j.id);
  };

  const toggleDisponibilite = (personneId, jourId) => {
    // In a full implementation, this would update a disponibilite table
    setDisponibilites(prev => ({
      ...prev,
      [personneId]: prev[personneId] 
        ? prev[personneId].includes(jourId) 
          ? prev[personneId].filter(id => id !== jourId) 
          : [...prev[personneId], jourId]
        : [jourId]
    }));
  };

  return (
    <div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ajouter un jour */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-plus-circle mr-2 text-blue-500"></i>Ajouter un jour avec rôles
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du jour</label>
              <input 
                type="text" 
                value={newJour}
                onChange={(e) => setNewJour(e.target.value)}
                placeholder="Ex: Alarobia"
                className="w-full px-4 py-3 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rôles (un par ligne)</label>
              <textarea 
                value={newRoles}
                onChange={(e) => setNewRoles(e.target.value)}
                rows="4" 
                placeholder="PRESIDE&#10;FAMPAHEREZANA&#10;..."
                className="w-full px-4 py-3 rounded-lg resize-none"
              ></textarea>
            </div>
            <button 
              onClick={handleAddJourAvecRoles}
              className="w-full planning-btn-gradient font-semibold py-3 rounded-lg"
            >
              <i className="fas fa-plus mr-2"></i>Ajouter jour avec rôles
            </button>
          </div>
        </div>

        {/* Ajouter une personne */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-user-plus mr-2 text-green-500"></i>Ajouter une personne
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
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Disponible les jours :</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {jours.map(jour => (
                  <div key={jour.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id={`dispo-${jour.id}`}
                      checked={(disponibilites[newPersonne] || []).includes(jour.id)}
                      onChange={() => toggleDisponibilite(newPersonne, jour.id)}
                      className="cursor-pointer"
                    />
                    <label htmlFor={`dispo-${jour.id}`} className="cursor-pointer text-gray-700">
                      {jour.nom}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={handleAddPersonne}
              className="w-full planning-btn-gradient font-semibold py-3 rounded-lg"
            >
              <i className="fas fa-user-check mr-2"></i>Ajouter personne
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Modifier rôles d'un jour */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-edit mr-2 text-purple-500"></i>Modifier les rôles d'un jour
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jour à modifier</label>
              <select 
                value={selectedJour}
                onChange={(e) => setSelectedJour(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
              >
                <option value="">-- Sélectionner un jour --</option>
                {jours.map(jour => (
                  <option key={jour.id} value={jour.id}>{jour.nom}</option>
                ))}
              </select>
            </div>
            
            {selectedJour && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rôles actuels</label>
                <div className="mb-4">
                  {(roles[selectedJour] || []).map(role => (
                    <span key={role.id} className="planning-role-badge inline-flex items-center gap-2">
                      {role.nom}
                      <button 
                        onClick={() => handleDeleteRole(role.id, selectedJour)}
                        className="planning-remove-btn hover:text-red-200"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </span>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ajouter un rôle</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="Nom du rôle"
                      className="flex-1 px-4 py-3 rounded-lg"
                    />
                    <button 
                      onClick={handleAddRoleToJour}
                      className="planning-btn-gradient px-6 py-3 rounded-lg font-semibold"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modifier disponibilités */}
        <div className="bg-white rounded-xl p-6 shadow-lg planning-card-hover">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-user-edit mr-2 text-orange-500"></i>Modifier les disponibilités
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Personne à modifier</label>
              <select 
                value={selectedPersonne}
                onChange={(e) => setSelectedPersonne(e.target.value)}
                className="w-full px-4 py-3 rounded-lg"
              >
                <option value="">-- Sélectionner une personne --</option>
                {personnes.map(personne => (
                  <option key={personne.id} value={personne.id}>{personne.prenom || personne.nom}</option>
                ))}
              </select>
            </div>
            
            {selectedPersonne && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Disponibilités</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {jours.map(jour => {
                    const personne = personnes.find(p => p.id === parseInt(selectedPersonne));
                    const personneDisponibilites = getDisponibilitesForPersonne(parseInt(selectedPersonne));
                    const isDisponible = personneDisponibilites.includes(jour.id);
                    
                    return (
                      <div key={jour.id} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`modif-dispo-${jour.id}`}
                          checked={isDisponible}
                          onChange={(e) => {
                            // In a full implementation, update the database
                          }}
                          className="cursor-pointer"
                        />
                        <label htmlFor={`modif-dispo-${jour.id}`} className="cursor-pointer text-gray-700">
                          {jour.nom}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listes actuelles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-calendar mr-2 text-blue-500"></i>Jours configurés
          </h4>
          <div className="space-y-2" style={{ minHeight: '50px' }}>
            {jours.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun jour configuré</p>
            ) : (
              jours.map(jour => (
                <div key={jour.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg planning-draggable-day">
                  <span className="font-medium text-gray-700 cursor-move">
                    <i className="fas fa-grip-vertical mr-2"></i>
                    {jour.nom}
                  </span>
                  <button 
                    onClick={() => handleDeleteJour(jour.id)}
                    className="text-red-500 hover:text-red-700 planning-remove-btn"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-tasks mr-2 text-purple-500"></i>Rôles par jour
          </h4>
          <div className="space-y-3">
            {jours.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun rôle configuré</p>
            ) : (
              jours.map(jour => (
                <div key={jour.id} className="bg-purple-50 p-3 rounded-lg">
                  <div className="font-semibold text-gray-700 mb-2">{jour.nom}</div>
                  <div className="flex flex-wrap gap-1">
                    {(roles[jour.id] || []).map(role => (
                      <span key={role.id} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                        {role.nom}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <i className="fas fa-users mr-2 text-green-500"></i>Personnes
          </h4>
          <div className="space-y-2">
            {personnes.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune personne ajoutée</p>
            ) : (
              personnes.map(personne => (
                <div key={personne.id} className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-700">
                      {personne.prenom || personne.nom}
                    </span>
                    <button 
                      onClick={() => handleDeletePersonne(personne.id)}
                      className="text-red-500 hover:text-red-700 planning-remove-btn"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    <i className="fas fa-calendar-check mr-1"></i>
                    {jours.length > 0 ? 'Disponible pour certains jours' : 'Aucun jour configuré'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningConfiguration;