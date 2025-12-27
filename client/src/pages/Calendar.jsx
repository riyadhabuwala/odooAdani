import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 18));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const mockRequests = [
        { day: 15, title: 'Server Check', tech: 'John', color: 'bg-maint-blue' },
        { day: 18, title: 'Printer Repair', tech: 'Sam', color: 'bg-maint-green' },
        { day: 18, title: 'AC Filter', tech: 'Riya', color: 'bg-maint-red' },
        { day: 22, title: 'Network Sync', tech: 'John', color: 'bg-maint-yellow' },
    ];

    const generateDays = () => {
        let daysArray = [];
        for (let i = 1; i <= 31; i++) daysArray.push(i);
        return daysArray;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <h2 className="text-4xl font-black tracking-tighter italic">December 2025</h2>
                    <div className="flex border-2 border-gray-900">
                        <button className="p-2 border-r-2 border-gray-900 hover:bg-gray-100"><ChevronLeft size={20} /></button>
                        <button className="p-2 hover:bg-gray-100"><ChevronRight size={20} /></button>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex border-2 border-gray-900 bg-white">
                        <button className="px-4 py-2 font-black text-xs uppercase border-r-2 border-gray-900 bg-maint-blue shadow-inner">Month</button>
                        <button className="px-4 py-2 font-black text-xs uppercase border-r-2 border-gray-900">Week</button>
                        <button className="px-4 py-2 font-black text-xs uppercase">Day</button>
                    </div>
                    <button className="sketch-button py-2 px-4 font-bold text-xs">
                        <Filter size={16} />
                        ALL TECHNICIANS
                    </button>
                </div>
            </div>

            <div className="sketch-card bg-white p-0 overflow-hidden">
                <div className="grid grid-cols-7 border-b-2 border-gray-900 bg-gray-50">
                    {days.map(day => (
                        <div key={day} className="p-4 text-center font-black uppercase text-xs tracking-widest border-r-2 last:border-r-0 border-gray-900">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 grid-rows-5">
                    {generateDays().map(day => (
                        <div
                            key={day}
                            className={`min-h-32 p-2 border-r-2 border-b-2 last:border-r-0 border-gray-900 relative ${day === 18 ? 'bg-maint-blue shadow-inner' : ''
                                }`}
                        >
                            <span className={`text-sm font-black ${day === 18 ? 'underline decoration-2' : 'opacity-40'}`}>
                                {day}
                            </span>

                            <div className="mt-2 space-y-1">
                                {mockRequests.filter(r => r.day === day).map((req, i) => (
                                    <div key={i} className={`p-1 border-2 border-gray-900 text-[10px] font-black uppercase truncate ${req.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                        {req.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-8 justify-center items-center py-4 opacity-70">
                {['Corrective', 'Preventive', 'Inspection', 'Installation'].map((type, i) => (
                    <div key={type} className="flex items-center gap-2">
                        <div className={`w-3 h-3 border-2 border-gray-900 ${['bg-maint-red', 'bg-maint-green', 'bg-maint-blue', 'bg-maint-yellow'][i]}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
