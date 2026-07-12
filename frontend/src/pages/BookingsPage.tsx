import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Simple mock data for bookings
  const mockBookings = [
    { id: 1, title: 'MacBook Pro M2', user: 'Alice Smith', time: '10:00 AM - 12:00 PM', location: 'IT Dept', type: 'laptop' },
    { id: 2, title: 'Projector A', user: 'Bob Jones', time: '1:00 PM - 3:00 PM', location: 'Meeting Room 1', type: 'equipment' },
    { id: 3, title: 'Dell XPS 15', user: 'Charlie Brown', time: '2:30 PM - 5:00 PM', location: 'Engineering', type: 'laptop' },
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const prevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const today = () => setCurrentDate(new Date());

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bookings Calendar</h1>
          <p className="text-sm text-slate-500 mt-2">Manage asset reservations and schedules.</p>
        </div>
        
        <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors">
          <Plus className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
          New Booking
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-6 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={today}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={prevDay} className="p-1.5 text-slate-600 hover:bg-slate-50 border-r border-slate-200">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextDay} className="p-1.5 text-slate-600 hover:bg-slate-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid (Day View) */}
        <div className="divide-y divide-slate-100">
          {mockBookings.length > 0 ? (
            mockBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    booking.type === 'laptop' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                  )}>
                    <span className="font-bold text-lg">{booking.title.charAt(0)}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {booking.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{booking.user}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {booking.time}
                      </span>
                      <span className="flex items-center gap-1 hidden sm:flex">
                        <MapPin className="w-4 h-4" />
                        {booking.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Confirmed
                  </span>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No bookings for this date</h3>
              <p className="mt-1 text-slate-500">There are no assets reserved for {currentDate.toLocaleDateString()}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
