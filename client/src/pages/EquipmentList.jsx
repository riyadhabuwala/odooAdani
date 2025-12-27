import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Filter } from 'lucide-react';

const EquipmentList = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:5000/api/equipment')
            .then(res => {
                setEquipment(res.data);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">Equipment Inventory</h2>
                    <p className="font-bold text-slate-500 italic">Manage and track all company assets.</p>
                </div>
                <button className="btn-sketch bg-black text-white flex items-center space-x-2">
                    <Plus size={20} />
                    <span>New Equipment</span>
                </button>
            </div>

            <div className="flex space-x-4 mb-4">
                <div className="flex-1 bg-white border-3 border-black p-2 flex items-center">
                    <input type="text" placeholder="Search by name, SN, or employee..." className="bg-transparent outline-none w-full font-bold px-2" />
                </div>
                <button className="p-3 border-3 border-black bg-pastel-yellow hover:bg-yellow-200 transition-all">
                    <Filter size={20} />
                </button>
            </div>

            <div className="card-sketch bg-white overflow-hidden p-0">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b-3 border-black">
                            <th className="p-4 font-black uppercase text-xs">Name</th>
                            <th className="p-4 font-black uppercase text-xs">Serial Number</th>
                            <th className="p-4 font-black uppercase text-xs">Department</th>
                            <th className="p-4 font-black uppercase text-xs">Employee</th>
                            <th className="p-4 font-black uppercase text-xs">Technician</th>
                            <th className="p-4 font-black uppercase text-xs">Category</th>
                            <th className="p-4 font-black uppercase text-xs">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-3 border-black">
                        {equipment.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold">{item.name}</td>
                                <td className="p-4 font-mono text-sm">{item.serial_number}</td>
                                <td className="p-4 text-sm font-bold">{item.department}</td>
                                <td className="p-4 text-sm font-bold">{item.employee}</td>
                                <td className="p-4 text-sm font-bold">{item.technician}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-pastel-purple border-2 border-black text-xs font-black rounded uppercase">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                                        <span className="font-bold text-sm tracking-tight">{item.status}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EquipmentList;
