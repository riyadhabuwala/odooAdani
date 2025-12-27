import React, { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, Save } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const PIPELINE = ['New Request', 'In Progress', 'Repaired', 'Scrap'];
const WORK_CENTERS = ['IT', 'Electrical', 'Mechanical', 'Utilities'];

const MaintenanceRequest = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('New Request');
    const [maintenanceType, setMaintenanceType] = useState('Corrective');
    const [priority, setPriority] = useState(3);
    const [equipment, setEquipment] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [activeTab, setActiveTab] = useState('Notes');
    const [techOpen, setTechOpen] = useState(false);
    const [workCenterOpen, setWorkCenterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [savedId, setSavedId] = useState(null);

    const [form, setForm] = useState({
        equipment_id: '',
        assigned_technician_id: '',
        work_center: WORK_CENTERS[0],
        scheduled_start: '',
        notes: '',
        instructions: '',
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const [eqRes, techRes] = await Promise.all([
                    api.get('/api/equipment'),
                    api.get('/api/users', { params: { role: 'technician' } }),
                ]);
                if (!mounted) return;
                setEquipment(eqRes.data || []);
                setTechnicians(techRes.data || []);
            } catch (err) {
                if (mounted) setError(err?.response?.data?.error || 'Failed to load form data');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const stageIndex = useMemo(() => PIPELINE.indexOf(status), [status]);

    const priorityItemClass = (n) => {
        const active = n <= priority;
        return `w-7 h-7 border-2 border-gray-900 rotate-45 ${active ? 'bg-maint-red shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'} transition-colors`;
    };

    const saveRequest = async () => {
        setError('');
        setSavedId(null);
        const equipmentId = Number(form.equipment_id);
        if (!equipmentId) return setError('Please select equipment');

        try {
            setSubmitting(true);
            const payload = {
                equipment_id: equipmentId,
                requested_by_id: user?.id || null,
                assigned_technician_id: form.assigned_technician_id ? Number(form.assigned_technician_id) : null,
                maintenance_type: maintenanceType,
                priority,
                status,
                work_center: form.work_center,
                notes: form.notes,
                instructions: form.instructions,
                scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
            };
            const res = await api.post('/api/requests', payload);
            setSavedId(res.data.id);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to create request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-maint-blue border-2 border-gray-900 p-6 shadow-sketch">
                <div>
                    <h2 className="text-3xl font-black italic">MAINTENANCE REQUEST</h2>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Create and dispatch a ticket</div>
                </div>
                <button
                    className="sketch-button bg-white font-black disabled:opacity-60"
                    onClick={saveRequest}
                    disabled={submitting || loading}
                    type="button"
                >
                    <Save size={18} /> SAVE
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs">
                    {error}
                </div>
            )}
            {savedId && (
                <div className="p-3 bg-maint-green border-2 border-gray-900 font-bold text-xs">
                    Saved request #{savedId}
                </div>
            )}

            <div className="sketch-card bg-white">
                <div className="mb-6">
                    <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-3">Pipeline Status</div>
                    <div className="grid grid-cols-4 gap-3">
                        {PIPELINE.map((s, idx) => {
                            const active = idx === stageIndex;
                            const completed = idx < stageIndex;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`border-2 border-gray-900 px-3 py-3 text-left font-black uppercase text-[10px] tracking-widest transition-colors ${active ? 'bg-maint-yellow shadow-inner' : completed ? 'bg-maint-green' : 'bg-white hover:bg-gray-50'}`}
                                >
                                    {s}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Maintenance Type</div>
                            <div className="flex items-center gap-3">
                                {['Corrective', 'Preventive'].map((t) => (
                                    <label key={t} className="flex items-center gap-2 border-2 border-gray-900 px-3 py-2 font-black uppercase text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name="maintenanceType"
                                            checked={maintenanceType === t}
                                            onChange={() => setMaintenanceType(t)}
                                        />
                                        {t}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Priority</div>
                            <div className="flex items-center gap-4">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setPriority(n)}
                                        className="p-1"
                                        aria-label={`Priority ${n}`}
                                    >
                                        <div className={priorityItemClass(n)} />
                                    </button>
                                ))}
                                <span className="text-xs font-black uppercase tracking-widest opacity-60">{priority}/5</span>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Equipment</div>
                            <div className="flex items-center gap-2 border-2 border-gray-900 p-2 bg-white">
                                <select
                                    value={form.equipment_id}
                                    onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
                                    className="flex-1 outline-none font-bold bg-white"
                                >
                                    <option value="">Select equipment…</option>
                                    {equipment.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name} ({e.serial_number})</option>
                                    ))}
                                </select>
                                <ChevronsUpDown size={16} className="opacity-60" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Technician</div>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="w-full sketch-button justify-between font-black bg-white"
                                            onClick={() => {
                                                setTechOpen((v) => !v);
                                                setWorkCenterOpen(false);
                                            }}
                                        >
                                            <span className="flex-1 text-left">
                                                {technicians.find((t) => String(t.id) === String(form.assigned_technician_id))?.full_name || 'Select…'}
                                            </span>
                                            <ChevronsUpDown size={16} />
                                        </button>

                                        {techOpen && (
                                            <div className="absolute z-10 mt-2 w-full border-2 border-gray-900 bg-white shadow-sketch">
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 font-bold hover:bg-gray-50 border-b border-gray-200"
                                                    onClick={() => {
                                                        setForm({ ...form, assigned_technician_id: '' });
                                                        setTechOpen(false);
                                                    }}
                                                >
                                                    —
                                                </button>
                                                {technicians.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 font-bold hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                                                        onClick={() => {
                                                            setForm({ ...form, assigned_technician_id: String(t.id) });
                                                            setTechOpen(false);
                                                        }}
                                                    >
                                                        {t.full_name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                            </div>

                            <div>
                                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Work Center</div>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="w-full sketch-button justify-between font-black bg-white"
                                            onClick={() => {
                                                setWorkCenterOpen((v) => !v);
                                                setTechOpen(false);
                                            }}
                                        >
                                            <span className="flex-1 text-left">{form.work_center}</span>
                                            <ChevronsUpDown size={16} />
                                        </button>

                                        {workCenterOpen && (
                                            <div className="absolute z-10 mt-2 w-full border-2 border-gray-900 bg-white shadow-sketch">
                                                {WORK_CENTERS.map((wc) => (
                                                    <button
                                                        key={wc}
                                                        type="button"
                                                        className="w-full text-left px-3 py-2 font-bold hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                                                        onClick={() => {
                                                            setForm({ ...form, work_center: wc });
                                                            setWorkCenterOpen(false);
                                                        }}
                                                    >
                                                        {wc}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">Scheduled Start</div>
                            <input
                                type="datetime-local"
                                value={form.scheduled_start}
                                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                                className="w-full border-2 border-gray-900 p-2 font-bold outline-none"
                            />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Used by the Calendar view</p>
                        </div>

                        <div className="border-2 border-gray-900">
                            <div className="flex">
                                {['Notes', 'Instructions'].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        className={`flex-1 px-4 py-3 font-black uppercase text-xs border-r-2 last:border-r-0 border-gray-900 ${activeTab === tab ? 'bg-maint-blue shadow-inner' : 'bg-white hover:bg-gray-50'}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4">
                                {activeTab === 'Notes' ? (
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        className="w-full min-h-40 border-2 border-gray-900 p-3 font-bold outline-none"
                                        placeholder="Describe the issue and observations…"
                                    />
                                ) : (
                                    <textarea
                                        value={form.instructions}
                                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                                        className="w-full min-h-40 border-2 border-gray-900 p-3 font-bold outline-none"
                                        placeholder="Add work instructions and safety notes…"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceRequest;
