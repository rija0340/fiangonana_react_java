import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PlanningStats = ({ plan }) => {
    const [stats, setStats] = useState({
        roleDistribution: [],
        memberActivity: [],
        attendanceRate: 0
    });

    useEffect(() => {
        if (plan) {
            calculateStats();
        }
    }, [plan]);

    const calculateStats = () => {
        if (!plan || !plan.assignments) return;

        // Calculate role distribution
        const roleDistributionMap = {};
        const memberActivityMap = {};
        let totalAssignments = 0;

        // Process assignments to get role and member distribution
        Object.entries(plan.assignments).forEach(([key, memberId]) => {
            const [date, roleId] = key.split('_');
            if (memberId) {
                // Update role distribution
                roleDistributionMap[roleId] = (roleDistributionMap[roleId] || 0) + 1;
                
                // Update member activity
                memberActivityMap[memberId] = (memberActivityMap[memberId] || 0) + 1;
                totalAssignments++;
            }
        });

        // Prepare data for role distribution chart
        const roleDistribution = Object.entries(roleDistributionMap).map(([roleId, count]) => {
            // We'll replace with actual role name later
            return { roleId, count };
        });

        // Prepare data for member activity chart
        const memberActivity = Object.entries(memberActivityMap).map(([memberId, count]) => {
            return { memberId: parseInt(memberId), count };
        });

        // Sort member activity by count (descending)
        memberActivity.sort((a, b) => b.count - a.count);

        setStats({
            roleDistribution,
            memberActivity,
            attendanceRate: totalAssignments > 0 ? (totalAssignments / (plan.selectedDates?.length || 1)) : 0
        });
    };

    const roleDistributionData = {
        labels: stats.roleDistribution.map((_, index) => `Rôle ${index + 1}`),
        datasets: [
            {
                label: 'Nombre d\'affectations',
                data: stats.roleDistribution.map(item => item.count),
                backgroundColor: [
                    'rgba(63, 81, 181, 0.8)',
                    'rgba(244, 67, 54, 0.8)',
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(156, 39, 176, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                ],
            },
        ],
    };

    const memberActivityData = {
        labels: stats.memberActivity.slice(0, 10).map(item => {
            // In a real implementation, we would get the actual member names
            return `Membre ${item.memberId}`;
        }),
        datasets: [
            {
                label: 'Nombre d\'affectations',
                data: stats.memberActivity.slice(0, 10).map(item => item.count),
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
            },
        ],
    };

    if (!plan) {
        return <div className="p-6 text-center">Veuillez sélectionner un planning pour voir les statistiques.</div>;
    }

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-chart-pie text-primary"></i> Statistiques du Planning : <span className="text-primary">{plan.nom}</span>
                    </h3>
                    <p className="text-sm text-slate-600">Analyse des affectations et de l'activité</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Rate Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Taux d'occupation</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{(stats.attendanceRate || 0).toFixed(1)}</p>
                                <p className="text-xs text-slate-500 mt-1">affectations par date</p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <i className="fa-solid fa-calendar-check text-indigo-600 text-xl"></i>
                            </div>
                        </div>
                    </div>

                    {/* Total Assignments Card */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total des affectations</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{Object.keys(plan.assignments || {}).length}</p>
                                <p className="text-xs text-slate-500 mt-1">rôles assignés</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <i className="fa-solid fa-people-group text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Role Distribution */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-chart-pie text-purple-500"></i> Distribution des Rôles
                        </h4>
                        {stats.roleDistribution.length > 0 ? (
                            <div className="h-80">
                                <Pie 
                                    data={roleDistributionData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                            },
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-slate-500">
                                Aucune donnée à afficher
                            </div>
                        )}
                    </div>

                    {/* Member Activity */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                        <h4 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-chart-bar text-blue-500"></i> Activité des Membres (Top 10)
                        </h4>
                        {stats.memberActivity.length > 0 ? (
                            <div className="h-80">
                                <Bar 
                                    data={memberActivityData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                            },
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-slate-500">
                                Aucune donnée à afficher
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanningStats;
