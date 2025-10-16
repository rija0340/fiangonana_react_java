import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || (path === '/' && location.pathname === '');
    };

    return (
        <div className="flex h-screen bg-gray-200">
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
                <div className="p-4">
                    <h2 className={`${isSidebarOpen ? 'block' : 'hidden'} text-xl font-bold text-gray-800`}>Dashboard</h2>
                </div>
                <nav className="mt-4">
                    <Link
                        to="/"
                        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/') ? 'bg-gray-100' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className={`${isSidebarOpen ? 'ml-3' : 'hidden'}`}>Home</span>
                    </Link>
                    <Link
                        to="/membres"
                        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/membres') ? 'bg-gray-100' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className={`${isSidebarOpen ? 'ml-3' : 'hidden'}`}>Membres</span>
                    </Link>
                    <Link
                        to="/kilasys"
                        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/kilasys') ? 'bg-gray-100' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className={`${isSidebarOpen ? 'ml-3' : 'hidden'}`}>Kilasy</span>
                    </Link>
                    <Link
                        to="/familles"
                        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/familles') ? 'bg-gray-100' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className={`${isSidebarOpen ? 'ml-3' : 'hidden'}`}>Familles</span>
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Top Navigation */}
                <header className="bg-white shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-gray-500 hover:text-gray-600 focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="flex items-center">
                            <span className="text-gray-800">Welcome, Admin</span>
                        </div>
                    </div>
                </header>

                {/* Nested Route Content */}
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard; 