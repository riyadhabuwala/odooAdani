import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // Dec 2025
    const [view, setView] = useState('Month'); // Month, Week, Day

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Mock data for maintenance blocks
    const maintenanceBlocks = [
        { day: 15, title: 'Server Check', type: 'Preventive', color: 'bg-pastel-blue' },
        { day: 18, title: 'Printer Repair', type: 'Corrective', color: 'bg-pastel-red' },
        { day: 22, title: 'Network Update', type: 'Preventive', color: 'bg-pastel-green' },
    ];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

    const grid = [];
    for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold flex items-center space-x-2">
                        <span>Maintenance Schedule</span>
                        <span className="text-slate-300 font-light">/</span>
                        <span className="text-pastel-blue italic">{monthName} {year}</span>
                    </h2>
                </div>
                <div className="flex items-center bg-white border-2 border-black rounded-lg overflow-hidden shadow-sketch-sm">
                    {['Month', 'Week', 'Day'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-1 text-sm font-black ${view === v ? 'bg-black text-white' : 'hover:bg-slate-50'} ${v !== 'Day' ? 'border-r-2 border-black' : ''}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card-sketch bg-white p-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button className="p-2 border-2 border-black hover:bg-slate-100 transition-all rounded">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="p-2 border-2 border-black hover:bg-slate-100 transition-all rounded">
                            <ChevronRight size={20} />
                        </button>
                        <button className="font-black text-sm underline decoration-4 decoration-pastel-yellow underline-offset-4">Today</button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-t-2 border-l-2 border-black">
                    {days.map(day => (
                        <div key={day} className="p-4 border-r-2 border-b-2 border-black bg-slate-50 font-black text-center text-sm">
                            {day}
                        </div>
                    ))}
                    {grid.map((day, i) => (
                        <div key={i} className={`min-h-[120px] p-2 border-r-2 border-b-2 border-black relative group hover:bg-slate-50 transition-all ${day === null ? 'bg-slate-50/50' : 'bg-white'}`}>
                            {day && (
                                <>
                                    <span className={`font-black text-sm absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border-2 ${day === 18 ? 'border-black bg-pastel-red' : 'border-transparent'}`}>
                                        {day}
                                    </span>
                                    <div className="mt-8 space-y-1">
                                        {maintenanceBlocks.filter(b => b.day === day).map((block, idx) => (
                                            <div key={idx} className={`${block.color} border-2 border-black p-1 text-[10px] font-black rounded shadow-sketch-sm truncate cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all`}>
                                                {block.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
