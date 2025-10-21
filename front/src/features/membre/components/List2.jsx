import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FilterMatchMode } from "primereact/api";
import api from "../../membre/services/api/";

export default function PersonTable() {
  const [persons, setPersons] = useState([]);
  const [filters, setFilters] = useState({});
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const [activeFilters, setActiveFilters] = useState({});

  const ageRanges = [
    { label: "Tous", value: null },
    { label: "0 - 18 ans", value: "0-18" },
    { label: "19 - 30 ans", value: "19-30" },
    { label: "31 - 50 ans", value: "31-50" },
    { label: "51 ans et plus", value: "51-120" },
  ];

  // Fonction pour calculer l'âge à partir de la date de naissance
  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const birthDate = new Date(dateNaissance);
    if (isNaN(birthDate.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  useEffect(() => {
    setLoading(true);
    api
      .getAll()
      .then((response) => {
        // Ajouter la colonne age calculée
        const personsWithAge = response.map(person => ({
          ...person,
          age: calculateAge(person.date_naissance)
        }));
        setPersons(personsWithAge);
        setFilteredCount(personsWithAge.length);
      })
      .catch((error) => console.error("Error fetching persons:", error))
      .finally(() => setLoading(false));

    initFilters();
  }, []);

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      nom: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      prenom: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      sexe: { value: null, matchMode: FilterMatchMode.EQUALS },
      age: { value: null, matchMode: FilterMatchMode.CUSTOM },
    });
  };

  const clearFilter = () => {
    initFilters();
    setGlobalFilterValue("");
    setActiveFilters({});
    setFilteredCount(persons.length);
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleFilterApply = (filterKey, value, label) => {
    const _filters = { ...filters };
    _filters[filterKey].value = value;
    setFilters(_filters);
    
    if (value) {
      setActiveFilters((prev) => ({ ...prev, [filterKey]: { value, label } }));
    } else {
      setActiveFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[filterKey];
        return newFilters;
      });
    }
  };

  // Template du dropdown pour le filtre d'âge
  const ageFilterTemplate = (options) => (
    <Dropdown
      value={options.value}
      options={ageRanges}
      onChange={(e) => {
        const selectedRange = ageRanges.find(r => r.value === e.value);
        handleFilterApply("age", e.value, selectedRange?.label);
        options.filterCallback(e.value);
      }}
      placeholder="Filtrer par âge"
      className="p-column-filter"
      showClear
    />
  );

  // Fonction de filtrage personnalisée pour l'âge
  const ageFilterFunction = (value, filter) => {
    if (!filter) return true;
    if (value === null || value === undefined) return false;

    const [min, max] = filter.split('-').map(Number);
    return value >= min && value <= max;
  };

  const onFilter = (event) => {
    setFilteredCount(event.filteredValue ? event.filteredValue.length : persons.length);
  };

  const renderHeader = () => (
    <div className="flex justify-content-between align-items-center">
      <div className="flex align-items-center gap-2">
        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined onClick={clearFilter} />
        <span className="text-sm text-gray-600">
          {filteredCount} personne{filteredCount > 1 ? "s" : ""} affichée{filteredCount > 1 ? "s" : ""}
        </span>
      </div>
      <IconField iconPosition="left">
        <InputIcon className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Recherche globale..."
        />
      </IconField>
    </div>
  );

  const renderActiveFilters = () => {
    const entries = Object.entries(activeFilters).filter(([k, v]) => v);
    if (!entries.length) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-700">
        <strong>Filtres actifs :</strong>
        {entries.map(([key, filterData]) => (
          <span key={key} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-xl text-xs">
            {key === "age" ? filterData.label : `${key}: ${filterData.value || filterData}`}
          </span>
        ))}
      </div>
    );
  };

  // Template pour afficher l'âge
  const ageBodyTemplate = (rowData) => {
    return rowData.age !== null ? `${rowData.age} ans` : "-";
  };

  return (
    <div className="card m-5">
      <DataTable
        value={persons}
        paginator
        rows={10}
        loading={loading}
        dataKey="person_code"
        filters={filters}
        filterDisplay="menu"
        onFilter={onFilter}
        globalFilterFields={[
          "nom",
          "prenom",
          "sexe",
          "telephone",
          "occupation",
          "situation_matrimoniale",
        ]}
        header={renderHeader()}
        emptyMessage="Aucune personne trouvée."
      >
        <Column field="nom" header="Nom" filter filterPlaceholder="Nom" style={{ minWidth: "10rem" }} />
        <Column field="prenom" header="Prénom" filter filterPlaceholder="Prénom" style={{ minWidth: "10rem" }} />
        <Column field="sexe" header="Sexe" filter filterPlaceholder="Sexe" style={{ minWidth: "6rem" }} />
        <Column field="date_naissance" header="Naissance" style={{ minWidth: "10rem" }} />
        <Column
          field="age"
          header="Âge"
          body={ageBodyTemplate}
          filter
          filterDisplay ="row"
          filterElement={ageFilterTemplate}
          filterFunction={ageFilterFunction}
          showFilterMenu={false}
          style={{ minWidth: "10rem" }}
        />
        <Column field="date_bapteme" header="Baptême" style={{ minWidth: "10rem" }} />
        <Column field="telephone" header="Téléphone" style={{ minWidth: "10rem" }} />
        <Column field="situation_matrimoniale" header="Situation" style={{ minWidth: "12rem" }} />
        <Column field="occupation" header="Occupation" style={{ minWidth: "10rem" }} />
        <Column field="observations" header="Observations" style={{ minWidth: "15rem" }} />
      </DataTable>
      {renderActiveFilters()}
    </div>
  );
}