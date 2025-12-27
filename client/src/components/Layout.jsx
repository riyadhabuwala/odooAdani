import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings2,
    ClipboardList,
    Calendar as CalendarIcon,
    Bell,
    User,
    Search,
    ChevronDown
} from 'lucide-react';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { title: 'Equipment', icon: <Settings2 size={20} />, path: '/equipment' },
        { title: 'Requests', icon: <ClipboardList size={20} />, path: '/maintenance/new' },
        { title: 'Calendar', icon: <CalendarIcon size={20} />, path: '/calendar' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-outfit">
            {/* Sidebar */}
            <aside className="w-64 border-r-2 border-gray-900 bg-white flex flex-col">
                <div className="p-6 border-b-2 border-gray-900">
                    <h1 className="text-2xl font-black tracking-tighter">MaintSync</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 border-2 border-transparent transition-all ${location.pathname === item.path
                                    ? 'bg-maint-blue border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            {item.icon}
                            <span className="font-bold">{item.title}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t-2 border-gray-900">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-none border-2 border-gray-900 bg-maint-red group relative cursor-pointer overflow-hidden">
                            <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={20} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate text-sm">Riya Dhabuwala</p>
                            <p className="text-xs text-gray-500 uppercase font-black">Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 border-b-2 border-gray-900 bg-white flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center bg-gray-100 border-2 border-gray-900 px-3 py-1.5 w-96">
                        <Search size={18} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search assets, requests..."
                            className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium ml-2 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative">
                            <Bell size={22} />
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-gray-900 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer border-2 border-gray-900 px-3 py-1.5 hover:bg-gray-50">
                            <span className="font-bold text-sm uppercase">Adani Port</span>
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
