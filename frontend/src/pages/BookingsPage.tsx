import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookings, useAssets } from '@/hooks/queries';
import { useBookResource, useCancelBooking } from '@/hooks/mutations';
import { toast } from 'sonner';

export function BookingsPage() {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Queries
  const { data: bookings = [], isLoading: isLoadingBookings, error: bookingsError } = useBookings();
  const { data: assetsData } = useAssets({ bookable: true, pageSize: 100 });
  const bookableAssets = assetsData?.data ?? [];

  // Mutations
  const bookResource = useBookResource();
  const cancelBooking = useCancelBooking();

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

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const bookingsForDay = bookings.filter((booking) => {
    if (!booking.start_time) return false;
    return isSameDay(new Date(booking.start_time), currentDate);
  });

  const formatTimeRange = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking.mutateAsync(id);
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking');
    }
  };

  const handleCreateBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const resourceId = String(formData.get('resource_id'));
    const date = String(formData.get('date'));
    const startTimeVal = String(formData.get('start_time'));
    const endTimeVal = String(formData.get('end_time'));
    const purpose = String(formData.get('purpose'));

    if (!resourceId || !date || !startTimeVal || !endTimeVal) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startIso = new Date(`${date}T${startTimeVal}`).toISOString();
    const endIso = new Date(`${date}T${endTimeVal}`).toISOString();

    try {
      await bookResource.mutateAsync({
        resourceId,
        startTime: startIso,
        endTime: endIso,
        purpose: purpose || null,
      });
      toast.success('Resource booked successfully!');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to book resource');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bookings Calendar</h1>
          <p className="text-sm text-slate-500 mt-2">Manage asset reservations and schedules.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
        >
          <Plus className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
          New Booking
        </button>
      </div>

      {bookingsError && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          Error loading bookings: {bookingsError.message}
        </div>
      )}

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
          {isLoadingBookings ? (
            <div className="p-12 text-center text-slate-500">Loading reservations...</div>
          ) : bookingsForDay.length > 0 ? (
            bookingsForDay.map((booking) => (
              <div 
                key={booking.id} 
                className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-lg",
                    booking.status === 'cancelled' 
                      ? "bg-slate-100 text-slate-400" 
                      : "bg-blue-100 text-blue-600"
                  )}>
                    <span>{booking.resource?.name?.charAt(0) || 'R'}</span>
                  </div>
                  
                  <div>
                    <h3 className={cn(
                      "text-base font-semibold transition-colors",
                      booking.status === 'cancelled' ? "text-slate-400 line-through" : "text-slate-900 group-hover:text-blue-600"
                    )}>
                      {booking.resource?.name || 'Unknown Resource'} <span className="text-xs font-normal text-slate-400">({booking.resource?.asset_tag})</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{booking.booked_by?.name || 'Unknown User'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeRange(booking.start_time, booking.end_time)}
                      </span>
                      {booking.purpose && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.purpose}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                    booking.status === 'cancelled' 
                      ? "bg-slate-50 text-slate-600 ring-slate-500/10" 
                      : booking.status === 'completed'
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : booking.status === 'ongoing'
                      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                      : "bg-blue-50 text-blue-700 ring-blue-600/20"
                  )}>
                    {booking.status}
                  </span>
                  
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button 
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelBooking.isPending}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No bookings for this date</h3>
              <p className="mt-1 text-slate-500">There are no assets reserved for {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-900">Schedule New Reservation</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Select Bookable Resource *
                </label>
                <select 
                  name="resource_id" 
                  required 
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Select Resource --</option>
                  {bookableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Reservation Date *
                </label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  defaultValue={currentDate.toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start Time *
                  </label>
                  <input 
                    type="time" 
                    name="start_time" 
                    required 
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Time *
                  </label>
                  <input 
                    type="time" 
                    name="end_time" 
                    required 
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Purpose / Notes
                </label>
                <input 
                  type="text" 
                  name="purpose" 
                  placeholder="e.g. Weekly Sync, Field Testing"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={bookResource.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {bookResource.isPending ? 'Scheduling...' : 'Reserve Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
