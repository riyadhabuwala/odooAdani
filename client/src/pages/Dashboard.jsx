import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import io from 'socket.io-client';

const Dashboard = () => {
    const [stats, setStats] = useState({ criticalEquipment: 0, technicianLoad: 75, openRequests: 0 });

    useEffect(() => {
        const socket = io('http://localhost:5000');
        socket.on('dashboard_stats', (data) => setStats(data));
        return () => socket.disconnect();
    }, []);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-black italic">Work Center Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="sketch-card bg-maint-red"><div className="text-4xl font-black">{stats.criticalEquipment}</div><h3 className="font-bold">Critical Equipment</h3></div>
                <div className="sketch-card bg-maint-blue"><div className="text-4xl font-black">{stats.technicianLoad}%</div><h3 className="font-bold">Technician Load</h3></div>
                <div className="sketch-card bg-maint-green"><div className="text-4xl font-black">{stats.openRequests}</div><h3 className="font-bold">Open Requests</h3></div>
            </div>
        </div>
    );
};

export default Dashboard;
