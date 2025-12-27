import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const startOfWeek = (d) => {
    const day = startOfDay(d);
    const offset = day.getDay();
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() - offset);
};

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const Calendar = () => {
    const [activeDate, setActiveDate] = useState(() => new Date());
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequestId, setSelectedRequestId] = useState(null);

    const weekStart = useMemo(() => startOfWeek(activeDate), [activeDate]);
    const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

    const weekLabel = useMemo(() => {
        const a = weekStart.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
        const b = addDays(weekStart, 6).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
        return `${a} - ${b}`;
    }, [weekStart]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await api.get('/api/requests', {
                    params: {
                        from: weekStart.toISOString(),
                        to: weekEnd.toISOString(),
                    },
                });
                if (!mounted) return;
                setRequests(Array.isArray(res.data) ? res.data : []);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [weekStart, weekEnd]);

    const scheduled = useMemo(() => {
        return (requests || []).filter((r) => !!r?.scheduled_start || !!r?.scheduled_end);
    }, [requests]);

    const selectedRequest = useMemo(() => {
        if (!selectedRequestId) return null;
        return (scheduled || []).find((r) => String(r.id) === String(selectedRequestId)) || null;
    }, [scheduled, selectedRequestId]);

    const colorForStatus = (status) => {
        const s = String(status || '').toLowerCase();
        if (s.includes('scrap')) return 'bg-maint-red';
        if (s.includes('repaired')) return 'bg-maint-green';
        if (s.includes('progress')) return 'bg-maint-yellow';
        return 'bg-maint-blue';
    };

    const HOURS_START = 6;
    const HOURS_END = 23;
    const SLOT_HEIGHT = 52; // px per hour (more readable)
    const gridHeight = (HOURS_END - HOURS_START + 1) * SLOT_HEIGHT;

    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const eventsByDayIndex = useMemo(() => {
        const map = new Map();
        for (let i = 0; i < 7; i++) map.set(i, []);

        for (const r of scheduled) {
            const startRaw = r.scheduled_start || null;
            const endRaw = r.scheduled_end || null;

            // If only scheduled_end is present, render a 1-hour block ending at scheduled_end.
            const end = endRaw ? new Date(endRaw) : null;
            const start = startRaw
                ? new Date(startRaw)
                : end && !Number.isNaN(end.getTime())
                    ? new Date(end.getTime() - 60 * 60 * 1000)
                    : null;

            if (!start || Number.isNaN(start.getTime())) continue;
            const endResolved = end && !Number.isNaN(end.getTime()) ? end : new Date(start.getTime() + 60 * 60 * 1000);

            const dayIdx = Math.floor((startOfDay(start).getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
            if (dayIdx < 0 || dayIdx > 6) continue;
            map.get(dayIdx).push({ r, start, end: endResolved });
        }

        for (const [k, list] of map.entries()) {
            list.sort((a, b) => a.start.getTime() - b.start.getTime());
            map.set(k, list);
        }

        return map;
    }, [scheduled, weekStart]);

    const toEventTimes = (r) => {
        const startRaw = r?.scheduled_start || null;
        const endRaw = r?.scheduled_end || null;

        const end = endRaw ? new Date(endRaw) : null;
        const start = startRaw
            ? new Date(startRaw)
            : end && !Number.isNaN(end.getTime())
                ? new Date(end.getTime() - 60 * 60 * 1000)
                : null;

        if (!start || Number.isNaN(start.getTime())) return { start: null, end: null };
        const endResolved = end && !Number.isNaN(end.getTime()) ? end : new Date(start.getTime() + 60 * 60 * 1000);
        return { start, end: endResolved };
    };

    const today = useMemo(() => startOfDay(new Date()), []);

    // Mini month grid
    const miniMonthLabel = useMemo(
        () => monthCursor.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
        [monthCursor]
    );
    const miniStartOfMonth = useMemo(() => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1), [monthCursor]);
    const miniMonthCells = useMemo(() => {
        const firstDow = miniStartOfMonth.getDay();
        const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [miniStartOfMonth, monthCursor]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic tracking-tight font-sketch">Maintenance Calendar</h2>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{weekLabel}</div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="sketch-button font-black"
                        onClick={() => {
                            const t = new Date();
                            setActiveDate(t);
                            setMonthCursor(t);
                        }}
                    >
                        TODAY
                    </button>

                    <div className="flex border-2 border-gray-900 bg-white">
                        <button type="button" className="p-2 border-r-2 border-gray-900 hover:bg-gray-50" onClick={() => setActiveDate(addDays(activeDate, -7))}>
                            <ChevronLeft size={18} />
                        </button>
                        <button type="button" className="p-2 hover:bg-gray-50" onClick={() => setActiveDate(addDays(activeDate, 7))}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                <div className="sketch-card bg-white p-0 overflow-hidden" onClick={() => setSelectedRequestId(null)}>
                    <div className="p-3 border-b-2 border-gray-900 flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                            {loading ? 'Loading scheduled requests…' : `Scheduled requests: ${scheduled.length}`}
                        </div>
                    </div>

                    {/* Header row */}
                    <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))] border-b-2 border-gray-900 bg-gray-50">
                        <div className="p-3 border-r-2 border-gray-900" />
                        {days.map((d, i) => {
                            const isToday = startOfDay(d).getTime() === today.getTime();
                            const label = d.toLocaleDateString(undefined, { weekday: 'short' });
                            const num = d.getDate();
                            return (
                                <div key={i} className="p-3 border-r-2 last:border-r-0 border-gray-900 text-center">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</div>
                                    <div className={`mt-1 inline-flex items-center justify-center w-7 h-7 border-2 border-gray-900 font-black ${isToday ? 'bg-maint-red' : 'bg-white'}`}> {num} </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Time grid */}
                    <div className="overflow-auto">
                        <div className="grid grid-cols-[84px_repeat(7,minmax(0,1fr))]">
                            {/* Time labels */}
                            <div className="border-r-2 border-gray-900 bg-gray-50" style={{ height: gridHeight }}>
                                {Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, idx) => {
                                    const hour = HOURS_START + idx;
                                    const label = new Date(2000, 0, 1, hour, 0, 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div
                                            key={hour}
                                            className="px-2 py-1 border-b border-gray-200 text-[11px] font-black uppercase tracking-wide opacity-70"
                                            style={{ height: SLOT_HEIGHT }}
                                        >
                                            {label}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Day columns */}
                            {days.map((dayDate, dayIdx) => {
                                const isToday = startOfDay(dayDate).getTime() === today.getTime();
                                const events = eventsByDayIndex.get(dayIdx) || [];

                                return (
                                    <div
                                        key={dayIdx}
                                        className={`relative border-r-2 last:border-r-0 border-gray-900 ${isToday ? 'bg-white' : 'bg-white'}`}
                                        style={{ height: gridHeight }}
                                    >
                                        {/* horizontal grid lines */}
                                        {Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, idx) => (
                                            <div key={idx} className="border-b border-gray-200" style={{ height: SLOT_HEIGHT }} />
                                        ))}

                                        {/* events */}
                                        {events.map(({ r, start, end }) => {
                                            const startHours = start.getHours() + start.getMinutes() / 60;
                                            const endHoursRaw = end.getHours() + end.getMinutes() / 60;

                                            const startPos = clamp(startHours, HOURS_START, HOURS_END + 1);
                                            const endPos = clamp(Math.max(endHoursRaw, startHours + 0.25), HOURS_START, HOURS_END + 1);

                                            const top = (startPos - HOURS_START) * SLOT_HEIGHT;
                                            const height = Math.max((endPos - startPos) * SLOT_HEIGHT, 40);
                                            const showStatus = height >= 62;

                                            const subject = r.equipment_name || r.work_center || '—';
                                            const timeText = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                            const isSelected = String(selectedRequestId || '') === String(r.id);

                                            return (
                                                <div
                                                    key={r.id}
                                                    className={`absolute left-2 right-2 z-10 border-2 border-gray-900 ${colorForStatus(r.status)} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2 py-2 overflow-hidden text-gray-900 ${isSelected ? 'outline outline-4 outline-gray-900' : ''}`}
                                                    style={{ top, height }}
                                                    title={`${subject} • ${r.status || ''}`}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRequestId(String(r.id));
                                                    }}
                                                >
                                                    <div className="text-[10px] font-black uppercase tracking-wide leading-tight opacity-90 truncate">{timeText}</div>
                                                    <div className="mt-0.5 text-[12px] font-black leading-tight break-words">
                                                        {subject}
                                                    </div>
                                                    {showStatus && r.status ? (
                                                        <div className="mt-0.5 text-[10px] font-black uppercase tracking-wide leading-tight opacity-80 break-words">
                                                            {r.status}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: mini month picker */}
                <div className="space-y-4">
                    <div className="sketch-card bg-white">
                        <div className="text-xs font-black uppercase tracking-widest opacity-70">Selected</div>
                        {!selectedRequest ? (
                            <div className="mt-3 text-sm font-bold opacity-70">Select a scheduled request from the calendar.</div>
                        ) : (
                            (() => {
                                const subject = selectedRequest.equipment_name || selectedRequest.work_center || '—';
                                const { start, end } = toEventTimes(selectedRequest);
                                const timeText = start && end
                                    ? `${start.toLocaleString([], { weekday: 'short', month: 'short', day: '2-digit' })} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : '—';

                                return (
                                    <div className="mt-3 space-y-3">
                                        <div className="border-2 border-gray-900 p-3 bg-white">
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Subject</div>
                                            <div className="mt-1 font-black text-sm break-words">{subject}</div>
                                            <div className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-70">When</div>
                                            <div className="mt-1 font-bold text-sm break-words">{timeText}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="border-2 border-gray-900 p-3 bg-white">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Status</div>
                                                <div className="mt-1 font-black text-sm break-words">{selectedRequest.status || '—'}</div>
                                            </div>
                                            <div className="border-2 border-gray-900 p-3 bg-white">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Type</div>
                                                <div className="mt-1 font-black text-sm break-words">{selectedRequest.maintenance_type || '—'}</div>
                                            </div>
                                            <div className="border-2 border-gray-900 p-3 bg-white">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Team</div>
                                                <div className="mt-1 font-black text-sm break-words">{selectedRequest.team_name || '—'}</div>
                                            </div>
                                            <div className="border-2 border-gray-900 p-3 bg-white">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Technician</div>
                                                <div className="mt-1 font-black text-sm break-words">{selectedRequest.technician_name || '—'}</div>
                                            </div>
                                        </div>

                                        {(selectedRequest.notes || selectedRequest.instructions) ? (
                                            <div className="border-2 border-gray-900 p-3 bg-white">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Details</div>
                                                {selectedRequest.notes ? (
                                                    <div className="mt-2">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes</div>
                                                        <div className="mt-1 text-sm font-bold whitespace-pre-wrap break-words">{selectedRequest.notes}</div>
                                                    </div>
                                                ) : null}
                                                {selectedRequest.instructions ? (
                                                    <div className="mt-2">
                                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Instructions</div>
                                                        <div className="mt-1 text-sm font-bold whitespace-pre-wrap break-words">{selectedRequest.instructions}</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <button type="button" className="sketch-button font-black justify-center w-full" onClick={() => setSelectedRequestId(null)}>
                                            CLEAR SELECTION
                                        </button>
                                    </div>
                                );
                            })()
                        )}
                    </div>

                    <div className="sketch-card bg-white p-0 overflow-hidden">
                        <div className="p-4 border-b-2 border-gray-900 flex items-center justify-between">
                            <div className="text-xs font-black uppercase tracking-widest opacity-70">{miniMonthLabel}</div>
                            <div className="flex border-2 border-gray-900 bg-white">
                                <button type="button" className="p-2 border-r-2 border-gray-900 hover:bg-gray-50" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
                                    <ChevronLeft size={16} />
                                </button>
                                <button type="button" className="p-2 hover:bg-gray-50" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="p-3">
                            <div className="grid grid-cols-7 gap-1">
                                {DAYS.map((d) => (
                                    <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest opacity-50">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-2 grid grid-cols-7 gap-1">
                                {miniMonthCells.map((dayNum, idx) => {
                                    if (!dayNum) return <div key={`e-${idx}`} className="h-8" />;

                                    const cellDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), dayNum);
                                    const isSelected = startOfDay(cellDate).getTime() === startOfDay(activeDate).getTime();
                                    const isToday = startOfDay(cellDate).getTime() === today.getTime();

                                    return (
                                        <button
                                            key={cellDate.toISOString()}
                                            type="button"
                                            onClick={() => {
                                                setActiveDate(cellDate);
                                            }}
                                            className={`h-8 border-2 border-gray-900 font-black text-xs ${isSelected ? 'bg-maint-blue shadow-inner' : 'bg-white hover:bg-gray-50'} ${isToday ? 'underline decoration-2 underline-offset-2' : ''}`}
                                        >
                                            {dayNum}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="sketch-card bg-white">
                        <div className="text-xs font-black uppercase tracking-widest opacity-70">Legend</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-900 bg-maint-blue" />
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Default</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-900 bg-maint-yellow" />
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">In Progress</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-900 bg-maint-green" />
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Repaired</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-gray-900 bg-maint-red" />
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Scrap</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
