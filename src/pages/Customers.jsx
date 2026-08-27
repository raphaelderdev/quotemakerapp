import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import ResponsiveSelect from '@/components/ResponsiveSelect';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Users, Mail, Phone } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { PROFESSIONS } from '@/lib/quoteUtils';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', profession: 'Plumber', notes: '' });
  const { toast } = useToast();

  const load = async () => {
    try {
      const l = await base44.entities.Customer.list('-created_date');
      setCustomers(l || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    try {
      await base44.entities.Customer.create(form);
      setForm({ name: '', email: '', phone: '', profession: 'Plumber', notes: '' });
      setOpen(false);
      toast({ title: 'Customer added' });
      load();
    } catch (e) {
      toast({ title: 'Failed to add customer', variant: 'destructive' });
    }
  };

  const remove = async (cid) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await base44.entities.Customer.delete(cid);
      load();
    } catch (e) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">People you've quoted.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    className="mt-1"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    className="mt-1"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+353 87 123 4567"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Profession</Label>
                <ResponsiveSelect
                  className="mt-1"
                  value={form.profession}
                  onValueChange={(v) => setForm({ ...form, profession: v })}
                  options={PROFESSIONS.map((p) => ({ value: p, label: p }))}
                />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <Button className="w-full" onClick={add}>
                Save customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add customers manually, or they're created automatically when you build a quote."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add your first customer
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {customers.map((c) => (
            <Card key={c.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                {c.profession && (
                  <div className="text-xs text-muted-foreground mt-0.5">{c.profession}</div>
                )}
                <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {c.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5" /> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}