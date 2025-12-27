import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings2, ClipboardList } from 'lucide-react';

const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-outfit">
            <aside className="w-64 border-r-2 border-gray-900 bg-white">
                <div className="p-6 border-b-2 border-gray-900"><h1 className="text-2xl font-black">MaintSync</h1></div>
                <nav className="p-4 space-y-2">
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-2 border-transparent"><LayoutDashboard size={20} /> <span className="font-bold">Dashboard</span></Link>
                    <Link to="/equipment" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-2 border-transparent"><Settings2 size={20} /> <span className="font-bold">Equipment</span></Link>
                    <Link to="/maintenance/new" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-2 border-transparent"><ClipboardList size={20} /> <span className="font-bold">Requests</span></Link>
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto"><Outlet /></main>
        </div>
    );
};
export default Layout;
