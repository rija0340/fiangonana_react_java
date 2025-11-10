import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './planningStyles.css';
import PlanningConfiguration from './PlanningConfiguration';
import PlanningDisplay from './PlanningDisplay';
import PlanningStatistics from './PlanningStatistics';

const Planning = () => {
  const [currentTab, setCurrentTab] = useState('configurer');
  const [configExpanded, setConfigExpanded] = useState(true);
  const [nbSemaines, setNbSemaines] = useState(4);
  const [modeEquite, setModeEquite] = useState(true);
  const [modeDebug, setModeDebug] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

  const navigate = useNavigate();

  const switchTab = (tabName) => {
    setCurrentTab(tabName);
  };

  const toggleConfig = () => {
    setConfigExpanded(!configExpanded);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionner les dates</label>
              <DatePicker
                selected={null}
                onChange={(dates) => setSelectedDates(dates)}
                selectsMultiple
                dateFormat="dd/MM/yyyy"
                placeholderText="Cliquez pour sélectionner plusieurs dates"
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
          {selectedDates.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Dates sélectionnées:</label>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {date.toLocaleDateString('fr-FR')}
                  </span>
                ))}
              </div>
            </div>
          )}
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
          {currentTab === 'configurer' && <PlanningConfiguration nbSemaines={nbSemaines} />}
          {currentTab === 'planning' && <PlanningDisplay 
            nbSemaines={nbSemaines} 
            modeEquite={modeEquite}
            modeDebug={modeDebug}
          />}
          {currentTab === 'statistiques' && <PlanningStatistics />}
        </div>
      </div>
    </div>
  );
};

export default Planning;