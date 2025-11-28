import React, { useRef, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { usePlanning } from './PlanningStateProvider';

Chart.register(...registerables);

const StatsTab = () => {
  const { store } = usePlanning();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Get the current plan from the store
  const currentPlan = store.plans.find(p => p.id === store.currentPlanId);

  // Helper function to get person name from person_code
  const getPersonName = (personCode) => {
    if (!personCode) return personCode;
    const person = store.global.people.find(p =>
      String(p.person_code) === String(personCode) ||
      String(p.id) === String(personCode)
    );
    if (!person) return personCode;
    if (person.prenom && person.prenom.trim()) return person.prenom;
    if (person.nom && person.nom.trim()) return person.nom;
    return person.person_code || personCode;
  };

  const updateStats = () => {
    if (!currentPlan || !chartRef.current) return;

    // Build counts using person_code as key
    const counts = Object.fromEntries((currentPlan.selectedPeople || []).map(p => [p, 0]));
    Object.values(currentPlan.assignments || {}).forEach(p => {
      if (p && counts[p] !== undefined) counts[p]++;
    });

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    // Convert person_codes to names for display labels
    const labels = Object.keys(counts).map(personCode => getPersonName(personCode));

    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Assignments',
          data: Object.values(counts),
          backgroundColor: '#6366f1'
        }]
      }
    });
  };

  useEffect(() => {
    updateStats();
  }, [currentPlan]);

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold mb-4">Statistiques du Planning</h2>
      <div className="h-80">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default StatsTab;