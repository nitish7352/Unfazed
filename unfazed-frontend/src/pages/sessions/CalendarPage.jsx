import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { enIN } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getSessionsAPI } from '../../api/sessions';
import { useToast } from '../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import SessionForm from '../../components/sessions/SessionForm';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Badge, { statusColor } from '../../components/common/Badge';

const locales = { 'en-IN': enIN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday start
  getDay,
  locales,
});

// Status → background colour map
const eventStyle = (status) => {
  const colors = {
    scheduled:   { bg: '#6366f1', border: '#4f46e5' },
    confirmed:   { bg: '#3b82f6', border: '#2563eb' },
    completed:   { bg: '#10b981', border: '#059669' },
    cancelled:   { bg: '#ef4444', border: '#dc2626' },
    no_show:     { bg: '#f59e0b', border: '#d97706' },
    in_progress: { bg: '#8b5cf6', border: '#7c3aed' },
  };
  return colors[status] || { bg: '#6366f1', border: '#4f46e5' };
};

const CalendarPage = () => {
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm,    setShowForm]    = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const toast    = useToast();
  const navigate = useNavigate();

  const fetchSessions = useCallback(async (date) => {
    setLoading(true);
    try {
      const start = subMonths(startOfMonth(date), 0);
      const end   = endOfMonth(addMonths(date, 0));
      const { data } = await getSessionsAPI({
        startDate: start.toISOString(),
        endDate:   end.toISOString(),
        limit:     500,
      });
      const mapped = data.data.map((s) => ({
        id:       s._id,
        title:    `${s.client?.firstName || ''} ${s.client?.lastName || ''}`,
        start:    new Date(s.startTime),
        end:      new Date(s.endTime),
        resource: s,
      }));
      setEvents(mapped);
    } catch { toast.error('Failed to load sessions'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(currentDate); }, [currentDate]);

  const handleNavigate = (date) => setCurrentDate(date);

  const handleSelectSlot = ({ start }) => {
    setSelectedSlot(start);
    setShowForm(true);
  };

  const handleSelectEvent = (event) => setSelectedEvent(event.resource);

  const eventPropGetter = (event) => {
    const { bg, border } = eventStyle(event.resource?.status);
    return {
      style: {
        backgroundColor: bg,
        borderColor:     border,
        borderRadius:    '4px',
        color:           '#fff',
        fontSize:        '11px',
        border:          `1px solid ${border}`,
      },
    };
  };

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Calendar</h2>
          <p className="text-sm text-slate-500">
            {format(currentDate, 'MMMM yyyy')} · {events.length} sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>
            List view
          </Button>
          <Button size="sm" onClick={() => { setSelectedSlot(new Date()); setShowForm(true); }}>
            + Schedule
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          ['scheduled', 'Scheduled'], ['confirmed', 'Confirmed'],
          ['completed', 'Completed'], ['cancelled', 'Cancelled'],
          ['in_progress', 'In progress'],
        ].map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: eventStyle(status).bg }}
              aria-hidden="true"
            />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
            <Spinner size="lg" />
          </div>
        )}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onNavigate={handleNavigate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          popup
          eventPropGetter={eventPropGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
          aria-label="Session calendar"
        />
      </div>

      {/* Schedule modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedSlot(null); }}
        title="Schedule session"
        size="md"
      >
        <SessionForm
          defaultStartTime={selectedSlot}
          onSuccess={() => { setShowForm(false); fetchSessions(currentDate); }}
          onCancel={() => { setShowForm(false); setSelectedSlot(null); }}
        />
      </Modal>

      {/* Session detail popover */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Session details"
          size="sm"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {selectedEvent.client?.firstName?.[0]}{selectedEvent.client?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  {selectedEvent.client?.firstName} {selectedEvent.client?.lastName}
                </p>
                <Badge label={selectedEvent.status} color={statusColor(selectedEvent.status)} />
              </div>
            </div>
            <div className="text-sm space-y-1 text-slate-600">
              <p>📅 {format(new Date(selectedEvent.startTime), 'EEEE, MMM d, yyyy')}</p>
              <p>🕐 {format(new Date(selectedEvent.startTime), 'h:mm a')} – {format(new Date(selectedEvent.endTime), 'h:mm a')} ({selectedEvent.duration} min)</p>
              <p>📋 {selectedEvent.type} · {selectedEvent.modality}</p>
              <p>💰 ₹{selectedEvent.rate?.toLocaleString('en-IN')} · {selectedEvent.paymentStatus}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => { navigate(`/sessions/${selectedEvent._id}`); setSelectedEvent(null); }}
              >
                View details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarPage;
