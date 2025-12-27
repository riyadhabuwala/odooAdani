import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['New Request', 'In Progress', 'Repaired', 'Scrap'];

const Requests = () => {
    const { user } = useAuth();
    const role = String(user?.role || '').toLowerCase();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingId, setSavingId] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/api/requests');
            setRequests(res.data || []);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const canCreate = role === 'admin' || role === 'employee';
    const canUpdate = role === 'admin' || role === 'technician';

    const rows = useMemo(() => {
        return (requests || []).map((r) => {
            const subject = r.equipment_name || r.work_center || '—';
            return { ...r, subject };
        });
    }, [requests]);

    const toLocalInput = (iso) => {
        if (!iso) return '';
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };

    const toIsoOrNull = (localVal) => {
        if (!localVal) return null;
        const dt = new Date(localVal);
        return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    };

    const updateRow = async (id, patch) => {
        setError('');
        try {
            setSavingId(id);
            await api.put(`/api/requests/${id}`, patch);
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to update request');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black italic font-sketch">Requests</h2>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Track and update maintenance work</p>
                </div>

                {canCreate && (
                    <Link to="/maintenance/new" className="sketch-button bg-maint-green font-black">
                        NEW REQUEST
                    </Link>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs">
                    {error}
                </div>
            )}

            <div className="sketch-card bg-white overflow-x-auto">
                <table className="w-full text-left min-w-[980px]">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="pb-4 px-2 font-black uppercase text-xs">ID</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Subject</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Team</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Technician</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Type</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Status</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Scheduled End</th>
                            {canUpdate && <th className="pb-4 px-2 font-black uppercase text-xs text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={canUpdate ? 8 : 7} className="py-8 text-center font-bold opacity-50">Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={canUpdate ? 8 : 7} className="py-8 text-center font-bold opacity-50">No requests found.</td></tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-4 px-2 font-black">#{r.id}</td>
                                    <td className="py-4 px-2 font-bold">{r.subject}</td>
                                    <td className="py-4 px-2 font-bold">{r.team_name || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{r.technician_name || '—'}</td>
                                    <td className="py-4 px-2 font-bold uppercase text-xs">{r.maintenance_type}</td>
                                    <td className="py-4 px-2">
                                        {canUpdate ? (
                                            <select
                                                className="border-2 border-gray-900 p-2 font-bold outline-none bg-white"
                                                value={r.status}
                                                onChange={(e) => {
                                                    const next = e.target.value;
                                                    setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
                                                }}
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="font-black uppercase text-xs">{r.status}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-2">
                                        {canUpdate ? (
                                            <input
                                                type="datetime-local"
                                                className="border-2 border-gray-900 p-2 font-bold outline-none"
                                                value={toLocalInput(r.scheduled_end)}
                                                onChange={(e) => {
                                                    const iso = toIsoOrNull(e.target.value);
                                                    setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, scheduled_end: iso } : x)));
                                                }}
                                            />
                                        ) : (
                                            <span className="font-bold">{r.scheduled_end ? new Date(r.scheduled_end).toLocaleString() : '—'}</span>
                                        )}
                                    </td>
                                    {canUpdate && (
                                        <td className="py-4 px-2 text-right">
                                            <button
                                                type="button"
                                                className="sketch-button bg-white font-black disabled:opacity-60"
                                                disabled={savingId === r.id}
                                                onClick={() => updateRow(r.id, { status: r.status, scheduled_end: r.scheduled_end || null })}
                                            >
                                                <Save size={18} /> SAVE
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Requests;
