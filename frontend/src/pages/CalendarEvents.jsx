import React, { useState, useEffect } from 'react';
import { format, isSameDay, isPast, isToday, addMinutes } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { CalendarDays, Plus, Bell, BellOff, Trash2, Edit2, Clock, Tag, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

/* ── Helpers ────────────────────────────────────────────────────────────── */
const EVENT_COLORS = [
  { value: 'forest',  label: 'Green',  bg: 'bg-forest-500',   text: 'text-white',        dot: '#4d7c0f' },
  { value: 'amber',   label: 'Amber',  bg: 'bg-amber-500',    text: 'text-white',        dot: '#d97706' },
  { value: 'blue',    label: 'Blue',   bg: 'bg-blue-500',     text: 'text-white',        dot: '#3b82f6' },
  { value: 'rose',    label: 'Rose',   bg: 'bg-rose-500',     text: 'text-white',        dot: '#f43f5e' },
  { value: 'purple',  label: 'Purple', bg: 'bg-purple-500',   text: 'text-white',        dot: '#a855f7' },
  { value: 'stone',   label: 'Stone',  bg: 'bg-stone-500',    text: 'text-white',        dot: '#78716c' },
];

const colorFor = (value) => EVENT_COLORS.find(c => c.value === value) || EVENT_COLORS[0];

const toDateKey = (date) => format(new Date(date), 'yyyy-MM-dd');

/* Request browser notification permission */
const requestNotifPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

/* Schedule a browser notification for an event */
const scheduleNotification = (event) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!event.remind || !event.date) return;

  const eventDate = new Date(`${event.date}T${event.time || '09:00'}`);
  const notifTime = addMinutes(eventDate, -(parseInt(event.remindMinutes) || 30));
  const msUntil   = notifTime.getTime() - Date.now();
  if (msUntil <= 0) return;

  setTimeout(() => {
    new Notification(`📅 ${event.title}`, {
      body: `Starting ${event.time ? `at ${event.time}` : 'soon'}${event.description ? ` · ${event.description}` : ''}`,
      icon: '/favicon.ico',
    });
  }, msUntil);
};

/* ── Empty form ─────────────────────────────────────────────────────────── */
const emptyForm = () => ({
  title: '',
  date: toDateKey(new Date()),
  time: '',
  description: '',
  color: 'forest',
  remind: false,
  remindMinutes: '30',
});

/* ── Event Form Dialog ──────────────────────────────────────────────────── */
const EventFormDialog = ({ open, onOpenChange, initial, onSave, triggerEl }) => {
  const [form, setForm] = useState(initial || emptyForm());
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => { setForm(initial || emptyForm()); }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.date)          { toast.error('Date is required');  return; }

    if (form.remind) {
      const granted = await requestNotifPermission();
      if (!granted) toast.warning('Notifications blocked — reminder won\'t fire unless you allow them in browser settings.');
    }

    onSave(form);
    onOpenChange(false);
  };

  const selectedDateObj = form.date ? new Date(form.date + 'T00:00:00') : new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerEl && <DialogTrigger asChild>{triggerEl}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial?.id ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[75vh] overflow-y-auto pr-1">

          {/* Title */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Bible study, Cell group" />
          </div>

          {/* Date picker */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Date *</Label>
            <button
              type="button"
              onClick={() => setCalOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-stone-200 dark:border-stone-600 dark:bg-stone-700 text-sm hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              style={{ minHeight: 0 }}
            >
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-stone-400" />
                {form.date ? format(selectedDateObj, 'MMMM d, yyyy') : 'Pick a date'}
              </span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${calOpen ? 'rotate-180' : ''}`} />
            </button>
            {calOpen && (
              <div className="mt-1 border border-stone-200 dark:border-stone-600 rounded-xl overflow-hidden shadow-md">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={d => { if (d) { set('date', toDateKey(d)); setCalOpen(false); } }}
                  initialFocus
                />
              </div>
            )}
          </div>

          {/* Time */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Time (optional)</Label>
            <Input type="time" value={form.time} onChange={e => set('time', e.target.value)}
              className="font-mono dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Notes (optional)</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Any details..." className="dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          </div>

          {/* Color */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Color</Label>
            <div className="flex gap-2">
              {EVENT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('color', c.value)}
                  title={c.label}
                  style={{ minHeight: 0 }}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${form.color === c.value ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          {/* Remind toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-700/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Remind me</span>
            </div>
            <button
              type="button"
              onClick={() => set('remind', !form.remind)}
              style={{ minHeight: 0 }}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.remind ? 'bg-forest-500' : 'bg-stone-300 dark:bg-stone-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.remind ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Remind minutes */}
          {form.remind && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Remind me how many minutes before?</Label>
              <div className="flex gap-2 flex-wrap">
                {['10','30','60','120'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('remindMinutes', m)}
                    style={{ minHeight: 0 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.remindMinutes === m
                        ? 'bg-forest-500 text-white border-forest-500'
                        : 'border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {m === '60' ? '1 hr' : m === '120' ? '2 hrs' : `${m} min`}
                  </button>
                ))}
                <Input
                  type="number" min="1" max="1440"
                  value={form.remindMinutes}
                  onChange={e => set('remindMinutes', e.target.value)}
                  className="w-20 h-8 text-xs font-mono dark:bg-stone-700 dark:border-stone-600"
                  placeholder="custom"
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
            {initial?.id ? 'Save Changes' : 'Add Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ── Main CalendarEvents page ───────────────────────────────────────────── */
const CalendarEvents = () => {
  const { calendarEvents, setCalendarEvents } = useJournalData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  /* Schedule reminders on mount for future events */
  useEffect(() => {
    calendarEvents.forEach(ev => { if (ev.remind) scheduleNotification(ev); });
  }, []);

  /* Dates that have events — for dot indicators */
  const eventDates = calendarEvents.map(ev => new Date(ev.date + 'T00:00:00'));

  /* Events for the selected date */
  const selectedKey = toDateKey(selectedDate);
  const dayEvents   = calendarEvents
    .filter(ev => ev.date === selectedKey)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  /* Upcoming events (today + future), sorted */
  const upcoming = calendarEvents
    .filter(ev => !isPast(new Date(ev.date + 'T23:59:59')) || isToday(new Date(ev.date + 'T00:00:00')))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const handleSave = (form) => {
    if (editingEvent?.id) {
      const updated = { ...form, id: editingEvent.id };
      setCalendarEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      if (updated.remind) scheduleNotification(updated);
      toast.success('Event updated!');
    } else {
      const newEv = { ...form, id: Date.now().toString() };
      setCalendarEvents(prev => [...prev, newEv]);
      if (newEv.remind) scheduleNotification(newEv);
      toast.success('Event added!');
    }
    setEditingEvent(null);
  };

  const handleEdit = (ev) => { setEditingEvent(ev); setDialogOpen(true); };

  const handleDelete = (id) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Event removed');
  };

  const openAddForDate = () => {
    setEditingEvent({ ...emptyForm(), date: selectedKey });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white bg-stone-800 dark:bg-stone-900">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold tracking-tight">Calendar</h1>
          </div>
          <p className="text-white/80">Plan your ministry and personal events</p>
        </div>
      </div>

      {/* Calendar card */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={d => { if (d) setSelectedDate(d); }}
          className="w-full"
          /* Render dot under days that have events */
          components={{
            DayContent: ({ date, activeModifiers }) => {
              const key = toDateKey(date);
              const hasEvents = calendarEvents.some(ev => ev.date === key);
              const dots = hasEvents
                ? [...new Set(calendarEvents.filter(ev => ev.date === key).map(ev => ev.color))]
                : [];
              return (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>{date.getDate()}</span>
                  {dots.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: -6 }}>
                      {dots.slice(0, 3).map((c, i) => (
                        <span key={i} style={{
                          width: 4, height: 4, borderRadius: '50%',
                          background: colorFor(c).dot,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
      </Card>

      {/* Selected day events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <Button
            onClick={openAddForDate}
            className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-4 h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {dayEvents.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-sm text-stone-500 dark:text-stone-400">No events on this day</p>
            <button
              onClick={openAddForDate}
              className="mt-3 text-xs text-forest-600 dark:text-forest-400 underline underline-offset-2"
              style={{ minHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              + Add an event
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => {
              const c = colorFor(ev.color);
              return (
                <Card key={ev.id} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4 flex items-start gap-3">
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: c.dot, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{ev.title}</p>
                        {ev.time && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {ev.time}
                          </p>
                        )}
                        {ev.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{ev.description}</p>
                        )}
                        {ev.remind && (
                          <p className="text-xs text-forest-600 dark:text-forest-400 flex items-center gap-1 mt-1">
                            <Bell className="w-3 h-3" />
                            Reminder: {ev.remindMinutes} min before
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(ev)}
                          className="text-stone-400 hover:text-forest-600 dark:hover:text-forest-400 h-8 w-8 p-0">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(ev.id)}
                          className="text-stone-400 hover:text-red-500 h-8 w-8 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 10).map(ev => {
              const c = colorFor(ev.color);
              const evDate = new Date(ev.date + 'T00:00:00');
              return (
                <Card key={ev.id}
                  className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedDate(evDate)}
                >
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: c.dot, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {isToday(evDate) ? 'Today' : format(evDate, 'MMM d, yyyy')}
                      {ev.time ? ` · ${ev.time}` : ''}
                    </p>
                  </div>
                  {ev.remind && <Bell className="w-3.5 h-3.5 text-forest-500 shrink-0" />}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Event form dialog */}
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingEvent(null); }}
        initial={editingEvent}
        onSave={handleSave}
      />
    </div>
  );
};

export default CalendarEvents;
