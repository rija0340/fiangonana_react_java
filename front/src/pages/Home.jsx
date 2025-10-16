import { useState, useEffect } from "react";
import membreApi from "../features/membre/services/api";
import familleApi from "../features/famille/services/api";
import kilasyApi from "../api/kilasy";

const Home = () => {
    const [membreCount, setMembreCount] = useState(0);
    const [familleCount, setFamilleCount] = useState(0);
    const [kilasyCount, setKilasyCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all counts in parallel
                const [membres, familles, kilasys] = await Promise.all([
                    membreApi.getAll(),
                    familleApi.getAll(),
                    kilasyApi.getAll()
                ]);
                
                setMembreCount(Array.isArray(membres) ? membres.length : 0);
                setFamilleCount(Array.isArray(familles) ? familles.length : 0);
                setKilasyCount(Array.isArray(kilasys) ? kilasys.length : 0);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="p-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Stat Card 1 - Members */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-600 text-sm">Total Membres</h2>
                            <p className="text-2xl font-semibold text-gray-800">{membreCount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Stat Card 2 - Familles */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-600 text-sm">Total Familles</h2>
                            <p className="text-2xl font-semibold text-gray-800">{familleCount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Stat Card 3 - Kilasy */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-gray-600 text-sm">Total Kilasy</h2>
                            <p className="text-2xl font-semibold text-gray-800">{kilasyCount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">New member registered</p>
                                <p className="text-xs text-gray-400">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">New famille added</p>
                                <p className="text-xs text-gray-400">5 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-600">System update completed</p>
                                <p className="text-xs text-gray-400">10 minutes ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 