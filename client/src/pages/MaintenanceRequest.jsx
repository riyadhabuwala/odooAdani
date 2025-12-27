import React, { useState } from 'react';
import { Star, Diamond, Info, FileText } from 'lucide-react';

const MaintenanceRequest = () => {
    const [status, setStatus] = useState('New Request');
    const [priority, setPriority] = useState(1);
    const [maintType, setMaintType] = useState('Corrective');
    const [activeTab, setActiveTab] = useState('Notes');

    const stages = ['New Request', 'In Progress', 'Repaired', 'Scrap'];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Pipeline Status */}
            <div className="flex items-center justify-between bg-white border-3 border-black p-1 rounded-full overflow-hidden shadow-sketch-sm">
                {stages.map((stage, i) => (
                    <button
                        key={stage}
                        onClick={() => setStatus(stage)}
                        className={`flex-1 py-3 px-4 text-sm font-black transition-all ${status === stage ? 'bg-black text-white' : 'text-slate-500 hover:bg-slate-100'
                            } ${i !== stages.length - 1 ? 'border-r-2 border-slate-200' : ''}`}
                    >
                        {stage}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Form */}
                <div className="card-sketch bg-white space-y-6">
                    <h3 className="text-xl font-bold italic tracking-tight">Request Details</h3>

                    <div>
                        <label className="block font-black text-sm mb-3 uppercase">Maintenance Type</label>
                        <div className="flex space-x-4">
                            {['Corrective', 'Preventive'].map((type) => (
                                <label key={type} className="flex items-center space-x-2 cursor-pointer group">
                                    <div className={`w-5 h-5 border-2 border-black rounded-full flex items-center justify-center transition-all ${maintType === type ? 'bg-black' : 'bg-white'}`}>
                                        {maintType === type && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <input type="radio" className="hidden" name="type" onChange={() => setMaintType(type)} checked={maintType === type} />
                                    <span className="font-bold group-hover:text-blue-600 transition-colors">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block font-black text-sm mb-3 uppercase">Priority Level</label>
                        <div className="flex space-x-4">
                            {[1, 2, 3].map((lvl) => (
                                <button
                                    key={lvl}
                                    onClick={() => setPriority(lvl)}
                                    className={`p-3 border-3 border-black rounded-lg transition-all ${priority === lvl ? 'bg-pastel-yellow shadow-sketch-sm' : 'bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    {lvl === 1 ? <Diamond size={24} fill={priority >= 1 ? "currentColor" : "none"} /> :
                                        lvl === 2 ? <Star size={24} fill={priority >= 2 ? "currentColor" : "none"} /> :
                                            <div className="font-black text-lg">!!!</div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block font-black text-sm mb-1 uppercase">Technician</label>
                            <select className="input-sketch w-full bg-slate-50 font-bold">
                                <option>John Doe</option>
                                <option>Jane Smith</option>
                                <option>Mike Ross</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-black text-sm mb-1 uppercase">Work Center</label>
                            <input type="text" className="input-sketch w-full bg-slate-50 font-bold" placeholder="Maintenance Zone A" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Description & Tabs */}
                <div className="flex flex-col space-y-4">
                    <div className="flex-1 card-sketch bg-white flex flex-col p-0">
                        <div className="flex border-b-3 border-black">
                            {['Notes', 'Instructions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-3 font-black text-sm flex items-center justify-center space-x-2 ${activeTab === tab ? 'bg-pastel-blue' : 'hover:bg-slate-50'
                                        } ${tab === 'Notes' ? 'border-r-3 border-black' : ''}`}
                                >
                                    {tab === 'Notes' ? <FileText size={16} /> : <Info size={16} />}
                                    <span>{tab}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 p-4">
                            <textarea
                                className="w-full h-full border-none outline-none resize-none font-bold text-slate-700 bg-transparent py-2"
                                placeholder={activeTab === 'Notes' ? "Enter any additional notes here..." : "Step-by-step instructions..."}
                            ></textarea>
                        </div>
                    </div>
                    <button className="btn-sketch bg-black text-white transform hover:scale-[1.02] transition-all">
                        SUBMIT REQUEST
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceRequest;
