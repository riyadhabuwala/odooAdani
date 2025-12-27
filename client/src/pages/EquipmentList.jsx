import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const EquipmentList = () => {
    const { user } = useAuth();
    const role = String(user?.role || '').toLowerCase();
    const { globalQuery } = useOutletContext();
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        employee_id: '',
        department: '',
        serial_number: '',
        technician_id: '',
        category: '',
        company: '',
        status: 'Active',
    });

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const eqReq = api.get('/api/equipment', { params: q ? { q } : {} });
            const isAdmin = role === 'admin';
            const empReq = isAdmin ? api.get('/api/users', { params: { role: 'employee' } }) : Promise.resolve({ data: [] });
            const techReq = isAdmin ? api.get('/api/users', { params: { role: 'technician' } }) : Promise.resolve({ data: [] });

            const [eqRes, empRes, techRes] = await Promise.all([eqReq, empReq, techReq]);
            setEquipment(eqRes.data || []);
            setEmployees(empRes.data || []);
            setTechnicians(techRes.data || []);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load equipment');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        const g = String(globalQuery || '').trim().toLowerCase();
        if (!g) return equipment;
        return equipment.filter((e) => {
            const hay = [e.name, e.serial_number, e.department, e.category, e.company, e.employee_name, e.technician_name]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(g);
        });
    }, [equipment, globalQuery]);

    const statusBadgeClass = (status) => {
        const s = String(status || '').toLowerCase();
        if (s === 'active') return 'bg-maint-green';
        if (s === 'down' || s === 'critical') return 'bg-maint-red';
        return 'bg-gray-100';
    };

    const onCreate = async (e) => {
        e.preventDefault();
        setError('');

        if (role !== 'admin') return setError('Forbidden');

        const payload = {
            ...form,
            employee_id: form.employee_id ? Number(form.employee_id) : null,
            technician_id: form.technician_id ? Number(form.technician_id) : null,
        };

        if (!String(payload.name || '').trim()) return setError('Name is required');
        if (!String(payload.serial_number || '').trim()) return setError('Serial number is required');
        if (!payload.technician_id) return setError('Technician is required');

        try {
            await api.post('/api/equipment', payload);
            setShowNew(false);
            setForm({
                name: '',
                employee_id: '',
                department: '',
                serial_number: '',
                technician_id: '',
                category: '',
                company: '',
                status: 'Active',
            });
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to create equipment');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black italic font-sketch">Equipment Inventory</h2>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Assets, ownership, assignments</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border-2 border-gray-900 bg-white px-3 py-2">
                        <Search size={16} />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search equipment..."
                            className="outline-none font-bold placeholder:opacity-40 w-56"
                        />
                    </div>
                    <button
                        type="button"
                        className="sketch-button bg-maint-blue font-black"
                        onClick={() => load()}
                    >
                        SEARCH
                    </button>
                    {role === 'admin' && (
                        <button
                            type="button"
                            className="sketch-button bg-maint-green font-black"
                            onClick={() => setShowNew((v) => !v)}
                        >
                            <Plus size={18} /> NEW
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs">
                    {error}
                </div>
            )}

            {showNew && role === 'admin' && (
                <div className="sketch-card bg-white">
                    <h3 className="font-black uppercase tracking-wider mb-4">New Equipment</h3>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onCreate}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Name</label>
                            <input className="w-full border-2 border-gray-900 p-2 font-bold outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Serial Number</label>
                            <input className="w-full border-2 border-gray-900 p-2 font-bold outline-none" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Employee</label>
                            <select className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                                <option value="">—</option>
                                {employees.map((u) => (
                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Technician</label>
                            <select className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white" value={form.technician_id} onChange={(e) => setForm({ ...form, technician_id: e.target.value })}>
                                <option value="">Select technician…</option>
                                {technicians.map((u) => (
                                    <option key={u.id} value={u.id}>{u.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Department</label>
                            <input className="w-full border-2 border-gray-900 p-2 font-bold outline-none" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Category</label>
                            <input className="w-full border-2 border-gray-900 p-2 font-bold outline-none" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Company</label>
                            <input className="w-full border-2 border-gray-900 p-2 font-bold outline-none" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</label>
                            <select className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="Active">Active</option>
                                <option value="Down">Down</option>
                                <option value="Critical">Critical</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-3">
                            <button type="button" className="sketch-button font-black" onClick={() => setShowNew(false)}>
                                CANCEL
                            </button>
                            <button type="submit" className="sketch-button bg-maint-green font-black">
                                SAVE
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="sketch-card bg-white overflow-x-auto">
                <table className="w-full text-left min-w-[980px]">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="pb-4 px-2 font-black uppercase text-xs">Name</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Employee</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Department</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Serial Number</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Technician</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Category</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Company</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="py-8 text-center font-bold opacity-50">Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8} className="py-8 text-center font-bold opacity-50">No equipment found.</td></tr>
                        ) : (
                            filtered.map((e) => (
                                <tr key={e.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-4 px-2 font-black">{e.name}</td>
                                    <td className="py-4 px-2 font-bold">{e.employee_name || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{e.department || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{e.serial_number}</td>
                                    <td className="py-4 px-2 font-bold">{e.technician_name || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{e.category || '—'}</td>
                                    <td className="py-4 px-2 font-bold">{e.company || '—'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <span className={`sketch-tag ${statusBadgeClass(e.status)} font-black uppercase text-xs`}>{e.status}</span>
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

export default EquipmentList;
