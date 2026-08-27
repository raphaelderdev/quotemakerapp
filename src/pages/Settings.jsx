import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { Upload, Loader2, Save } from 'lucide-react';
import { PROFESSIONS } from '@/lib/quoteUtils';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'CAD', 'AUD'];

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const l = await base44.entities.BusinessProfile.list();
        if (l && l.length) {
          setProfile(l[0]);
        } else {
          setProfile({
            company_name: '',
            logo_url: '',
            email: '',
            phone: '',
            address: '',
            vat_rate: 20,
            terms: '50% deposit to commence work, balance on completion. Quote valid for 30 days.',
            currency: 'EUR',
            profession: 'Plumber'
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const handleLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('logo_url', file_url);
    } catch (e) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!profile.company_name) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (profile.id) {
        const updated = await base44.entities.BusinessProfile.update(profile.id, profile);
        setProfile(updated);
      } else {
        const created = await base44.entities.BusinessProfile.create(profile);
        setProfile(created);
      }
      toast({ title: 'Settings saved' });
    } catch (e) {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div className="h-64 rounded-xl bg-muted animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Business profile</h1>
        <p className="text-muted-foreground mt-1">This appears on every quote you send.</p>
      </div>

      <Card className="p-5 md:p-6 space-y-4">
        <h2 className="font-medium">Branding</h2>
        <div className="flex items-center gap-4">
          {profile.logo_url ? (
            <Image
              src={profile.logo_url}
              alt="Logo"
              className="h-16 w-16 rounded-lg object-contain bg-muted/40 border"
              fittingType="fit"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
              No logo
            </div>
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogo(e.target.files && e.target.files[0])}
            />
            <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload logo
            </span>
          </label>
        </div>
        <div>
          <Label className="text-xs">Company name</Label>
          <Input
            className="mt-1"
            value={profile.company_name}
            onChange={(e) => set('company_name', e.target.value)}
            placeholder="Smith Electrical Ltd"
          />
        </div>
        <div>
          <Label className="text-xs">Profession</Label>
          <Select value={profile.profession} onValueChange={(v) => set('profession', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFESSIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-5 md:p-6 space-y-4">
        <h2 className="font-medium">Contact</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Email</Label>
            <Input
              className="mt-1"
              value={profile.email || ''}
              onChange={(e) => set('email', e.target.value)}
              placeholder="hello@smith-electrical.ie"
            />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input
              className="mt-1"
              value={profile.phone || ''}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+353 1 234 5678"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Address</Label>
          <Input
            className="mt-1"
            value={profile.address || ''}
            onChange={(e) => set('address', e.target.value)}
            placeholder="12 Main Street, Dublin, Ireland"
          />
        </div>
      </Card>

      <Card className="p-5 md:p-6 space-y-4">
        <h2 className="font-medium">Quote defaults</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Default VAT rate (%)</Label>
            <Input
              className="mt-1"
              type="number"
              min="0"
              value={profile.vat_rate}
              onChange={(e) => set('vat_rate', Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="text-xs">Currency</Label>
            <Select value={profile.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Default terms</Label>
          <Textarea
            className="mt-1"
            rows={3}
            value={profile.terms || ''}
            onChange={(e) => set('terms', e.target.value)}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="h-11">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}