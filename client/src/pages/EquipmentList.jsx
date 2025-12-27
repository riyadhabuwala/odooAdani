import React from 'react';
const EquipmentList = () => {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-black italic">Equipment Inventory</h2>
            <div className="sketch-card bg-white overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr className="border-b-2 border-gray-900"><th className="pb-4 px-2 font-black uppercase text-xs">Name</th><th className="pb-4 font-black uppercase text-xs text-right px-2">Status</th></tr></thead>
                    <tbody><tr><td className="py-4 px-2 font-bold">Dell Latitude</td><td className="py-4 text-right px-2"><span className="sketch-tag bg-maint-green">Active</span></td></tr></tbody>
                </table>
            </div>
        </div>
    );
};
export default EquipmentList;
