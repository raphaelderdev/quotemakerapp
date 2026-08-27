import React from 'react';
import { cn } from '@/lib/utils';

const config = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  sent: { label: 'Sent', className: 'bg-blue-50 text-blue-600 border-blue-200' },
  accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' }
};

export default function QuoteStatusBadge({ status }) {
  const c = config[status] || config.draft;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  );
}