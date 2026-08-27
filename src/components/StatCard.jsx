import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('h-4 w-4', accent || 'text-muted-foreground')} />}
      </div>
      <div className="mt-2 font-display text-2xl tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}