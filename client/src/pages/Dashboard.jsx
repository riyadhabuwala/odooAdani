import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';

const Dashboard = () => {
    const [stats, setStats] = useState({
        criticalEquipment: 0,
        technicianLoad: 0,
        openRequests: 0,
    });

    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('dashboard_stats', (data) => {
            setStats(data);
        });

        return () => socket.disconnect();
    }, []);

    const cards = [
        { title: 'Critical Equipment', val: stats.criticalEquipment, color: 'bg-maint-red', icon: <AlertCircle />, label: 'Machines Down' },
        { title: 'Technician Load', val: `${stats.technicianLoad}%`, color: 'bg-maint-blue', icon: <Clock />, label: 'Active Utilization' },
        { title: 'Open Requests', val: stats.openRequests, color: 'bg-maint-green', icon: <CheckCircle2 />, label: 'Pending Action' },
    ];

    const recentActivity = [
        { target: 'HP LaserJet P1102', action: 'Maintenance Completed', time: '2m ago', status: 'Success' },
        { target: 'Dell Latitude 5420', action: 'Request Created', time: '15m ago', status: 'Pending' },
        { target: 'Cisco Router 2901', action: 'Parts Ordered', time: '1h ago', status: 'Process' },
        { target: 'Epson L3150', action: 'Inspection Required', time: '3h ago', status: 'Alert' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-black italic tracking-tighter">Work Center Overview</h2>
                <p className="text-gray-500 font-bold uppercase text-sm mt-1">Real-time update from floor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {cards.map((card, i) => (
                    <div key={i} className={`sketch-card ${card.color}`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="p-2 border-2 border-gray-900 bg-white">
                                {card.icon}
                            </span>
                            <span className="text-4xl font-black">{card.val}</span>
                        </div>
                        <h3 className="text-lg font-bold underline decoration-4 underline-offset-4">{card.title}</h3>
                        <p className="text-sm font-medium mt-1 uppercase text-gray-700">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="sketch-card bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black underline decoration-4 underline-offset-4">Recent Activities</h3>
                    <button className="sketch-button text-sm font-bold uppercase">View Logs</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-900 text-left">
                                <th className="pb-4 font-black uppercase text-sm px-2">Equipment</th>
                                <th className="pb-4 font-black uppercase text-sm">Action Taken</th>
                                <th className="pb-4 font-black uppercase text-sm">Timestamp</th>
                                <th className="pb-4 font-black uppercase text-sm text-right px-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-100">
                            {recentActivity.map((row, i) => (
                                <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-2 font-bold">{row.target}</td>
                                    <td className="py-4 font-medium italic">{row.action}</td>
                                    <td className="py-4 text-gray-500 font-bold">{row.time}</td>
                                    <td className="py-4 text-right px-2">
                                        <span className={`sketch-tag ${row.status === 'Success' ? 'bg-maint-green' :
                                                row.status === 'Alert' ? 'bg-maint-red' :
                                                    row.status === 'Process' ? 'bg-maint-yellow' : 'bg-maint-blue'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
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
