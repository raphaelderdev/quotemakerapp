import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FilePlus2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  BellRing
} from 'lucide-react';
import QuoteStatusBadge from '@/components/QuoteStatusBadge';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import PullToRefresh from '@/components/PullToRefresh';
import { formatCurrency, todayISO } from '@/lib/quoteUtils';

const FILTERS = ['all', 'draft', 'sent', 'accepted', 'rejected'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currency, setCurrency] = useState('EUR');

  const load = async () => {
    try {
      const [list, profiles] = await Promise.all([
        base44.entities.Quote.list('-created_date', 200),
        base44.entities.BusinessProfile.list()
      ]);
      setQuotes(list || []);
      if (profiles && profiles.length) setCurrency(profiles[0].currency || 'EUR');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const by = (s) => quotes.filter((q) => q.status === s).length;
    const acceptedValue = quotes
      .filter((q) => q.status === 'accepted')
      .reduce((sum, q) => sum + (Number(q.total) || 0), 0);
    return {
      draft: by('draft'),
      sent: by('sent'),
      accepted: by('accepted'),
      rejected: by('rejected'),
      acceptedValue
    };
  }, [quotes]);

  const followUps = useMemo(() => {
    const t = todayISO();
    return quotes.filter((q) => q.status === 'sent' && q.follow_up_date && q.follow_up_date <= t);
  }, [quotes]);

  const filtered = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);

  return (
    <PullToRefresh onRefresh={load}>
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Turn customer messages into professional quotes.</p>
        </div>
        <Link to="/quotes/new">
          <Button className="h-11">
            <FilePlus2 className="h-4 w-4 mr-2" /> New Quote
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Draft" value={stats.draft} icon={FileText} />
        <StatCard label="Sent" value={stats.sent} icon={Send} accent="text-blue-500" />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          sub={formatCurrency(stats.acceptedValue, currency)}
          icon={CheckCircle2}
          accent="text-emerald-500"
        />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="text-red-500" />
      </div>

      {followUps.length > 0 && (
        <Card className="p-5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="h-4 w-4 text-amber-600" />
            <h2 className="font-medium text-amber-800">Follow-up reminders</h2>
          </div>
          <div className="space-y-2">
            {followUps.map((q) => (
              <Link
                key={q.id}
                to={`/quotes/${q.id}`}
                className="flex items-center justify-between rounded-lg bg-white border px-4 py-2.5 hover:shadow-sm transition"
              >
                <div>
                  <div className="text-sm font-medium">{q.job_title || q.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {q.customer_name} · due {q.follow_up_date}
                  </div>
                </div>
                <Clock className="h-4 w-4 text-amber-500" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-sm capitalize transition whitespace-nowrap ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotes yet"
            description="Paste a customer message and let AI build your first quote in under a minute."
            action={
              <Link to="/quotes/new">
                <Button>
                  <FilePlus2 className="h-4 w-4 mr-2" /> Create your first quote
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="rounded-xl border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Customer</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Job</th>
                  <th className="text-right font-medium px-4 py-3">Total</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr
                    key={q.id}
                    className="border-t hover:bg-muted/30 transition cursor-pointer"
                    onClick={() => navigate(`/quotes/${q.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{q.customer_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {q.job_title || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(q.total, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {q.created_date ? new Date(q.created_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}