import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';

const EquipmentList = () => {
    const [search, setSearch] = useState('');

    const equipment = [
        { id: 1, name: "Dell Latitude 5420", sn: "SN29384", dept: "IT", emp: "Riya", tech: "John Doe", cat: "Laptop", status: "Active" },
        { id: 2, name: "HP LaserJet Pro", sn: "SN11223", dept: "Admin", emp: "Sam", tech: "Jane Smith", cat: "Printer", status: "Active" },
        { id: 3, name: "Cisco Router 2901", sn: "SN44556", dept: "IT", emp: "Floyd", tech: "John Doe", cat: "Network", status: "Active" },
        { id: 4, name: "Epson L3150", sn: "SN77889", dept: "HR", emp: "Sarah", tech: "Jane Smith", cat: "Printer", status: "Active" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter">Equipment Inventory</h2>
                    <p className="text-gray-500 font-bold uppercase text-sm mt-1">Managed assets for Adani Port</p>
                </div>
                <button className="sketch-button bg-maint-blue font-black py-3">
                    <Plus size={20} />
                    NEW EQUIPMENT
                </button>
            </div>

            <div className="sketch-card bg-white">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 flex items-center bg-gray-50 border-2 border-gray-900 px-4 py-2">
                        <Search size={20} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name, serial, or employee..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 w-full ml-3 font-bold outline-none"
                        />
                    </div>
                    <button className="sketch-button px-6 font-bold uppercase">
                        <Filter size={20} />
                        Filter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-900 text-left">
                                <th className="pb-4 font-black uppercase text-sm px-2">Name</th>
                                <th className="pb-4 font-black uppercase text-sm">Serial No.</th>
                                <th className="pb-4 font-black uppercase text-sm">Department</th>
                                <th className="pb-4 font-black uppercase text-sm">Employee</th>
                                <th className="pb-4 font-black uppercase text-sm">Technician</th>
                                <th className="pb-4 font-black uppercase text-sm">Category</th>
                                <th className="pb-4 font-black uppercase text-sm text-right px-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-100">
                            {equipment.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-2 font-black">{item.name}</td>
                                    <td className="py-4 font-bold text-gray-500">{item.sn}</td>
                                    <td className="py-4 font-medium italic">{item.dept}</td>
                                    <td className="py-4 font-bold">{item.emp}</td>
                                    <td className="py-4 font-medium opacity-70 italic">{item.tech}</td>
                                    <td className="py-4 font-bold uppercase text-xs">{item.cat}</td>
                                    <td className="py-4 text-right px-2">
                                        <span className="sketch-tag bg-maint-green">
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EquipmentList;
