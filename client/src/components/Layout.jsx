import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Box, ClipboardList, Calendar, Search, Bell, User } from 'lucide-react';

const Layout = () => {
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Equipment', path: '/equipment', icon: Box },
        { name: 'Requests', path: '/request', icon: ClipboardList },
        { name: 'Calendar', path: '/calendar', icon: Calendar },
    ];

    return (
        <div className="flex h-screen bg-pastel-gray font-sketch">
            {/* Sidebar */}
            <aside className="w-64 border-r-3 border-black bg-white flex flex-col">
                <div className="p-6 border-b-3 border-black">
                    <h1 className="text-2xl font-bold italic tracking-tighter">MaintSync.</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 p-3 rounded-lg border-2 border-transparent transition-all ${isActive ? 'bg-pastel-blue border-black shadow-sketch-sm translate-x-[2px] translate-y-[2px]' : 'hover:bg-slate-100'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-bold">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 border-b-3 border-black bg-white flex items-center justify-between px-6">
                    <div className="flex items-center bg-slate-100 border-2 border-black px-3 py-1 w-96">
                        <Search size={18} className="text-slate-500 mr-2" />
                        <input type="text" placeholder="Search activities..." className="bg-transparent outline-none w-full" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 border-2 border-transparent hover:border-black rounded-full transition-all">
                            <Bell size={20} />
                        </button>
                        <div className="flex items-center space-x-2 p-1 pl-3 border-2 border-black rounded-full bg-pastel-yellow">
                            <span className="font-bold text-sm">Riya</span>
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                                <User size={18} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
