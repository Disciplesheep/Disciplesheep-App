import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useJournalData } from '@/hooks/useLocalStorage';
import { Users, Plus, Search, Edit2, Trash2, Phone, MapPin, User, Cake, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, formatDisplayDate, GENERATIONS } from '@/utils/dateUtils';
import { useScreenSize } from '@/hooks/useScreenSize';
import { format } from 'date-fns';
import DeleteGuardDialog from '@/components/DeleteGuardDialog';

/* ── Auto-focus next field ─────────────────────────────────────────────── */
const focusNext = (currentRef) => {
  const form = currentRef?.closest('[data-form]');
  if (!form) return;
  const fields = Array.from(form.querySelectorAll('input, select, textarea, button[data-focusable]'));
  const idx = fields.indexOf(currentRef);
  if (idx >= 0 && idx < fields.length - 1) fields[idx + 1]?.focus();
};

/* ── Derive generation from age ─────────────────────────────────────────── */
const getGenerationFromAge = (age) => {
  const a = parseInt(age);
  if (isNaN(a)) return '';
  if (a <= 12)  return 'Alpha';
  if (a <= 27)  return 'Gen Z';
  if (a <= 43)  return 'Millennial';
  if (a <= 59)  return 'Gen X';
  if (a <= 77)  return 'Boomer';
  return 'Silent';
};

/* ── Calculate age from birthday ─────────────────────────────────────────── */
const getAgeFromBirthday = (birthday) => {
  if (!birthday) return '';
  const b = new Date(birthday + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age > 0 ? String(age) : '';
};

const PeopleTracker = () => {
  const { peopleContacts, setPeopleContacts } = useJournalData();
  const { isTablet } = useScreenSize();
  const location = useLocation();

  const [searchTerm, setSearchTerm]           = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId]             = useState(null);
  const [pending, setPending]                 = useState(null);

  const refDate        = useRef();
  const refName        = useRef();
  const refAge         = useRef();
  const refBirthday    = useRef();
  const refPhone       = useRef();
  const refAddress     = useRef();
  const refFacebook    = useRef();
  const refConnection  = useRef();
  const refTopic       = useRef();
  const refNextStep    = useRef();
  const refFrequency   = useRef();

  const emptyForm = {
    date: formatDate(new Date()),
    name: '', age: '', birthday: '', contactNumber: '',
    facebookUrl: '', address: '', generation: '',
    connection: '', topic: '', nextStep: '',
    contactFrequencyDays: 7,
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (location.state?.openForm) {
      setIsAddDialogOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  /* Birthday → auto-fill age + generation */
  const handleBirthdayChange = (val) => {
    const age = getAgeFromBirthday(val);
    const generation = age ? getGenerationFromAge(age) : formData.generation;
    setFormData(f => ({ ...f, birthday: val, age, generation }));
    setTimeout(() => refPhone.current?.focus(), 100);
  };

  /* Age → auto-fill generation */
  const handleAgeChange = (val) => {
    const generation = getGenerationFromAge(val);
    setFormData(f => ({ ...f, age: val, generation }));
  };

  const resetForm = () => { setFormData(emptyForm); setEditingId(null); };

  const handleSubmit = () => {
    if (!formData.name || !formData.generation) {
      toast.error('Please fill in Name and Generation');
      return;
    }
    if (editingId) {
      setPeopleContacts(prev => prev.map(p => p.id === editingId ? { ...formData, id: editingId } : p));
      toast.success('Contact updated!');
    } else {
      setPeopleContacts(prev => [{ ...formData, id: Date.now().toString() }, ...prev]);
      toast.success('New contact added!');
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit   = (c) => { setFormData({ ...emptyForm, ...c }); setEditingId(c.id); setIsAddDialogOpen(true); };
  const handleDelete = (c) => setPending({ id: c.id, label: c.name });

  const confirmDelete = () => {
    setPeopleContacts(prev => prev.filter(p => p.id !== pending.id));
    toast.success('Contact removed');
    setPending(null);
  };

  const isBirthdayToday = (birthday) => {
    if (!birthday) return false;
    const b = new Date(birthday + 'T00:00:00');
    const today = new Date();
    return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
  };

  const filteredContacts = peopleContacts.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.generation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactNumber?.includes(searchTerm)
  );

  const ic = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

  const field = (label, children) => (
    <div>
      <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">{label}</Label>
      {children}
    </div>
  );

  const onEnter = (ref) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(ref.current); }
  };

  return (
    <div className="space-y-6 pb-6">

      <DeleteGuardDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        label={pending?.label || 'this contact'}
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ backgroundImage: 'linear-gradient(rgba(15,81,50,0.85),rgba(15,81,50,0.65)),url(https://images.unsplash.com/photo-1606445095898-16c730da5732?crop=entropy&cs=srgb&fm=jpg&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        data-testid="people-tracker-header">
        <div className="relative z-10">
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">People Tracker</h1>
          <p className="text-white/80">Every conversation is a seed planted</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input type="text" placeholder="Search people, address, number..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
            data-testid="search-people-input" />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={o => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-6" data-testid="add-person-btn">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className={isTablet ? 'max-w-2xl' : 'max-w-md'} data-testid="add-person-dialog">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1" data-form>

              {field('Date contacted',
                <Input ref={refDate} type="date" value={formData.date}
                  onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                  onKeyDown={onEnter(refDate)} className={ic} />
              )}

              {field('Name *',
                <Input ref={refName} type="text" value={formData.name} placeholder="Full name"
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={onEnter(refName)} className={ic} autoFocus />
              )}

              <div className="grid grid-cols-2 gap-4">
                {field('Age',
                  <Input ref={refAge} type="number" min="1" max="120" value={formData.age} placeholder="e.g. 24"
                    onChange={e => handleAgeChange(e.target.value)}
                    onKeyDown={onEnter(refAge)} className={`${ic} font-mono`} />
                )}
                {field('Birthday',
                  <Input ref={refBirthday} type="date" value={formData.birthday}
                    onChange={e => handleBirthdayChange(e.target.value)}
                    className={ic} />
                )}
              </div>

              {field('Generation *',
                <Select value={formData.generation} onValueChange={v => {
                  setFormData(f => ({ ...f, generation: v }));
                  setTimeout(() => refPhone.current?.focus(), 100);
                }}>
                  <SelectTrigger className={ic}><SelectValue placeholder="Select generation" /></SelectTrigger>
                  <SelectContent>
                    {GENERATIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {field('Contact Number',
                <Input ref={refPhone} type="tel" value={formData.contactNumber} placeholder="e.g. 09171234567"
                  onChange={e => setFormData(f => ({ ...f, contactNumber: e.target.value }))}
                  onKeyDown={onEnter(refPhone)} className={ic} />
              )}

              {field('Address',
                <Input ref={refAddress} type="text" value={formData.address} placeholder="e.g. Brgy. San Jose, Puerto Princesa"
                  onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  onKeyDown={onEnter(refAddress)} className={ic} />
              )}

              {field('Facebook Profile Link',
                <Input ref={refFacebook} type="text" value={formData.facebookUrl} placeholder="e.g. https://facebook.com/username"
                  onChange={e => setFormData(f => ({ ...f, facebookUrl: e.target.value }))}
                  onKeyDown={onEnter(refFacebook)} className={ic} />
              )}

              {field('Generation *',
                <Select value={formData.generation} onValueChange={v => {
                  setFormData(f => ({ ...f, generation: v }));
                  setTimeout(() => refConnection.current?.focus(), 100);
                }}>
                  <SelectTrigger className={ic}><SelectValue placeholder="Select generation" /></SelectTrigger>
                  <SelectContent>
                    {GENERATIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {field('How Connected',
                <Input ref={refConnection} type="text" value={formData.connection} placeholder="e.g. WPU campus, Coffee shop"
                  onChange={e => setFormData(f => ({ ...f, connection: e.target.value }))}
                  onKeyDown={onEnter(refConnection)} className={ic} />
              )}

              {field('Conversation Topic',
                <Input ref={refTopic} type="text" value={formData.topic} placeholder="What did you discuss?"
                  onChange={e => setFormData(f => ({ ...f, topic: e.target.value }))}
                  onKeyDown={onEnter(refTopic)} className={ic} />
              )}

              {field('Next Step',
                <Input ref={refNextStep} type="text" value={formData.nextStep} placeholder="Follow-up action"
                  onChange={e => setFormData(f => ({ ...f, nextStep: e.target.value }))}
                  onKeyDown={onEnter(refNextStep)} className={ic} />
              )}

              {field('Contact Frequency (days)',
                <>
                  <Input ref={refFrequency} type="number" min="1" max="365" value={formData.contactFrequencyDays}
                    onChange={e => setFormData(f => ({ ...f, contactFrequencyDays: parseInt(e.target.value) || 7 }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                    placeholder="Days between follow-ups" className={`${ic} font-mono`} />
                  <p className="text-xs text-stone-400 mt-1">How often to follow up · Press Enter to save</p>
                </>
              )}

              <Button onClick={handleSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11">
                {editingId ? 'Update Contact' : 'Add Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isTablet ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5">
          <Users className="w-5 h-5 text-forest-500 dark:text-forest-400 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{peopleContacts.length}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Total Contacts</p>
        </Card>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5">
          <Users className="w-5 h-5 text-mango-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {peopleContacts.filter(p => { const d = new Date(p.date); const w = new Date(); w.setDate(w.getDate()-7); return d >= w; }).length}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">This Week</p>
        </Card>
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-600 dark:text-stone-400">No contacts yet. Start tracking your conversations!</p>
          </Card>
        ) : filteredContacts.map(contact => (
          <Card key={contact.id}
            className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">{contact.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-forest-50 dark:bg-forest-900/30 text-forest-900 dark:text-forest-300 font-medium">
                    {contact.generation}
                  </span>
                  {isBirthdayToday(contact.birthday) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 font-medium flex items-center gap-1">
                      <Cake className="w-3 h-3" /> Birthday today!
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{formatDisplayDate(new Date(contact.date))}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                  {contact.age && <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"><User className="w-3 h-3" /> {contact.age} yrs</span>}
                  {contact.birthday && <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"><Cake className="w-3 h-3" /> {format(new Date(contact.birthday + 'T00:00:00'), 'MMMM d')}</span>}
                  {contact.contactNumber && <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"><Phone className="w-3 h-3" /> {contact.contactNumber}</span>}
                  {contact.address && <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"><MapPin className="w-3 h-3" /> {contact.address}</span>}
                </div>
                {contact.connection && <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Connected:</strong> {contact.connection}</p>}
                {contact.topic      && <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Topic:</strong> {contact.topic}</p>}
                {contact.nextStep   && <p className="text-sm text-mango-700 dark:text-mango-400 font-medium mt-2"><strong>Next:</strong> {contact.nextStep}</p>}
                {contact.contactFrequencyDays && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Follow-up: every {contact.contactFrequencyDays} days</p>}
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                {contact.contactNumber && (
                  <a href={`tel:${contact.contactNumber}`}>
                    <Button variant="ghost" size="sm" title="Call" className="text-stone-600 dark:text-stone-400 hover:text-green-600"><Phone className="w-4 h-4" /></Button>
                  </a>
                )}
                {contact.facebookUrl && (
                  <a href={contact.facebookUrl.startsWith('http') ? contact.facebookUrl : `https://facebook.com/${contact.facebookUrl}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" title="Message on Messenger" className="text-stone-600 dark:text-stone-400 hover:text-blue-600"><MessageCircle className="w-4 h-4" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)} className="text-stone-600 dark:text-stone-400 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)} className="text-stone-600 dark:text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PeopleTracker;