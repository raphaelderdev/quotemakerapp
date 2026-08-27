import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import QuoteStatusBadge from '@/components/QuoteStatusBadge';
import { formatCurrency, lineTotal } from '@/lib/quoteUtils';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Mail,
  BellRing,
  Calendar
} from 'lucide-react';

function buildEmailBody(quote, profile) {
  const lines = [
    `Hi ${quote.customer_name || ''},`,
    ``,
    `Here is your quote${quote.quote_number ? ` (${quote.quote_number})` : ''}${quote.job_title ? ` for ${quote.job_title}` : ''}:`,
    ``,
    ...(quote.line_items || []).map(
      (li) => `• ${li.description} — ${li.quantity} x ${formatCurrency(li.unit_price, quote.currency)} = ${formatCurrency(lineTotal(li), quote.currency)}`
    ),
    ``,
    `Subtotal: ${formatCurrency(quote.subtotal, quote.currency)}`,
    `VAT (${quote.vat_rate || 0}%): ${formatCurrency(quote.vat_amount, quote.currency)}`,
    `Total: ${formatCurrency(quote.total, quote.currency)}`,
    ``
  ];
  if (quote.terms) lines.push(quote.terms, ``);
  lines.push(`Let me know if you'd like to go ahead.`);
  lines.push(``, `Best regards,`, (profile && profile.company_name) || '');
  return lines.join('\n');
}

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followUp, setFollowUp] = useState('');

  const load = async () => {
    try {
      const q = await base44.entities.Quote.get(id);
      setQuote(q);
      setFollowUp(q.follow_up_date || '');
      const pList = await base44.entities.BusinessProfile.list();
      setProfile((pList && pList[0]) || null);
    } catch (e) {
      toast({ title: 'Quote not found', variant: 'destructive' });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const update = async (data) => {
    try {
      await base44.entities.Quote.update(id, data);
      setQuote({ ...quote, ...data });
      toast({ title: 'Quote updated' });
    } catch (e) {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleSend = () => {
    const email = quote.customer_email;
    if (email) {
      const subject = `Quote ${quote.quote_number || ''} from ${(profile && profile.company_name) || ''}`.trim();
      const body = buildEmailBody(quote, profile);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      update({ status: 'sent' });
      toast({ title: 'Opening your email app…' });
    } else {
      update({ status: 'sent' });
      toast({ title: 'Marked as sent', description: 'No customer email on file — share the quote manually.' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this quote? This cannot be undone.')) return;
    try {
      await base44.entities.Quote.delete(id);
      toast({ title: 'Quote deleted' });
      navigate('/');
    } catch (e) {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const saveFollowUp = () => update({ follow_up_date: followUp });

  if (loading) return <div className="h-64 rounded-xl bg-muted animate-pulse" />;
  if (!quote) return null;

  const currency = quote.currency || (profile && profile.currency) || 'EUR';
  const created = quote.created_date ? new Date(quote.created_date).toLocaleDateString() : '—';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl tracking-tight">{quote.job_title || 'Quote'}</h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {quote.quote_number} · {quote.customer_name} · {created}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/quotes/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        {quote.status !== 'accepted' && quote.status !== 'rejected' && (
          <>
            <Button onClick={handleSend} size="sm">
              <Send className="h-4 w-4 mr-1.5" /> Email &amp; mark sent
            </Button>
            <Button variant="outline" size="sm" onClick={() => update({ status: 'accepted' })}>
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Mark accepted
            </Button>
            <Button variant="outline" size="sm" onClick={() => update({ status: 'rejected' })}>
              <XCircle className="h-4 w-4 mr-1.5 text-red-600" /> Mark rejected
            </Button>
          </>
        )}
        {quote.status === 'accepted' && (
          <Button variant="outline" size="sm" onClick={() => update({ status: 'sent' })}>
            Reopen as sent
          </Button>
        )}
        {quote.status === 'rejected' && (
          <Button variant="outline" size="sm" onClick={() => update({ status: 'sent' })}>
            Reopen as sent
          </Button>
        )}
      </div>

      {/* Follow-up */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BellRing className="h-4 w-4 text-amber-500" /> Follow-up reminder
        </div>
        <div className="flex-1 flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">Remind me on</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="mt-1 pl-9"
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={saveFollowUp}>
            Save
          </Button>
        </div>
      </Card>

      {/* Quote document */}
      <Card className="p-6 md:p-10 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-3">
            {profile && profile.logo_url ? (
              <Image
                src={profile.logo_url}
                alt={profile.company_name}
                className="h-14 w-14 rounded-lg object-contain bg-muted/40 border"
                fittingType="fit"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display text-xl text-primary-foreground">
                  {((profile && profile.company_name) || 'Q').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-display text-lg">{profile && profile.company_name ? profile.company_name : 'Your Business'}</div>
              {(profile && (profile.email || profile.phone)) && (
                <div className="text-xs text-muted-foreground">
                  {[profile.email, profile.phone].filter(Boolean).join(' · ')}
                </div>
              )}
              {profile && profile.address && (
                <div className="text-xs text-muted-foreground">{profile.address}</div>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-display text-xl tracking-tight">QUOTATION</div>
            <div className="text-sm text-muted-foreground mt-1">{quote.quote_number}</div>
            <div className="text-xs text-muted-foreground">Issued: {created}</div>
            {quote.valid_until && (
              <div className="text-xs text-muted-foreground">Valid until: {quote.valid_until}</div>
            )}
          </div>
        </div>

        {/* Customer */}
        <div className="py-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Quote for</div>
          <div className="font-medium">{quote.customer_name}</div>
          {quote.customer_email && <div className="text-sm text-muted-foreground">{quote.customer_email}</div>}
          {quote.customer_phone && <div className="text-sm text-muted-foreground">{quote.customer_phone}</div>}
        </div>

        {/* Line items */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Description</th>
                <th className="text-right font-medium px-4 py-3 w-20">Qty</th>
                <th className="text-right font-medium px-4 py-3 w-28">Unit price</th>
                <th className="text-right font-medium px-4 py-3 w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quote.line_items || []).map((li, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">{li.description}</td>
                  <td className="px-4 py-3 text-right">{li.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(li.unit_price, currency)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(lineTotal(li), currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quote.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT ({quote.vat_rate || 0}%)</span>
              <span>{formatCurrency(quote.vat_amount, currency)}</span>
            </div>
            <div className="flex justify-between font-medium text-base pt-2 border-t mt-1">
              <span>Total</span>
              <span>{formatCurrency(quote.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {quote.terms && (
          <div className="mt-8 pt-6 border-t">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Terms</div>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{quote.terms}</p>
          </div>
        )}

        {/* Accept button (visual) */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            To accept this quote, reply to this email or call us to confirm.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Accept quote
          </div>
        </div>
      </Card>

      {quote.customer_email && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleSend}>
            <Mail className="h-4 w-4 mr-1.5" /> Open email draft
          </Button>
        </div>
      )}
    </div>
  );
}