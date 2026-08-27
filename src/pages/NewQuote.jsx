import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ResponsiveSelect from '@/components/ResponsiveSelect';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import LineItemEditor from '@/components/LineItemEditor';
import {
  PROFESSIONS,
  computeTotals,
  formatCurrency,
  generateQuoteNumber,
  todayISO,
  addDays
} from '@/lib/quoteUtils';

export default function NewQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [customers, setCustomers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [useNewCustomer, setUseNewCustomer] = useState(false);
  const [message, setMessage] = useState('');
  const [profession, setProfession] = useState('Plumber');

  const [jobTitle, setJobTitle] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [vatRate, setVatRate] = useState(20);
  const [validUntil, setValidUntil] = useState(addDays(todayISO(), 30));
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [missingInfo, setMissingInfo] = useState([]);
  const [quoteNumber, setQuoteNumber] = useState(generateQuoteNumber());

  useEffect(() => {
    (async () => {
      try {
        const [cList, pList] = await Promise.all([
          base44.entities.Customer.list(),
          base44.entities.BusinessProfile.list()
        ]);
        setCustomers(cList || []);
        const p = (pList && pList[0]) || null;
        setProfile(p);
        if (p) {
          setVatRate(Number(p.vat_rate) || 20);
          if (p.terms) setTerms(p.terms);
          if (p.profession) setProfession(p.profession);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoadingQuote(true);
        const q = await base44.entities.Quote.get(id);
        setCustomerId(q.customer_id || '');
        setUseNewCustomer(!q.customer_id);
        setNewCustomer({
          name: q.customer_name || '',
          email: q.customer_email || '',
          phone: q.customer_phone || ''
        });
        setMessage(q.raw_message || '');
        setProfession(q.profession || 'Plumber');
        setJobTitle(q.job_title || '');
        setLineItems(q.line_items || []);
        setVatRate(Number(q.vat_rate) || 0);
        setValidUntil(q.valid_until || addDays(todayISO(), 30));
        setTerms(q.terms || '');
        setNotes(q.notes || '');
        setQuoteNumber(q.quote_number || generateQuoteNumber());
      } catch (e) {
        toast({ title: 'Could not load quote', variant: 'destructive' });
      } finally {
        setLoadingQuote(false);
      }
    })();
  }, [id, isEdit]);

  const totals = useMemo(() => computeTotals(lineItems, vatRate), [lineItems, vatRate]);
  const currency = (profile && profile.currency) || 'EUR';

  const handleGenerate = async () => {
    if (!message.trim()) {
      toast({ title: 'Paste a customer message first', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateQuoteFromMessage', { message, profession });
      const data = res.data;
      setJobTitle(data.job_title || jobTitle);
      setLineItems(data.line_items || []);
      setMissingInfo(data.missing_info || []);
      toast({ title: 'Quote draft generated', description: 'Review and adjust the prices.' });
    } catch (e) {
      toast({ title: 'AI generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status) => {
    const cust = useNewCustomer
      ? newCustomer
      : customers.find((c) => c.id === customerId) || {};
    if (!cust.name) {
      toast({ title: 'Add a customer name', variant: 'destructive' });
      return;
    }
    if (!lineItems.length || lineItems.some((li) => !li.description)) {
      toast({ title: 'Add at least one line item with a description', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let custId = customerId;
      if (useNewCustomer && !isEdit) {
        const created = await base44.entities.Customer.create({
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          profession
        });
        custId = created.id;
      }
      const payload = {
        quote_number: quoteNumber,
        customer_id: custId || '',
        customer_name: cust.name,
        customer_email: cust.email || '',
        customer_phone: cust.phone || '',
        status,
        raw_message: message,
        profession,
        job_title: jobTitle,
        line_items: lineItems,
        subtotal: totals.subtotal,
        vat_rate: Number(vatRate) || 0,
        vat_amount: totals.vat_amount,
        total: totals.total,
        terms,
        valid_until: validUntil,
        notes,
        currency
      };
      if (isEdit) {
        await base44.entities.Quote.update(id, payload);
        toast({ title: 'Quote updated' });
        navigate(`/quotes/${id}`);
      } else {
        const created = await base44.entities.Quote.create(payload);
        toast({ title: status === 'sent' ? 'Quote saved & marked sent' : 'Quote saved as draft' });
        navigate(`/quotes/${created.id}`);
      }
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to={isEdit ? `/quotes/${id}` : '/'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="font-display text-2xl tracking-tight">{isEdit ? 'Edit quote' : 'New quote'}</h1>
      </div>

      {loadingQuote ? (
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      ) : (
        <>
          <Card className="p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-medium">Customer message</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste the WhatsApp, email, or text message from your customer. AI will extract the job
              details and suggest priced line items.
            </p>
            <Textarea
              rows={5}
              placeholder="Hi, need a bathroom renovated. About 12m², new tiles, shower and vanity. How much?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs">Profession</Label>
                <ResponsiveSelect
                  className="mt-1"
                  value={profession}
                  onValueChange={setProfession}
                  options={PROFESSIONS.map((p) => ({ value: p, label: p }))}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleGenerate} disabled={generating} className="h-10 w-full sm:w-auto">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
            {generating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the message and estimating prices…
              </div>
            )}
            {missingInfo.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <AlertCircle className="h-4 w-4" /> Missing information to confirm
                </div>
                <ul className="mt-2 ml-6 list-disc text-sm text-amber-700 space-y-0.5">
                  {missingInfo.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-5 md:p-6 space-y-4">
            <h2 className="font-medium">Customer</h2>
            {customers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setUseNewCustomer(false)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    !useNewCustomer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  Existing
                </button>
                <button
                  onClick={() => setUseNewCustomer(true)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    useNewCustomer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  New customer
                </button>
              </div>
            )}
            {useNewCustomer || customers.length === 0 ? (
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    className="mt-1"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    className="mt-1"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    className="mt-1"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+353 87 123 4567"
                  />
                </div>
              </div>
            ) : (
              <ResponsiveSelect
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select a customer"
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
              />
            )}
          </Card>

          <Card className="p-5 md:p-6 space-y-4">
            <h2 className="font-medium">Quote details</h2>
            <div>
              <Label className="text-xs">Job title</Label>
              <Input
                className="mt-1"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Bathroom renovation"
              />
            </div>
            <div>
              <Label className="text-xs">Line items</Label>
              <div className="mt-2">
                <LineItemEditor items={lineItems} onChange={setLineItems} currency={currency} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">VAT rate (%)</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="0"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Valid until</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="text-xs text-muted-foreground">Subtotal</div>
                <div className="font-medium">{formatCurrency(totals.subtotal, currency)}</div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Terms</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="50% deposit to commence work, balance on completion. Quote valid for 30 days."
              />
            </div>
            <div>
              <Label className="text-xs">Internal notes</Label>
              <Input
                className="mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes (not shown to customer)"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({vatRate || 0}%)</span>
                <span>{formatCurrency(totals.vat_amount, currency)}</span>
              </div>
              <div className="flex justify-between font-medium text-base pt-1 border-t mt-1">
                <span>Total</span>
                <span>{formatCurrency(totals.total, currency)}</span>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Save draft
            </Button>
            <Button onClick={() => handleSave('sent')} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Save &amp; send
            </Button>
          </div>
        </>
      )}
    </div>
  );
}