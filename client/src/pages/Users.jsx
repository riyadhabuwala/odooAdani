import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const ROLE_OPTIONS = [
    { value: 'employee', label: 'Employee' },
    { value: 'technician', label: 'Technician' },
    { value: 'admin', label: 'Admin' },
];

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingUserId, setSavingUserId] = useState(null);
    const [error, setError] = useState('');

    const load = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await api.get('/api/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const rows = useMemo(() => users, [users]);

    const updateRole = async (userId, role) => {
        setError('');
        setSavingUserId(userId);
        try {
            const res = await api.patch(`/api/users/${userId}/role`, { role });
            const updated = res.data;
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to update role');
        } finally {
            setSavingUserId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black italic tracking-tight">Users</h2>
                <button type="button" className="sketch-button font-black" onClick={load} disabled={loading}>
                    REFRESH
                </button>
            </div>

            {error && <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs">{error}</div>}

            <div className="sketch-card bg-white">
                {loading ? (
                    <div className="font-bold">Loading…</div>
                ) : rows.length === 0 ? (
                    <div className="font-bold">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-gray-900">
                                    <th className="text-left py-2 pr-3 font-black uppercase tracking-widest text-[10px]">Name</th>
                                    <th className="text-left py-2 pr-3 font-black uppercase tracking-widest text-[10px]">Email</th>
                                    <th className="text-left py-2 pr-3 font-black uppercase tracking-widest text-[10px]">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((u) => {
                                    const busy = savingUserId === u.id;
                                    return (
                                        <tr key={u.id} className="border-b border-gray-200">
                                            <td className="py-3 pr-3 font-bold">{u.full_name || '-'}</td>
                                            <td className="py-3 pr-3 font-bold">{u.email}</td>
                                            <td className="py-3 pr-3">
                                                <select
                                                    className="border-2 border-gray-900 px-2 py-1 font-bold bg-white"
                                                    value={String(u.role || 'employee').toLowerCase()}
                                                    disabled={busy}
                                                    onChange={(e) => updateRole(u.id, e.target.value)}
                                                >
                                                    {ROLE_OPTIONS.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {busy && <span className="ml-2 font-black text-xs opacity-60">Saving…</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Default role for new signups is Employee.
            </div>
        </div>
    );
};

export default Users;
