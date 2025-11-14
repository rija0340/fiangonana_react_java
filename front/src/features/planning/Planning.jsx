import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './planningStyles.css';
import PlanningConfiguration from './PlanningConfiguration';
import PlanningDisplay from './PlanningDisplay';
import PlanningStatistics from './PlanningStatistics';
import planningSessionApi from '../../api/planningSession';

const Planning = () => {
  const [currentTab, setCurrentTab] = useState('configurer');
  const [configExpanded, setConfigExpanded] = useState(true);
  const [nbSemaines, setNbSemaines] = useState(4);
  const [modeEquite, setModeEquite] = useState(true);
  const [modeDebug, setModeDebug] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [membresSelectionnes, setMembresSelectionnes] = useState([]);
  const [rolesParTypeJour, setRolesParTypeJour] = useState({}); // {jourIndex: [roles]}
  const [disponibilitesParDate, setDisponibilitesParDate] = useState({}); // {date: {personneId: true/false}}
  const [planning, setPlanning] = useState([]);
  const [message, setMessage] = useState('');
  const [planningSessions, setPlanningSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newSessionName, setNewSessionName] = useState('');

  const navigate = useNavigate();

  const switchTab = (tabName) => {
    setCurrentTab(tabName);
  };

  const toggleConfig = () => {
    setConfigExpanded(!configExpanded);
  };

  // Load planning sessions on component mount
  useEffect(() => {
    const loadPlanningSessions = async () => {
      try {
        const sessions = await planningSessionApi.getAll();
        setPlanningSessions(sessions);
        if (sessions.length > 0) {
          setSelectedSessionId(sessions[0].id);
        }
      } catch (error) {
        console.error('Error loading planning sessions:', error);
      }
    };
    
    loadPlanningSessions();
  }, []);

  // Enhanced planning generation algorithm
  const generatePlanning = async () => {
    if (!selectedSessionId) {
      setMessage('Veuillez sélectionner ou créer une session de planning d\'abord.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (selectedDates.length === 0) {
      setMessage('Veuillez sélectionner des dates d\'abord.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (membresSelectionnes.length === 0) {
      setMessage('Veuillez sélectionner des membres d\'abord.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (Object.keys(rolesParTypeJour).length === 0) {
      setMessage('Veuillez configurer des rôles d\'abord.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Create a counter for each selected member
    const compteurs = {};
    membresSelectionnes.forEach(id => compteurs[id] = 0);

    const newPlanning = [];
    const erreurs = [];

    // Sort dates
    const datesTriees = [...selectedDates].sort();

    for (const date of datesTriees) {
      const dateObj = new Date(date);
      const jourIndex = dateObj.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
      const rolesDuJour = rolesParTypeJour[jourIndex] || [];

      if (rolesDuJour.length === 0) {
        continue;
      }

      // Filter available members for this date
      const personnesDisponibles = membresSelectionnes.filter(membreId =>
        disponibilitesParDate[date]?.[membreId]
      );

      if (personnesDisponibles.length === 0) {
        erreurs.push(`${date}: Aucune personne disponible`);
        continue;
      }

      // Filter people not already assigned on this date
      const personnesDejaAssignees = newPlanning
          .filter(aff => aff.date === date)
          .map(aff => aff.membre.id);

      let personnesEligibles = personnesDisponibles.filter(p =>
          !personnesDejaAssignees.includes(p)
      );

      if (personnesEligibles.length === 0) {
        erreurs.push(`${date}: Aucune personne disponible (contrainte respectée)`);
        continue;
      }

      for (const role of rolesDuJour) {
        // Check if role is already assigned on this date
        const roleDejaAssigne = newPlanning.some(aff =>
            aff.date === date && aff.role.nom === role
        );

        if (roleDejaAssigne) {
          continue;
        }

        let personneTrouvee = null;

        // Rotation rule: prioritize people who haven't done this role
        const personnesSansRole = personnesEligibles.filter(p => {
          return !newPlanning.some(aff => aff.membre.id === p && aff.role.nom === role);
        });

        if (personnesSansRole.length > 0) {
          personnesEligibles = personnesSansRole;
        }

        if (modeEquite) {
          // Find person with least assignments
          const minCompteur = Math.min(...personnesEligibles.map(p => compteurs[p]));
          const candidats = personnesEligibles.filter(p => compteurs[p] === minCompteur);

          personneTrouvee = candidats[Math.floor(Math.random() * candidats.length)];
        } else {
          // Random mode
          personneTrouvee = personnesEligibles[
              Math.floor(Math.random() * personnesEligibles.length)
          ];
        }

        if (personneTrouvee) {
          const nomJour = ["Dimanche", "Lundi", "Membre", "Mercredi", "Jeudi", "Vendredi", "Samedi"][jourIndex];
          
          // Calculate week number
          const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
          const days = Math.floor((dateObj - startOfYear) / (24 * 60 * 60 * 1000));
          const numeroSemaine = Math.ceil((days + 1) / 7);

          // Find the membre object (this would need to be implemented to get actual member data)
          const membre = {
            id: personneTrouvee,
            nom: "Membre " + personneTrouvee,
            prenom: "Membre " + personneTrouvee
          };

          newPlanning.push({
            date: date,
            jour: { id: jourIndex, nom: nomJour },
            role: { nom: role },
            membre: membre,
            numeroSemaine: numeroSemaine,
            session: { id: selectedSessionId }
          });
          compteurs[personneTrouvee]++;

          // Remove person from eligible list for this date
          personnesEligibles = personnesEligibles.filter(p => p !== personneTrouvee);
        }
      }
    }

    setPlanning(newPlanning);

    if (erreurs.length > 0 && modeDebug) {
      console.log('Erreurs:', erreurs);
    }
    
    setMessage('Planning généré avec succès !');
    setTimeout(() => setMessage(''), 3000);
  };

  // Create a new planning session
  const createNewSession = async () => {
    if (!newSessionName.trim()) {
      setMessage('Veuillez entrer un nom pour la nouvelle session.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    try {
      const newSession = await planningSessionApi.create({ nom: newSessionName });
      setPlanningSessions([...planningSessions, newSession]);
      setSelectedSessionId(newSession.id);
      setNewSessionName('');
      setMessage('Nouvelle session créée avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating planning session:', error);
      setMessage('Erreur lors de la création de la session: ' + error.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Delete a planning session
  const deleteSession = async (sessionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session de planning ?')) {
      try {
        await planningSessionApi.delete(sessionId);
        const updatedSessions = planningSessions.filter(session => session.id !== sessionId);
        setPlanningSessions(updatedSessions);
        
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
        }
        
        setMessage('Session supprimée avec succès !');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting planning session:', error);
        setMessage('Erreur lors de la suppression de la session: ' + error.message);
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto planning-container">
      {/* Header */}
      <div className="planning-glass-effect rounded-2xl p-8 mb-8 text-center planning-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
          <i className="fas fa-calendar-alt mr-3 text-gray-700"></i>Planning d'Affectation de Rôles Religieux
        </h1>
        <p className="text-gray-600 text-lg">Génération automatique équilibrée sur plusieurs semaines</p>
      </div>

      {/* Planning Session Selector */}
      <div className="planning-glass-effect rounded-2xl p-6 mb-8 planning-fade-in">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner une session de planning</label>
            <select
              value={selectedSessionId || ''}
              onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : null)}
              className="w-full md:w-80 px-4 py-3 rounded-lg border-2 border-gray-300"
            >
              <option value="">-- Sélectionner une session --</option>
              {planningSessions.map(session => (
                <option key={session.id} value={session.id}>{session.nom}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nouvelle session</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Nom de la session"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300"
                />
                <button
                  onClick={createNewSession}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  <i className="fas fa-plus mr-2"></i>Créer
                </button>
              </div>
            </div>
            
            {selectedSessionId && (
              <button
                onClick={() => deleteSession(selectedSessionId)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg h-[48px] flex items-center justify-center"
                title="Supprimer la session"
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="planning-glass-effect rounded-2xl mb-8 overflow-hidden planning-fade-in">
        <div
          className="bg-white border-b p-6 cursor-pointer flex justify-between items-center"
          onClick={toggleConfig}
        >
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <i className="fas fa-cog mr-3"></i>Configuration
          </h2>
          <i
            className={`fas fa-chevron-down text-gray-900 text-xl transition-transform duration-300 ${configExpanded ? '' : 'rotate-180'}`}
            id="configToggle"
          ></i>
        </div>
        <div
          id="configSection"
          className={`p-6 ${configExpanded ? 'planning-config-expanded' : 'planning-config-collapsed'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de semaines</label>
              <input
                type="number"
                value={nbSemaines}
                min="1"
                max="52"
                onChange={(e) => setNbSemaines(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-lg focus:outline-none"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={modeEquite}
                  onChange={(e) => setModeEquite(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-700 font-medium">Mode équité absolue</span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={modeDebug}
                  onChange={(e) => setModeDebug(e.target.checked)}
                  className="mr-3"
                />
                <span className="text-gray-700 font-medium">Afficher debug</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="planning-glass-effect rounded-2xl overflow-hidden planning-fade-in">
        <div className="flex border-b border-gray-200">
          <button
            className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 ${currentTab === 'configurer' ? 'planning-tab-button active' : ''} border-r border-gray-200`}
            onClick={() => switchTab('configurer')}
          >
            <i className="fas fa-sliders-h mr-2"></i>Configurer
          </button>
          <button
            className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 ${currentTab === 'planning' ? 'planning-tab-button active' : ''} border-r border-gray-200`}
            onClick={() => switchTab('planning')}
          >
            <i className="fas fa-calendar-week mr-2"></i>Planning
          </button>
          <button
            className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 ${currentTab === 'statistiques' ? 'planning-tab-button active' : ''}`}
            onClick={() => switchTab('statistiques')}
          >
            <i className="fas fa-chart-bar mr-2"></i>Statistiques
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {currentTab === 'configurer' && (
            <PlanningConfiguration
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              membresSelectionnes={membresSelectionnes}
              setMembresSelectionnes={setMembresSelectionnes}
              rolesParTypeJour={rolesParTypeJour}
              setRolesParTypeJour={setRolesParTypeJour}
              disponibilitesParDate={disponibilitesParDate}
              setDisponibilitesParDate={setDisponibilitesParDate}
              selectedSessionId={selectedSessionId}
            />
          )}
          {currentTab === 'planning' && (
            <PlanningDisplay
              nbSemaines={nbSemaines}
              modeEquite={modeEquite}
              modeDebug={modeDebug}
              selectedDates={selectedDates}
              rolesParTypeJour={rolesParTypeJour}
              membresSelectionnes={membresSelectionnes}
              disponibilitesParDate={disponibilitesParDate}
              planning={planning}
              setPlanning={setPlanning}
              generatePlanning={generatePlanning}
              selectedSessionId={selectedSessionId}
            />
          )}
          {currentTab === 'statistiques' && (
            <PlanningStatistics
              planning={planning}
              selectedDates={selectedDates}
              rolesParTypeJour={rolesParTypeJour}
              membresSelectionnes={membresSelectionnes}
              personnes={[]}
              selectedSessionId={selectedSessionId}
            />
          )}
        </div>
      </div>
      
      {message && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}
    </div>
  );
};

export default Planning;