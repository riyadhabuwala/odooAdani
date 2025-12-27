import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AlertCircle, Users, ClipboardCheck, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        criticalEquipment: 0,
        technicianLoad: 0,
        openRequests: 0,
    });

    const [activities, setActivities] = useState([
        { id: 1, type: 'Repair', asset: 'HP LaserJet', status: 'In Progress', time: '2 mins ago', color: 'blue' },
        { id: 2, type: 'Maintenance', asset: 'Dell Latitude', status: 'Completed', time: '1 hour ago', color: 'green' },
        { id: 3, type: 'Scrap', asset: 'Old Monitor', status: 'Critical', time: '3 hours ago', color: 'red' },
    ]);

    useEffect(() => {
        const socket = io('http://localhost:5000');
        socket.on('dashboard_stats', (data) => {
            setStats(data);
        });
        return () => socket.disconnect();
    }, []);

    const cards = [
        { title: 'Critical Equipment', value: stats.criticalEquipment, icon: AlertCircle, color: 'bg-pastel-red' },
        { title: 'Technician Load', value: `${stats.technicianLoad}%`, icon: Users, color: 'bg-pastel-blue' },
        { title: 'Open Requests', value: stats.openRequests, icon: ClipboardCheck, color: 'bg-pastel-green' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Work Center Overview</h2>
                <p className="font-bold text-slate-500 italic">Real-time status of your maintenance pipeline.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className={`card-sketch ${card.color} flex items-center justify-between`}>
                        <div>
                            <p className="font-bold text-lg mb-1">{card.title}</p>
                            <h3 className="text-4xl font-black">{card.value}</h3>
                        </div>
                        <div className="w-12 h-12 border-3 border-black rounded-full flex items-center justify-center bg-white">
                            <card.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activities Table */}
            <div className="card-sketch bg-white">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold underline decoration-4 decoration-pastel-blue underline-offset-4">Recent Activities</h3>
                    <button className="flex items-center space-x-1 font-bold text-sm text-blue-600 hover:underline">
                        <span>View All</span>
                        <ArrowUpRight size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-3 border-black">
                                <th className="pb-3 font-black uppercase text-sm">Asset Name</th>
                                <th className="pb-3 font-black uppercase text-sm">Type</th>
                                <th className="pb-3 font-black uppercase text-sm">Status</th>
                                <th className="pb-3 font-black uppercase text-sm">Last Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-100">
                            {activities.map((act) => (
                                <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4 font-bold">{act.asset}</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 bg-slate-100 border-2 border-black text-xs font-black rounded italic">
                                            {act.type}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border-2 border-black ${act.status === 'Critical' ? 'bg-pastel-red' :
                                                act.status === 'In Progress' ? 'bg-pastel-blue' : 'bg-pastel-green'
                                            }`}>
                                            {act.status}
                                        </span>
                                    </td>
                                    <td className="py-4 font-bold text-slate-500 italic">{act.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
