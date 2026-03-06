import React, { useState, useEffect } from 'react';
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

const PeopleTracker = () => {
  const { peopleContacts, setPeopleContacts } = useJournalData();
  const { isTablet } = useScreenSize();
  const location = useLocation();

  const [searchTerm, setSearchTerm]       = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [pending, setPending]             = useState(null); // delete guard

  const emptyForm = {
    date: formatDate(new Date()),
    name: '',
    age: '',
    birthday: '',
    contactNumber: '',
    facebookUrl: '',
    address: '',
    generation: '',
    connection: '',
    topic: '',
    nextStep: '',
    contactFrequencyDays: 7,
  };

  const [formData, setFormData] = useState(emptyForm);

  // Auto-open Add Contact dialog when navigated from Dashboard
  useEffect(() => {
    if (location.state?.openForm) {
      setIsAddDialogOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

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
  const handleDelete = (c)  => setPending({ id: c.id, label: c.name });

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

  const field = (label, children) => (
    <div>
      <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">{label}</Label>
      {children}
    </div>
  );

  const ic = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

  return (
    <div className="space-y-6 pb-6">

      {/* Delete Guard Dialog */}
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
            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">

              {field('Date contacted',
                <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={ic} />
              )}
              {field('Name *',
                <Input type="text" value={formData.name} placeholder="Full name"
                  onChange={e => setFormData({ ...formData, name: e.target.value })} className={ic} />
              )}

              <div className="grid grid-cols-2 gap-4">
                {field('Age',
                  <Input type="number" min="1" max="120" value={formData.age} placeholder="e.g. 24"
                    onChange={e => setFormData({ ...formData, age: e.target.value })} className={`${ic} font-mono`} />
                )}
                {field('Birthday',
                  <Input type="date" value={formData.birthday}
                    onChange={e => setFormData({ ...formData, birthday: e.target.value })} className={ic} />
                )}
              </div>

              {field('Contact Number',
                <Input type="tel" value={formData.contactNumber} placeholder="e.g. 09171234567"
                  onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} className={ic} />
              )}
              {field('Address',
                <Input type="text" value={formData.address} placeholder="e.g. Brgy. San Jose, Puerto Princesa"
                  onChange={e => setFormData({ ...formData, address: e.target.value })} className={ic} />
              )}
              {field('Facebook Profile Link',
                <Input type="text" value={formData.facebookUrl} placeholder="e.g. https://facebook.com/username"
                  onChange={e => setFormData({ ...formData, facebookUrl: e.target.value })} className={ic} />
              )}
              {field('Generation *',
                <Select value={formData.generation} onValueChange={v => setFormData({ ...formData, generation: v })}>
                  <SelectTrigger className={ic}><SelectValue placeholder="Select generation" /></SelectTrigger>
                  <SelectContent>
                    {GENERATIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {field('How Connected',
                <Input type="text" value={formData.connection} placeholder="e.g. WPU campus, Coffee shop"
                  onChange={e => setFormData({ ...formData, connection: e.target.value })} className={ic} />
              )}
              {field('Conversation Topic',
                <Input type="text" value={formData.topic} placeholder="What did you discuss?"
                  onChange={e => setFormData({ ...formData, topic: e.target.value })} className={ic} />
              )}
              {field('Next Step',
                <Input type="text" value={formData.nextStep} placeholder="Follow-up action"
                  onChange={e => setFormData({ ...formData, nextStep: e.target.value })} className={ic} />
              )}
              {field('Contact Frequency (days)',
                <>
                  <Input type="number" min="1" max="365" value={formData.contactFrequencyDays}
                    onChange={e => setFormData({ ...formData, contactFrequencyDays: parseInt(e.target.value) || 7 })}
                    placeholder="Days between follow-ups" className={`${ic} font-mono`} />
                  <p className="text-xs text-stone-400 mt-1">How often to follow up</p>
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
                  {contact.age && (
                    <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <User className="w-3 h-3" /> {contact.age} yrs
                    </span>
                  )}
                  {contact.birthday && (
                    <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <Cake className="w-3 h-3" /> {format(new Date(contact.birthday + 'T00:00:00'), 'MMMM d')}
                    </span>
                  )}
                  {contact.contactNumber && (
                    <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <Phone className="w-3 h-3" /> {contact.contactNumber}
                    </span>
                  )}
                  {contact.address && (
                    <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                      <MapPin className="w-3 h-3" /> {contact.address}
                    </span>
                  )}
                </div>

                {contact.connection && <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Connected:</strong> {contact.connection}</p>}
                {contact.topic      && <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Topic:</strong> {contact.topic}</p>}
                {contact.nextStep   && <p className="text-sm text-mango-700 dark:text-mango-400 font-medium mt-2"><strong>Next:</strong> {contact.nextStep}</p>}
                {contact.contactFrequencyDays && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Follow-up: every {contact.contactFrequencyDays} days</p>
                )}
              </div>

              <div className="flex gap-1 ml-2 shrink-0">
                {contact.contactNumber && (
                  <a href={`tel:${contact.contactNumber}`}>
                    <Button variant="ghost" size="sm" title="Call"
                      className="text-stone-600 dark:text-stone-400 hover:text-green-600"><Phone className="w-4 h-4" /></Button>
                  </a>
                )}
                {contact.facebookUrl && (
                  <a href={contact.facebookUrl.startsWith('http') ? contact.facebookUrl : `https://facebook.com/${contact.facebookUrl}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" title="Message on Messenger"
                      className="text-stone-600 dark:text-stone-400 hover:text-blue-600"><MessageCircle className="w-4 h-4" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}
                  className="text-stone-600 dark:text-stone-400 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(contact)}
                  className="text-stone-600 dark:text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PeopleTracker;