import React, { useState, useRef } from 'react';
import { useDiscipleshipTracking, DISCIPLESHIP_LEVELS, getDirectDisciples } from '@/hooks/useDiscipleshipTracking';
import { Users, Plus, ArrowRight, TrendingUp, Target, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentMinistryYear, getYearTargets } from '@/data/dailyDevotionals';

/* ── Auto-focus helpers ───────────────────────────────────────────────────── */
const focusRef = (ref) => setTimeout(() => ref?.current?.focus(), 80);
const onEnter  = (nextRef) => (e) => {
  if (e.key === 'Enter') { e.preventDefault(); focusRef(nextRef); }
};

const DiscipleshipTracker = () => {
  const { disciples, addDisciple, updateDisciple, deleteDisciple, getMultiplicationStats } = useDiscipleshipTracking();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    level: DISCIPLESHIP_LEVELS.TIMOTHY,
    discipledBy: '',
    status: 'active',
    notes: '',
    contactFrequency: 'weekly',
    salvation: false
  });

  const refName        = useRef();
  const refDiscipledBy = useRef();
  const refNotes       = useRef();
  const refCustomFreq  = useRef();

  const stats = getMultiplicationStats();
  const currentYear = getCurrentMinistryYear();
  const yearTargets = getYearTargets(currentYear);

  const resetForm = () => {
    setFormData({
      name: '', level: DISCIPLESHIP_LEVELS.TIMOTHY,
      discipledBy: '', status: 'active',
      notes: '', contactFrequency: 'weekly', salvation: false
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name) { toast.error('Please enter a name'); return; }
    if (editingId) {
      updateDisciple(editingId, formData);
      toast.success('Disciple updated!');
    } else {
      addDisciple(formData);
      toast.success(`${formData.name} added to ${formData.level} level!`);
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit   = (d) => { setFormData(d); setEditingId(d.id); setIsAddDialogOpen(true); };
  const handleDelete = (id) => { deleteDisciple(id); toast.success('Disciple removed'); };

  const timothys    = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.TIMOTHY);
  const faithfulMen = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.FAITHFUL_MEN);
  const others      = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.OTHERS);

  const discipleProgress = yearTargets.yearly.disciples
    ? Math.round((disciples.length / yearTargets.yearly.disciples) * 100) : 0;

  return (
    <div className="space-y-6 pb-6">

      <div className="relative overflow-hidden rounded-2xl p-8 text-white"
        style={{ backgroundImage: 'linear-gradient(rgba(15, 81, 50, 0.9), rgba(15, 81, 50, 0.7)), url(https://images.unsplash.com/photo-1606445095898-16c730da5732?crop=entropy&cs=srgb&fm=jpg&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        data-testid="discipleship-tracker-header">
        <div className="relative z-10">
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Discipleship Multiplication</h1>
          <p className="text-white/90 text-lg font-medium mb-1">2 Timothy 2:2 in Action</p>
          <p className="text-white/70 text-sm">Paul → Timothy → Faithful Men → Others</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-forest-50 to-green-50 rounded-xl shadow-sm border border-forest-100 p-6" data-testid="year-progress-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-forest-700" />
          <h2 className="font-serif text-xl font-semibold text-stone-900">Year {currentYear}: {yearTargets.phase}</h2>
        </div>
        <p className="text-sm text-stone-700 mb-4 italic">"{yearTargets.motto}"</p>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-700 font-medium">Total Disciples</span>
            <span className="font-mono font-bold text-stone-900">{disciples.length} / {yearTargets.yearly.disciples}</span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2.5">
            <div className="bg-forest-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(discipleProgress, 100)}%` }} />
          </div>
          <p className="text-xs text-stone-600 mt-1">{discipleProgress}% of year {currentYear} target</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-5" data-testid="timothys-stat">
          <div className="flex items-center justify-between mb-2"><Users className="w-5 h-5 text-forest-500" /><Badge className="bg-forest-100 text-forest-900 text-xs">Gen 2</Badge></div>
          <p className="text-2xl font-bold font-mono text-stone-900">{stats.totalTimothys}</p>
          <p className="text-xs text-stone-600 uppercase tracking-wide">Timothys</p>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-5" data-testid="faithful-men-stat">
          <div className="flex items-center justify-between mb-2"><Users className="w-5 h-5 text-blue-500" /><Badge className="bg-blue-100 text-blue-900 text-xs">Gen 3</Badge></div>
          <p className="text-2xl font-bold font-mono text-stone-900">{stats.totalFaithfulMen}</p>
          <p className="text-xs text-stone-600 uppercase tracking-wide">Faithful Men</p>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-5" data-testid="others-stat">
          <div className="flex items-center justify-between mb-2"><Users className="w-5 h-5 text-purple-500" /><Badge className="bg-purple-100 text-purple-900 text-xs">Gen 4</Badge></div>
          <p className="text-2xl font-bold font-mono text-stone-900">{stats.totalOthers}</p>
          <p className="text-xs text-stone-600 uppercase tracking-wide">Others</p>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-5" data-testid="total-stat">
          <div className="flex items-center justify-between mb-2"><TrendingUp className="w-5 h-5 text-mango-500" /><Badge className="bg-mango-100 text-mango-900 text-xs">×{stats.multiplicationFactor}</Badge></div>
          <p className="text-2xl font-bold font-mono text-stone-900">{stats.totalDisciples}</p>
          <p className="text-xs text-stone-600 uppercase tracking-wide">Total Disciples</p>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-12 font-serif shadow-lg" data-testid="add-disciple-btn">
            <UserPlus className="w-5 h-5 mr-2" /> Add Disciple
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md" data-testid="add-disciple-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">{editingId ? 'Edit Disciple' : 'Add New Disciple'}</DialogTitle>
          </DialogHeader>
          {/* CHANGED: added max-h-[60vh] overflow-y-auto dialog-scroll */}
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto dialog-scroll" data-form>

            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Name *</Label>
              <Input ref={refName} type="text" value={formData.name} autoFocus
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                placeholder="Full name" className="text-xs border-stone-200"
                data-testid="disciple-name-input" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Generation Level *</Label>
              <Select value={formData.level} onValueChange={v => {
                setFormData(prev => ({ ...prev, level: v, discipledBy: '' }));
                if (v !== DISCIPLESHIP_LEVELS.TIMOTHY) {
                  setTimeout(() => {
                    const next = document.querySelector('[data-testid="discipled-by-select"]');
                    next?.querySelector('button')?.focus() || next?.focus();
                  }, 120);
                }
              }}>
                <SelectTrigger className="text-xs border-stone-200" data-testid="disciple-level-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={DISCIPLESHIP_LEVELS.TIMOTHY}>Timothy (Your direct disciple)</SelectItem>
                  <SelectItem value={DISCIPLESHIP_LEVELS.FAITHFUL_MEN}>Faithful Men (Discipled by Timothy)</SelectItem>
                  <SelectItem value={DISCIPLESHIP_LEVELS.OTHERS}>Others (3rd generation)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.level !== DISCIPLESHIP_LEVELS.TIMOTHY && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Discipled By</Label>
                <Select value={formData.discipledBy}
                  onValueChange={v => {
                    setFormData(prev => ({ ...prev, discipledBy: v }));
                    setTimeout(() => {
                      const next = document.querySelector('[data-testid="contact-frequency-select"]');
                      next?.focus();
                    }, 120);
                  }}
                  data-testid="discipled-by-select">
                  <SelectTrigger className="text-xs border-stone-200" data-testid="discipled-by-select"><SelectValue placeholder="Select mentor" /></SelectTrigger>
                  <SelectContent>
                    {formData.level === DISCIPLESHIP_LEVELS.FAITHFUL_MEN && timothys.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    {formData.level === DISCIPLESHIP_LEVELS.OTHERS && faithfulMen.map(fm => <SelectItem key={fm.id} value={fm.id}>{fm.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Contact Frequency</Label>
              <Select value={formData.contactFrequency}
                onValueChange={v => {
                  setFormData(prev => ({ ...prev, contactFrequency: v }));
                  if (v === 'custom') { focusRef(refCustomFreq); } else { focusRef(refNotes); }
                }}>
                <SelectTrigger className="text-xs border-stone-200" data-testid="contact-frequency-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.contactFrequency === 'custom' && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Custom Frequency</Label>
                <Input ref={refCustomFreq} type="text" value={formData.customFrequency || ''}
                  onChange={e => setFormData({ ...formData, customFrequency: e.target.value })}
                  onKeyDown={onEnter(refNotes)}
                  placeholder="e.g. Every 2 weeks, Monthly, As needed"
                  className="text-xs border-stone-200" data-testid="custom-frequency-input" />
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-2 block">Notes</Label>
              <Input ref={refNotes} type="text" value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                placeholder="Spiritual growth, prayer needs, etc. · Press Enter to save"
                className="text-xs border-stone-200" data-testid="disciple-notes-input" />
            </div>

            <Button onClick={handleSubmit} className="w-full bg-forest-500 hover:bg-forest-900 text-white rounded-full h-11" data-testid="submit-disciple-btn">
              {editingId ? 'Update Disciple' : 'Add Disciple'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {timothys.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Your Timothys</h3>
            <Badge className="bg-forest-100 text-forest-900">Generation 2</Badge>
          </div>
          {timothys.map(timothy => {
            const theirDisciples = getDirectDisciples(disciples, timothy.id);
            return (
              <Card key={timothy.id} className="bg-white rounded-xl shadow-sm border border-stone-100 p-5" data-testid={`timothy-card-${timothy.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-serif text-lg font-semibold text-stone-900">{timothy.name}</h4>
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                      <span className="text-sm text-stone-600">Discipling {theirDisciples.length}</span>
                    </div>
                    {timothy.notes && <p className="text-sm text-stone-600 mb-2">{timothy.notes}</p>}
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span>Meeting: {timothy.contactFrequency === 'custom' ? timothy.customFrequency || 'Custom' : timothy.contactFrequency}</span>
                      {theirDisciples.length > 0 && <span className="text-forest-600 font-medium">→ {theirDisciples.map(d => d.name).join(', ')}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(timothy)} className="text-stone-600 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(timothy.id)} className="text-stone-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {faithfulMen.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Faithful Men & Women</h3>
            <Badge className="bg-blue-100 text-blue-900">Generation 3</Badge>
          </div>
          {faithfulMen.map(person => {
            const mentor = disciples.find(d => d.id === person.discipledBy);
            const theirDisciples = getDirectDisciples(disciples, person.id);
            return (
              <Card key={person.id} className="bg-blue-50/30 rounded-xl shadow-sm border border-blue-100 p-5" data-testid={`faithful-card-${person.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-serif text-base font-semibold text-stone-900">{person.name}</h4>
                      {theirDisciples.length > 0 && <><ArrowRight className="w-4 h-4 text-stone-400" /><span className="text-sm text-stone-600">Discipling {theirDisciples.length}</span></>}
                    </div>
                    {mentor && <p className="text-xs text-blue-700 mb-2">Discipled by: {mentor.name}</p>}
                    {person.notes && <p className="text-sm text-stone-600">{person.notes}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="text-stone-600 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(person.id)} className="text-stone-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-stone-900">Others</h3>
            <Badge className="bg-purple-100 text-purple-900">Generation 4</Badge>
          </div>
          {others.map(person => {
            const mentor = disciples.find(d => d.id === person.discipledBy);
            return (
              <Card key={person.id} className="bg-purple-50/30 rounded-xl shadow-sm border border-purple-100 p-5" data-testid={`others-card-${person.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-serif text-base font-semibold text-stone-900 mb-2">{person.name}</h4>
                    {mentor && <p className="text-xs text-purple-700 mb-2">Discipled by: {mentor.name}</p>}
                    {person.notes && <p className="text-sm text-stone-600">{person.notes}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(person)} className="text-stone-600 hover:text-forest-600"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(person.id)} className="text-stone-600 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {disciples.length === 0 && (
        <Card className="bg-white rounded-xl shadow-sm border border-stone-100 p-12 text-center" data-testid="empty-discipleship">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 mb-2">No disciples tracked yet</p>
          <p className="text-sm text-stone-500">Start by adding your first Timothy — someone you are investing in weekly</p>
        </Card>
      )}

      <Card className="bg-forest-50 rounded-xl border border-forest-100 p-6">
        <p className="font-serif text-base text-forest-900 italic text-center leading-relaxed">
          "And the things which you have heard from me in the presence of many witnesses, these entrust to faithful men who will be able to teach others also."
        </p>
        <p className="text-center text-sm text-stone-600 mt-2">— 2 Timothy 2:2 (NASB)</p>
      </Card>
    </div>
  );
};

export default DiscipleshipTracker;