import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Search, Settings2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const [globalQuery, setGlobalQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = useMemo(
        () => {
            const role = String(user?.role || '').toLowerCase();
            if (role === 'admin') {
                return [
                    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                    { to: '/equipment', label: 'Equipment', icon: <Settings2 size={20} /> },
                    { to: '/teams', label: 'Teams', icon: <Users size={20} /> },
                    { to: '/users', label: 'Users', icon: <Users size={20} /> },
                    { to: '/calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
                    { to: '/requests', label: 'Requests', icon: <ClipboardList size={20} /> },
                ];
            }
            if (role === 'technician') {
                return [
                    { to: '/requests', label: 'Requests', icon: <ClipboardList size={20} /> },
                    { to: '/calendar', label: 'Calendar', icon: <CalendarDays size={20} /> },
                ];
            }
            // employee
            return [{ to: '/requests', label: 'Requests', icon: <ClipboardList size={20} /> }];
        },
        [user?.role]
    );

    return (
        <div className="flex h-screen bg-gray-50 font-outfit">
            <aside className="w-64 border-r-2 border-gray-900 bg-white">
                <div className="p-6 border-b-2 border-gray-900"><h1 className="text-2xl font-black italic tracking-tight font-sketch">MaintSync</h1></div>
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const active = location.pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`flex items-center gap-3 px-4 py-3 border-2 border-gray-900 font-bold hover:bg-gray-50 transition-colors ${active ? 'bg-maint-blue shadow-inner' : 'bg-white'}`}
                            >
                                {item.icon} <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur border-b-2 border-gray-900">
                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full max-w-xl border-2 border-gray-900 bg-white px-3 py-2">
                            <Search size={18} />
                            <input
                                value={globalQuery}
                                onChange={(e) => setGlobalQuery(e.target.value)}
                                placeholder="Search equipment, requests..."
                                className="w-full outline-none font-bold placeholder:opacity-40"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:block text-right">
                                <div className="text-xs font-black uppercase tracking-widest opacity-60">Signed In</div>
                                <div className="font-black italic leading-tight">{user?.full_name || user?.email}</div>
                            </div>
                            <button
                                className="sketch-button font-black"
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                type="button"
                            >
                                <LogOut size={18} />
                                LOGOUT
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <Outlet context={{ globalQuery }} />
                </div>
            </main>
        </div>
    );
};
export default Layout;
