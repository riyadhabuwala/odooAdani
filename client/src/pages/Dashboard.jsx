import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { connectSocket } from '../lib/socket';

const Dashboard = () => {
    const [stats, setStats] = useState({ criticalEquipment: 0, technicianLoad: 75, openRequests: 0 });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/dashboard');
                if (!mounted) return;
                setStats(res.data.stats);
                setActivities(res.data.activities || []);
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        const socket = connectSocket();
        socket.on('dashboard_stats', (data) => setStats(data));

        return () => {
            mounted = false;
            socket.disconnect();
        };
    }, []);

    const statusBadge = useMemo(
        () => (status) => {
            const s = String(status || '').toLowerCase();
            if (s.includes('new')) return 'bg-maint-blue';
            if (s.includes('progress')) return 'bg-maint-yellow';
            if (s.includes('repaired')) return 'bg-maint-green';
            if (s.includes('scrap')) return 'bg-maint-red';
            return 'bg-gray-100';
        },
        []
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-black italic font-sketch">Work Center Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="sketch-card bg-maint-red"><div className="text-4xl font-black">{stats.criticalEquipment}</div><h3 className="font-bold">Critical Equipment</h3></div>
                <div className="sketch-card bg-maint-blue"><div className="text-4xl font-black">{stats.technicianLoad}%</div><h3 className="font-bold">Technician Load</h3></div>
                <div className="sketch-card bg-maint-green"><div className="text-4xl font-black">{stats.openRequests}</div><h3 className="font-bold">Open Requests</h3></div>
            </div>

            <div className="sketch-card bg-white overflow-x-auto">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-black uppercase tracking-wider">Recent Activities</h3>
                    {loading && <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Loading…</span>}
                </div>

                <table className="w-full text-left min-w-[720px]">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="pb-4 px-2 font-black uppercase text-xs">Request</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Equipment</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Technician</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Type</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center font-bold opacity-50">
                                    No recent activity yet.
                                </td>
                            </tr>
                        ) : (
                            activities.map((a) => (
                                <tr key={a.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-4 px-2 font-black">#{a.id}</td>
                                    <td className="py-4 px-2 font-bold">{a.equipment_name || a.work_center || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{a.technician_name || '—'}</td>
                                    <td className="py-4 px-2 font-bold uppercase text-xs">{a.maintenance_type}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className={`sketch-tag ${statusBadge(a.status)} font-black uppercase text-xs`}>{a.status}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
