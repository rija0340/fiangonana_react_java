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

  const updateStats = () => {
    if (!currentPlan || !chartRef.current) return;

    const counts = Object.fromEntries(currentPlan.selectedPeople.map(p => [p, 0]));
    Object.values(currentPlan.assignments || {}).forEach(p => {
      if (p) counts[p]++;
    });

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new Chart(chartRef.current.getContext('2d'), {
      type: 'bar',
      data: {
        labels: Object.keys(counts),
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