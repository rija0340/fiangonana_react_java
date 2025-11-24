import React, { useState, useEffect } from 'react';
import { usePlanning } from './PlanningStateProvider';
import membreApi from '../../membre/services/api';

const DAY_NAMES = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Sabbat' };

const PlanningGlobalTab = () => {
  const {
    store,
    setStore,
    currentPlan,
    newRoleName,
    setNewRoleName,
    roleDayType,
    setRoleDayType,
    addRole,
    removeGlobalRole,
    setToast
  } = usePlanning();

  const [membres, setMembres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    sexe: "all",
    baptise: "all",
    categorie: "all",
    source: "all",
  });
  const [selectedPeople, setSelectedPeople] = useState([]);

  useEffect(() => {
    // Fetch members with filters
    membreApi.getAll(filters).then(response => {
      const data = response;
      setMembres(data);
    }).catch(error => {
      console.error('Error fetching membres:', error);
    });

    // Fetch categories for the filter
    membreApi.getCategories().then(response => {
      setCategories(response);
    }).catch(error => {
      console.error('Error fetching categories:', error);
    });

    // Initialize selected people from store if available
    if (store.global.people) {
      setSelectedPeople(store.global.people.map(p => p.id));
    }
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const togglePersonSelection = (personId) => {
    setSelectedPeople(prev => {
      const isSelected = prev.includes(personId);
      const newSelected = isSelected
        ? prev.filter(id => id !== personId)
        : [...prev, personId];

      // Update the store global people with selected members
      const selectedMembres = membres.filter(m => newSelected.includes(m.id));

      // Update the store in the context
      setStore(prevStore => {
        // Update currentPlan.selectedPeople if a plan is selected
        const updatedPlans = currentPlan
          ? prevStore.plans.map(p =>
              p.id === currentPlan.id
                ? { ...p, selectedPeople: newSelected }
                : p
            )
          : prevStore.plans;

        return {
          ...prevStore,
          global: {
            ...prevStore.global,
            people: selectedMembres
          },
          plans: updatedPlans
        };
      });

      return newSelected;
    });
  };

  const selectAllMembers = () => {
    const allMemberIds = membres.map(m => m.id);
    setSelectedPeople(allMemberIds);

    // Update the store in the context
    setStore(prevStore => {
      // Update currentPlan.selectedPeople if a plan is selected
      const updatedPlans = currentPlan
        ? prevStore.plans.map(p =>
            p.id === currentPlan.id
              ? { ...p, selectedPeople: allMemberIds }
              : p
          )
        : prevStore.plans;

      return {
        ...prevStore,
        global: {
          ...prevStore.global,
          people: membres
        },
        plans: updatedPlans
      };
    });
  };

  const deselectAllMembers = () => {
    setSelectedPeople([]);

    // Update the store in the context
    setStore(prevStore => {
      // Update currentPlan.selectedPeople if a plan is selected
      const updatedPlans = currentPlan
        ? prevStore.plans.map(p =>
            p.id === currentPlan.id
              ? { ...p, selectedPeople: [] }
              : p
          )
        : prevStore.plans;

      return {
        ...prevStore,
        global: {
          ...prevStore.global,
          people: []
        },
        plans: updatedPlans
      };
    });
  };

  const handleAddRole = async () => {
    const name = newRoleName.trim();
    if (name) {
      try {
        // Create role with the selected day type
        await addRole(roleDayType, name);

        // Also add to backend
        await import('axios').then(axios =>
          axios.default.post('http://localhost:8082/api/roles', {
            nom: name,
            jour: { id: parseInt(roleDayType) }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
        );
      } catch (e) {
        console.error("Error adding role:", e);
        // Even if backend fails, we'll still update the frontend for better UX
        addRole(roleDayType, name);
      }
    }
  };

  const handleRemoveRole = async (dayType, role) => {
    try {
      // Try to delete from backend first
      await import('axios').then(axios =>
        axios.default.delete(`http://localhost:8082/api/roles/name/${encodeURIComponent(role)}`)
      );
    } catch (e) {
      console.error("Error deleting role from backend:", e);
      // Proceed with frontend update anyway
    }

    removeGlobalRole(dayType, role);
  };

  return (
    <div className="space-y-6">
      {/* Role Management Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-globe text-blue-500"></i> Rôles (Global)
        </h3>
        <div className="mb-3">
          <select
            value={roleDayType}
            onChange={(e) => setRoleDayType(e.target.value)}
            className="w-full p-2 border rounded text-sm mb-2 bg-slate-50"
          >
            <option value="0">Dimanche</option>
            <option value="6">Sabbat / Samedi</option>
            <option value="5">Vendredi Soir</option>
            <option value="3">Mercredi</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="flex-1 p-2 border rounded text-sm"
              placeholder="Nouveau rôle..."
            />
            <button
              onClick={handleAddRole}
              className="bg-blue-500 text-white px-3 rounded"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
        <ul className="h-40 overflow-y-auto custom-scroll space-y-1 text-sm">
          {(store.global.rolesConfig[roleDayType] || []).map((r, idx) => (
            <li key={idx} className="flex items-center justify-between px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              <span>{r}</span>
              <button
                onClick={() => handleRemoveRole(roleDayType, r)}
                className="text-blue-500 hover:text-red-500 text-xs"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Member Filter and Selection Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-users text-blue-500"></i> Base de Membres (Global)
        </h3>
        
        {/* Filters */}
        <div className="p-4 bg-slate-50 border border-slate-100 mb-5">
          <h2 className="text-lg font-semibold mb-3">Filtrer les membres</h2>

          {/* Search */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Nom ou Prénom</span>
            </label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Sexe Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Sexe</span>
              </label>
              <div className="flex gap-4">
                {["all", "homme", "femme"].map((value) => (
                  <label key={value} className="label cursor-pointer">
                    <input
                      type="radio"
                      name="sexe"
                      className="radio radio-primary"
                      checked={filters.sexe === value}
                      onChange={() => handleFilterChange("sexe", value)}
                    />
                    <span className="label-text capitalize ml-2">{value}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Baptisé(e) Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Baptisé(e)</span>
              </label>
              <div className="flex gap-4">
                {[
                  { label: "all", value: "all" },
                  { label: "baptisé", value: "true" },
                  { label: "non baptisé", value: "false" },
                ].map((item) => (
                  <label key={item.value} className="label cursor-pointer">
                    <input
                      type="radio"
                      name="baptise"
                      className="radio radio-secondary"
                      checked={filters.baptise === item.value}
                      onChange={() => handleFilterChange("baptise", item.value)}
                    />
                    <span className="label-text capitalize ml-2">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categorie Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Catégorie</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.categorie}
                onChange={(e) => handleFilterChange("categorie", e.target.value)}
              >
                <option value="all">Toutes les catégories</option>
                <option value="non_categorie">Non catégorisé</option>
                <option value="categorie">Catégorisé</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Source</span>
              </label>
              <div className="flex gap-4">
                {["all", "acms", "manuel"].map((value) => (
                  <label key={value} className="label cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      className="radio radio-primary"
                      checked={filters.source === value}
                      onChange={() => handleFilterChange("source", value)}
                    />
                    <span className="label-text capitalize ml-2">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="mb-3 flex gap-2 justify-end">
          <button
            onClick={selectAllMembers}
            className="btn btn-sm btn-outline btn-primary"
          >
            <i className="fa-solid fa-check-double mr-1"></i>
            Tout sélectionner
          </button>
          <button
            onClick={deselectAllMembers}
            className="btn btn-sm btn-outline btn-error"
          >
            <i className="fa-solid fa-times mr-1"></i>
            Tout désélectionner
          </button>
        </div>

        {/* Membre List with selection */}
        <div className="overflow-y-auto max-h-96">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr>
                <th className="p-2 w-10 text-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedPeople.length === membres.length && membres.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllMembers();
                      } else {
                        deselectAllMembers();
                      }
                    }}
                  />
                </th>
                <th className="p-2 text-left font-semibold">Nom</th>
                <th className="p-2 text-left font-semibold">Prénom</th>
                <th className="p-2 text-left font-semibold">Sexe</th>
                <th className="p-2 text-center font-semibold">Baptisé(e)</th>
                <th className="p-2 text-center font-semibold">Catégorie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {membres.map((membre) => {
                const isSelected = selectedPeople.includes(membre.id);
                return (
                  <tr key={membre.id} className={`${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isSelected}
                        onChange={() => togglePersonSelection(membre.id)}
                      />
                    </td>
                    <td className="p-2 font-medium text-slate-700">{membre.nom || '—'}</td>
                    <td className="p-2 font-medium text-slate-700">{membre.prenom || '—'}</td>
                    <td className="p-2 text-slate-600">{membre.sexe || '—'}</td>
                    <td className="p-2 text-center">
                      {membre.date_bapteme && membre.date_bapteme !== '' ? 
                        <span className="badge badge-success badge-sm">baptisé</span> : 
                        <span className="badge badge-error badge-sm">non-baptisé</span>}
                    </td>
                    <td className="p-2 text-center text-slate-600">{membre.categorie || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Members Summary */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">
              Membres sélectionnés : {selectedPeople.length}
            </span>
            <button
              className="btn btn-xs btn-outline btn-primary"
              onClick={() => {
                // Select all visible members
                const allIds = membres.map(m => m.id);
                setSelectedPeople(allIds);
                
                setStore(prevStore => ({
                  ...prevStore,
                  global: {
                    ...prevStore.global,
                    people: membres
                  }
                }));
              }}
            >
              Tout sélectionner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningGlobalTab;