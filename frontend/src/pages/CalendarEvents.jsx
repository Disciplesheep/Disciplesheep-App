import React, { useState, useEffect } from 'react';
import { format, isToday, isPast, addMinutes } from 'date-fns';
import { useJournalData } from '@/hooks/useLocalStorage';
import { CalendarDays, Plus, Bell, Trash2, Edit2, Clock, ChevronDown, Cake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

/* ── Constants ──────────────────────────────────────────────────────────── */
const EVENT_COLORS = [
  { value: 'forest',  label: 'Green',  bg: '#4d7c0f', dot: '#4d7c0f' },
  { value: 'amber',   label: 'Amber',  bg: '#d97706', dot: '#d97706' },
  { value: 'blue',    label: 'Blue',   bg: '#3b82f6', dot: '#3b82f6' },
  { value: 'rose',    label: 'Rose',   bg: '#f43f5e', dot: '#f43f5e' },
  { value: 'purple',  label: 'Purple', bg: '#a855f7', dot: '#a855f7' },
  { value: 'stone',   label: 'Stone',  bg: '#78716c', dot: '#78716c' },
];
const colorFor = (v) => EVENT_COLORS.find(c => c.value === v) || EVENT_COLORS[0];
const toKey    = (d) => format(new Date(d), 'yyyy-MM-dd');
const emptyForm = (date) => ({
  title: '', date: date || toKey(new Date()), time: '',
  description: '', color: 'forest', remind: false, remindMinutes: '30',
});

/* ── Browser notification helpers ──────────────────────────────────────── */
const requestNotifPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
};

const scheduleNotification = (event) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!event.remind || !event.date) return;
  const eventDate = new Date(`${event.date}T${event.time || '09:00'}`);
  const notifTime = addMinutes(eventDate, -(parseInt(event.remindMinutes) || 30));
  const ms = notifTime.getTime() - Date.now();
  if (ms <= 0) return;
  setTimeout(() => {
    new Notification(`📅 ${event.title}`, {
      body: `Starting ${event.time ? `at ${event.time}` : 'soon'}${event.description ? ` · ${event.description}` : ''}`,
      icon: '/favicon.ico',
    });
  }, ms);
};

/* ── Event Form ─────────────────────────────────────────────────────────── */
const EventForm = ({ open, onOpenChange, initial, onSave }) => {
  const [form, setForm]     = useState(initial || emptyForm());
  const [calOpen, setCalOpen] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setForm(initial || emptyForm()); }, [open]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.date)         { toast.error('Date is required');  return; }
    if (form.remind) {
      const ok = await requestNotifPermission();
      if (!ok) toast.warning('Enable notifications in browser settings for reminders to work.');
    }
    onSave(form);
    onOpenChange(false);
  };

  const pickedDate = form.date ? new Date(form.date + 'T00:00:00') : new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial?.id ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Bible study, Cell group"
              className="dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Date *</Label>
            <button type="button" onClick={() => setCalOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-stone-200 dark:border-stone-600 dark:bg-stone-700 text-sm hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              style={{ minHeight: 0 }}>
              <span className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
                <CalendarDays className="w-4 h-4 text-stone-400" />
                {form.date ? format(pickedDate, 'MMMM d, yyyy') : 'Pick a date'}
              </span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${calOpen ? 'rotate-180' : ''}`} />
            </button>
            {calOpen && (
              <div className="mt-1 border border-stone-200 dark:border-stone-600 rounded-xl overflow-hidden shadow-md">
                <Calendar mode="single" selected={pickedDate}
                  onSelect={d => { if (d) { set('date', toKey(d)); setCalOpen(false); } }}
                  initialFocus />
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Time (optional)</Label>
            <Input type="time" value={form.time} onChange={e => set('time', e.target.value)}
              className="font-mono dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-1 block">Notes (optional)</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Any details..."
              className="dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100" />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Color</Label>
            <div className="flex gap-2">
              {EVENT_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => set('color', c.value)}
                  title={c.label} style={{ minHeight: 0, width: 28, height: 28, borderRadius: '50%', background: c.bg, border: form.color === c.value ? '3px solid #292524' : '3px solid transparent', transform: form.color === c.value ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s', cursor: 'pointer' }} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-700/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Remind me</span>
            </div>
            <button type="button" onClick={() => set('remind', !form.remind)} style={{ minHeight: 0 }}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.remind ? 'bg-forest-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.remind ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {form.remind && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">How many minutes before?</Label>
              <div className="flex gap-2 flex-wrap items-center">
                {['10','30','60','120'].map(m => (
                  <button key={m} type="button" onClick={() => set('remindMinutes', m)} style={{ minHeight: 0 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${form.remindMinutes === m ? 'bg-forest-500 text-white border-forest-500' : 'border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'}`}>
                    {m === '60' ? '1 hr' : m === '120' ? '2 hrs' : `${m} min`}
                  </button>
                ))}
                <Input type="number" min="1" max="1440" value={form.remindMinutes}
                  onChange={e => set('remindMinutes', e.target.value)}
                  className="w-20 h-8 text-xs font-mono dark:bg-stone-700 dark:border-stone-600" placeholder="custom" />
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

/* ── Event Card ─────────────────────────────────────────────────────────── */
const EventCard = ({ ev, onEdit, onDelete, isBirthday }) => {
  const c = colorFor(ev.color || (isBirthday ? 'rose' : 'forest'));
  return (
    <Card className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4 flex items-start gap-3">
      <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: c.dot, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
              {isBirthday && <Cake className="w-3.5 h-3.5 text-rose-400" />}
              {ev.title}
            </p>
            {ev.time && (
              <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {ev.time}
              </p>
            )}
            {ev.description && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{ev.description}</p>}
            {ev.remind && (
              <p className="text-xs text-forest-600 dark:text-forest-400 flex items-center gap-1 mt-1">
                <Bell className="w-3 h-3" /> {ev.remindMinutes} min before
              </p>
            )}
          </div>
          {!isBirthday && (
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onEdit(ev)}
                className="text-stone-400 hover:text-forest-600 h-8 w-8 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(ev.id)}
                className="text-stone-400 hover:text-red-500 h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

/* ── Main Page ──────────────────────────────────────────────────────────── */
const CalendarEvents = () => {
  const { calendarEvents, setCalendarEvents, peopleContacts } = useJournalData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    calendarEvents.forEach(ev => { if (ev.remind) scheduleNotification(ev); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thisYear = new Date().getFullYear();
  const birthdayEvents = (peopleContacts || [])
    .filter(p => p.birthday)
    .map(p => {
      const bday = new Date(p.birthday + 'T00:00:00');
      const thisYearBday = new Date(thisYear, bday.getMonth(), bday.getDate());
      return {
        id: `bday-${p.id}`,
        title: `🎂 ${p.name}'s Birthday`,
        date: toKey(thisYearBday),
        color: 'rose',
        isBirthday: true,
        description: p.age ? `Turning ${parseInt(p.age) + (thisYear - bday.getFullYear())} this year` : '',
      };
    });

  const allEvents = [...calendarEvents, ...birthdayEvents];
  const selectedKey = toKey(selectedDate);
  const dayEvents   = allEvents
    .filter(ev => ev.date === selectedKey)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const upcoming = allEvents
    .filter(ev => {
      const d = new Date(ev.date + 'T23:59:59');
      return !isPast(d) || isToday(new Date(ev.date + 'T00:00:00'));
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const handleSave = (form) => {
    if (editingEvent?.id && !editingEvent.id.startsWith('bday-')) {
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

  const handleDelete = (id) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    toast.success('Event removed');
  };

  const openAdd = () => { setEditingEvent(emptyForm(selectedKey)); setDialogOpen(true); };
  const openEdit = (ev) => { setEditingEvent(ev); setDialogOpen(true); };

  return (
    <div className="space-y-6 pb-6">

      {/* Global style to force full-width calendar grid */}
      <style>{`
        .full-cal .rdp { margin: 0; width: 100%; }
        .full-cal .rdp-months { width: 100%; }
        .full-cal .rdp-month { width: 100%; }
        .full-cal .rdp-table { width: 100%; border-collapse: collapse; }
        .full-cal .rdp-head_row,
        .full-cal .rdp-row { display: grid; grid-template-columns: repeat(7, 1fr); width: 100%; }
        .full-cal .rdp-head_cell { text-align: center; padding: 8px 4px; font-size: 0.75rem; }
        .full-cal .rdp-cell { display: flex; justify-content: center; align-items: center; padding: 3px 0; }
        .full-cal .rdp-day { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; }
        .full-cal .rdp-caption { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .full-cal .rdp-nav { display: flex; gap: 4px; }
        .full-cal .rdp-tbody { display: block; width: 100%; }
        .full-cal [class*="rdp-day_selected"] { background-color: #166534 !important; color: white !important; border-radius: 50% !important; }
        .full-cal [class*="rdp-day_today"]:not([class*="rdp-day_selected"]) { font-weight: bold; color: #166534; }
      `}</style>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white bg-stone-800 dark:bg-stone-900">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold tracking-tight">Calendar</h1>
          </div>
          <p className="text-white/80">Events, reminders, and birthdays</p>
        </div>
      </div>

      {/* Calendar */}
      <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden p-3">
        <div className="full-cal w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={d => { if (d) setSelectedDate(d); }}
            className="w-full"
            components={{
              DayContent: ({ date }) => {
                const key = toKey(date);
                const dots = [...new Set(allEvents.filter(ev => ev.date === key).map(ev => ev.color || 'forest'))];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', paddingBottom: dots.length ? 6 : 0 }}>
                    <span>{date.getDate()}</span>
                    {dots.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, position: 'absolute', bottom: -4 }}>
                        {dots.slice(0, 3).map((c, i) => (
                          <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: colorFor(c).dot }} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
      </Card>

      {/* Selected day */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <Button onClick={openAdd} className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-4 h-9 text-sm">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {dayEvents.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
            <p className="text-sm text-stone-500 dark:text-stone-400">No events on this day</p>
            <button onClick={openAdd} style={{ minHeight: 0, background: 'none', border: 'none', cursor: 'pointer' }}
              className="mt-2 text-xs text-forest-600 dark:text-forest-400 underline underline-offset-2">
              + Add an event
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {dayEvents.map(ev => (
              <EventCard key={ev.id} ev={ev} isBirthday={ev.isBirthday}
                onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.slice(0, 10).map(ev => {
              const c = colorFor(ev.color || 'forest');
              const evDate = new Date(ev.date + 'T00:00:00');
              return (
                <Card key={ev.id} onClick={() => setSelectedDate(evDate)}
                  className="bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: c.dot, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm truncate flex items-center gap-1">
                      {ev.isBirthday && <Cake className="w-3 h-3 text-rose-400 shrink-0" />}
                      {ev.title}
                    </p>
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

      <EventForm open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingEvent(null); }}
        initial={editingEvent} onSave={handleSave} />
    </div>
  );
};

export default CalendarEvents;
