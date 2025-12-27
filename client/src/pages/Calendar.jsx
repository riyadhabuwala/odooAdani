import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '../lib/api';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('Month');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthLabel = useMemo(
        () => currentDate.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
        [currentDate]
    );

    const startOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate]);
    const endOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999), [currentDate]);

    const todayKey = useMemo(() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/requests', {
                    params: {
                        from: startOfMonth.toISOString(),
                        to: endOfMonth.toISOString(),
                    },
                });
                if (!mounted) return;
                setRequests(res.data || []);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [startOfMonth, endOfMonth]);

    const colorForRequest = (r) => {
        const s = String(r.status || '').toLowerCase();
        if (s.includes('scrap')) return 'bg-maint-red';
        if (s.includes('repaired')) return 'bg-maint-green';
        if (s.includes('progress')) return 'bg-maint-yellow';
        return 'bg-maint-blue';
    };

    const requestsByDay = useMemo(() => {
        const map = new Map();
        for (const r of requests) {
            const dt = new Date(r.scheduled_start || r.created_at);
            if (Number.isNaN(dt.getTime())) continue;
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            const list = map.get(key) || [];
            list.push(r);
            map.set(key, list);
        }
        return map;
    }, [requests]);

    const monthCells = useMemo(() => {
        const firstDow = startOfMonth.getDay();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        // ensure at least 5 rows
        while (cells.length < 35) cells.push(null);
        return cells;
    }, [currentDate, startOfMonth]);

    const rowsClass = monthCells.length > 35 ? 'grid-rows-6' : 'grid-rows-5';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <h2 className="text-4xl font-black tracking-tighter italic font-sketch">{monthLabel}</h2>
                    <div className="flex border-2 border-gray-900">
                        <button
                            className="p-2 border-r-2 border-gray-900 hover:bg-gray-100"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            type="button"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="p-2 hover:bg-gray-100"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            type="button"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex border-2 border-gray-900 bg-white">
                        {['Month', 'Week', 'Day'].map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => setView(v)}
                                className={`px-4 py-2 font-black text-xs uppercase border-r-2 last:border-r-0 border-gray-900 ${view === v ? 'bg-maint-blue shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <button className="sketch-button py-2 px-4 font-bold text-xs">
                        <Filter size={16} />
                        ALL TECHNICIANS
                    </button>
                </div>
            </div>

            <div className="sketch-card bg-white p-0 overflow-hidden">
                <div className="grid grid-cols-7 border-b-2 border-gray-900 bg-gray-50">
                    {days.map(day => (
                        <div key={day} className="p-4 text-center font-black uppercase text-xs tracking-widest border-r-2 last:border-r-0 border-gray-900">
                            {day}
                        </div>
                    ))}
                </div>

                <div className={`grid grid-cols-7 ${rowsClass}`}>
                    {monthCells.map((day, idx) => {
                        if (!day) {
                            return (
                                <div key={`empty-${idx}`} className="min-h-32 p-2 border-r-2 border-b-2 last:border-r-0 border-gray-900 bg-gray-50/40" />
                            );
                        }

                        const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = key === todayKey;
                        const dayReqs = requestsByDay.get(key) || [];

                        return (
                            <div
                                key={key}
                                className={`min-h-32 p-2 border-r-2 border-b-2 last:border-r-0 border-gray-900 relative ${isToday ? 'bg-white shadow-inner' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="relative">
                                        {isToday && (
                                            <div className="absolute -left-2 -top-1 w-7 h-7 rounded-full bg-maint-red border-2 border-gray-900" />
                                        )}
                                        <span className={`relative text-sm font-black ${isToday ? 'text-gray-900' : 'opacity-50'}`}>{day}</span>
                                    </div>
                                    {loading && day === 1 && (
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Loading…</span>
                                    )}
                                </div>

                                <div className="mt-2 space-y-1">
                                    {dayReqs.slice(0, 4).map((r) => {
                                        const dt = new Date(r.scheduled_start || r.created_at);
                                        const time = Number.isNaN(dt.getTime()) ? '' : dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        return (
                                            <div
                                                key={r.id}
                                                className={`p-1 border-2 border-gray-900 text-[10px] font-black uppercase truncate ${colorForRequest(r)} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                                                title={`${r.equipment_name} • ${r.status}`}
                                            >
                                                {time ? `${time} — ` : ''}{r.equipment_name}
                                            </div>
                                        );
                                    })}
                                    {dayReqs.length > 4 && (
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">+{dayReqs.length - 4} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-8 justify-center items-center py-4 opacity-70">
                {['Corrective', 'Preventive', 'Inspection', 'Installation'].map((type, i) => (
                    <div key={type} className="flex items-center gap-2">
                        <div className={`w-3 h-3 border-2 border-gray-900 ${['bg-maint-red', 'bg-maint-green', 'bg-maint-blue', 'bg-maint-yellow'][i]}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
