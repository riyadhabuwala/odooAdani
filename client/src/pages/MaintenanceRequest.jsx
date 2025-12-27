import React from 'react';
const MaintenanceRequest = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-maint-blue border-2 border-gray-900 p-6 shadow-sketch">
                <h2 className="text-3xl font-black italic">NEW REQUEST</h2>
                <button className="sketch-button bg-white font-black">SAVE</button>
            </div>
        </div>
    );
};
export default MaintenanceRequest;
