import React, { useState } from 'react';
import { Save, Wrench, ShieldCheck, Zap, AlertTriangle, Info, FileText } from 'lucide-react';

const MaintenanceRequest = () => {
    const [activeStage, setActiveStage] = useState(0);
    const [activeTab, setActiveTab] = useState('notes');
    const [priority, setPriority] = useState(2);

    const stages = ['New Request', 'In Progress', 'Repaired', 'Scrap'];
    const pIcons = [<Info size={16} />, <ShieldCheck size={16} />, <AlertTriangle size={16} />, <Zap size={16} />];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-maint-blue border-2 border-gray-900 p-6 shadow-sketch">
                <h2 className="text-3xl font-black italic tracking-tighter">MAINTENANCE/NEW</h2>
                <div className="flex gap-4">
                    <button className="sketch-button bg-white font-black hover:bg-black hover:text-white transition-all">SAVE</button>
                    <button className="sketch-button bg-gray-900 text-white font-black">DISCARD</button>
                </div>
            </div>

            {/* Pipeline Status */}
            <div className="flex justify-between items-center relative py-4 px-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-900 -z-10 -translate-y-1/2"></div>
                {stages.map((stage, i) => (
                    <div
                        key={stage}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        onClick={() => setActiveStage(i)}
                    >
                        <div className={`w-8 h-8 rotate-45 border-2 border-gray-900 transition-all ${i <= activeStage ? 'bg-gray-900' : 'bg-white group-hover:scale-110'
                            }`}></div>
                        <span className={`text-xs font-black uppercase tracking-widest ${i === activeStage ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                            {stage}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="sketch-card space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider">Maintenance Type</label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group font-bold">
                                <input type="radio" name="mtype" className="size-4 border-2 border-gray-900" defaultChecked />
                                <span className="group-hover:underline">Corrective</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group font-bold opacity-60">
                                <input type="radio" name="mtype" className="size-4 border-2 border-gray-900" />
                                <span className="group-hover:underline">Preventive</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black uppercase tracking-wider block">Priority Level</label>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`w-12 h-12 border-2 border-gray-900 flex items-center justify-center transition-all ${priority === p ? 'bg-maint-yellow shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5' : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {pIcons[p - 1]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider block">Assigned Technician</label>
                        <select className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white">
                            <option>Select Technician...</option>
                            <option>John Doe</option>
                            <option>Jane Smith</option>
                        </select>
                    </div>
                </div>

                <div className="sketch-card space-y-6 bg-gray-50">
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider block">Work Center</label>
                        <input
                            type="text"
                            placeholder="e.g. Assembly Line A"
                            className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase tracking-wider block">Expected Completion</label>
                        <input
                            type="date"
                            className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="sketch-card">
                <div className="flex border-b-2 border-gray-900 mb-6">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-6 py-2 font-black uppercase text-sm border-2 border-b-0 border-transparent transition-all ${activeTab === 'notes' ? 'border-gray-900 bg-white -mb-0.5' : 'opacity-40 hover:opacity-100'
                            }`}
                    >
                        Notes
                    </button>
                    <button
                        onClick={() => setActiveTab('instructions')}
                        className={`px-6 py-2 font-black uppercase text-sm border-2 border-b-0 border-transparent transition-all ${activeTab === 'instructions' ? 'border-gray-900 bg-white -mb-0.5' : 'opacity-40 hover:opacity-100'
                            }`}
                    >
                        Instructions
                    </button>
                </div>

                <textarea
                    placeholder={activeTab === 'notes' ? 'Add any diagnostic notes...' : 'List repair instructions step by step...'}
                    className="w-full h-32 border-2 border-gray-900 p-4 font-bold outline-none resize-none bg-white italic"
                ></textarea>
            </div>
        </div>
    );
};

export default MaintenanceRequest;
