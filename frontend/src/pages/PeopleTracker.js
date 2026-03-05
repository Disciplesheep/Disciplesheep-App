import React, { useState } from 'react';
import { useJournalData } from '@/hooks/useLocalStorage';
import { Users, Plus, Search, Edit2, Trash2, Phone, MapPin, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate, formatDisplayDate, GENERATIONS } from '@/utils/dateUtils';
import { useScreenSize } from '@/hooks/useScreenSize';

const PeopleTracker = () => {
  const { peopleContacts, setPeopleContacts } = useJournalData();
  const { isTablet } = useScreenSize();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    date: formatDate(new Date()),
    name: '',
    age: '',
    contactNumber: '',
    address: '',
    generation: '',
    connection: '',
    topic: '',
    nextStep: '',
    contactFrequencyDays: 7,
  };

  const [formData, setFormData] = useState(emptyForm);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.generation) {
      toast.error('Please fill in Name and Generation');
      return;
    }
    if (editingId) {
      setPeopleContacts(prev =>
        prev.map(p => p.id === editingId ? { ...formData, id: editingId } : p)
      );
      toast.success('Contact updated successfully!');
    } else {
      setPeopleContacts(prev => [{ ...formData, id: Date.now().toString() }, ...prev]);
      toast.success('New contact added!');
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (contact) => {
    setFormData({ ...emptyForm, ...contact });
    setEditingId(contact.id);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id) => {
    setPeopleContacts(prev => prev.filter(p => p.id !== id));
    toast.success('Contact removed');
  };

  const filteredContacts = peopleContacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.generation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.contactNumber?.includes(searchTerm)
  );

  const field = (label, children) => (
    <div>
      <Label className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold mb-2 block">
        {label}
      </Label>
      {children}
    </div>
  );

  const inputClass = "border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100";

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{
          backgroundImage: 'linear-gradient(rgba(15,81,50,0.85), rgba(15,81,50,0.65)), url(https://images.unsplash.com/photo-1606445095898-16c730da5732?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        data-testid="people-tracker-header"
      >
        <div className="relative z-10">
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">People Tracker</h1>
          <p className="text-white/80">Every conversation is a seed planted</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            type="text"
            placeholder="Search people, address, number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-full border-stone-200 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100"
            data-testid="search-people-input"
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-forest-500 hover:bg-forest-900 text-white rounded-full px-6" data-testid="add-person-btn">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className={isTablet ? 'max-w-2xl' : 'max-w-md'} data-testid="add-person-dialog">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">

              {field('Date',
                <Input type="date" value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className={inputClass} data-testid="person-date-input" />
              )}

              {field('Name *',
                <Input type="text" value={formData.name} placeholder="Full name"
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass} data-testid="person-name-input" />
              )}

              {/* Age + Contact Number side by side */}
              <div className={`grid gap-4 ${isTablet ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {field('Age',
                  <Input type="number" min="1" max="120" value={formData.age}
                    placeholder="e.g. 24"
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className={`${inputClass} font-mono`} data-testid="person-age-input" />
                )}
                {field('Contact Number',
                  <Input type="tel" value={formData.contactNumber}
                    placeholder="e.g. 09171234567"
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                    className={inputClass} data-testid="person-contact-input" />
                )}
              </div>

              {field('Address',
                <Input type="text" value={formData.address}
                  placeholder="e.g. Brgy. San Jose, Puerto Princesa"
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass} data-testid="person-address-input" />
              )}

              {field('Generation *',
                <Select value={formData.generation} onValueChange={v => setFormData({ ...formData, generation: v })}>
                  <SelectTrigger className={inputClass} data-testid="person-generation-select">
                    <SelectValue placeholder="Select generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATIONS.map(gen => (
                      <SelectItem key={gen.value} value={gen.value}>{gen.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field('How Connected',
                <Input type="text" value={formData.connection}
                  placeholder="e.g. WPU campus, Coffee shop"
                  onChange={e => setFormData({ ...formData, connection: e.target.value })}
                  className={inputClass} data-testid="person-connection-input" />
              )}

              {field('Conversation Topic',
                <Input type="text" value={formData.topic}
                  placeholder="What did you discuss?"
                  onChange={e => setFormData({ ...formData, topic: e.target.value })}
                  className={inputClass} data-testid="person-topic-input" />
              )}

              {field('Next Step',
                <Input type="text" value={formData.nextStep}
                  placeholder="Follow-up action"
                  onChange={e => setFormData({ ...formData, nextStep: e.target.value })}
                  className={inputClass} data-testid="person-nextstep-input" />
              )}

              {field('Contact Frequency (days)',
                <>
                  <Input type="number" min="1" max="365"
                    value={formData.contactFrequencyDays}
                    onChange={e => setFormData({ ...formData, contactFrequencyDays: parseInt(e.target.value) || 7 })}
                    placeholder="Days between follow-ups"
                    className={`${inputClass} font-mono`} data-testid="person-frequency-input" />
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">How often to follow up with this person</p>
                </>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11"
                data-testid="submit-person-btn"
              >
                {editingId ? 'Update Contact' : 'Add Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isTablet ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5" data-testid="total-contacts-card">
          <Users className="w-5 h-5 text-forest-500 dark:text-forest-400 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">{peopleContacts.length}</p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">Total Contacts</p>
        </Card>
        <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5" data-testid="this-week-card">
          <Users className="w-5 h-5 text-mango-500 mb-2" />
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {peopleContacts.filter(p => {
              const contactDate = new Date(p.date);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return contactDate >= weekAgo;
            }).length}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 uppercase tracking-wide">This Week</p>
        </Card>
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <Card className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-12 text-center" data-testid="empty-contacts">
            <Users className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <p className="text-stone-600 dark:text-stone-400">No contacts yet. Start tracking your conversations!</p>
          </Card>
        ) : (
          filteredContacts.map(contact => (
            <Card
              key={contact.id}
              className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-100 dark:border-stone-700 p-5 hover:shadow-md transition-shadow"
              data-testid={`contact-card-${contact.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">

                  {/* Name + generation badge */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">{contact.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-forest-50 dark:bg-forest-900/30 text-forest-900 dark:text-forest-300 font-medium">
                      {contact.generation}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{formatDisplayDate(new Date(contact.date))}</p>

                  {/* Age + Contact + Address row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                    {contact.age && (
                      <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                        <User className="w-3 h-3" /> {contact.age} yrs
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

                  {contact.connection && (
                    <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Connected:</strong> {contact.connection}</p>
                  )}
                  {contact.topic && (
                    <p className="text-sm text-stone-700 dark:text-stone-300 mb-1"><strong>Topic:</strong> {contact.topic}</p>
                  )}
                  {contact.nextStep && (
                    <p className="text-sm text-mango-700 dark:text-mango-400 font-medium mt-2">
                      <strong>Next:</strong> {contact.nextStep}
                    </p>
                  )}
                  {contact.contactFrequencyDays && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                      Follow-up: every {contact.contactFrequencyDays} days
                    </p>
                  )}
                </div>

                <div className="flex gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleEdit(contact)}
                    className="text-stone-600 dark:text-stone-400 hover:text-forest-600 dark:hover:text-forest-400"
                    data-testid={`edit-contact-${contact.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(contact.id)}
                    className="text-stone-600 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400"
                    data-testid={`delete-contact-${contact.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PeopleTracker;
