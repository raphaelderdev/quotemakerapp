import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, lineTotal } from '@/lib/quoteUtils';

export default function LineItemEditor({ items, onChange, currency = 'EUR' }) {
  const update = (i, field, value) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it));
    onChange(next);
  };
  const add = () => onChange([...items, { description: '', quantity: 1, unit_price: 0 }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <Input
            className="col-span-12 md:col-span-6"
            placeholder="Description (e.g. Supply & fit ceramic floor tiles)"
            value={item.description}
            onChange={(e) => update(i, 'description', e.target.value)}
          />
          <Input
            className="col-span-4 md:col-span-2"
            type="number"
            min="0"
            step="any"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => update(i, 'quantity', Number(e.target.value))}
          />
          <Input
            className="col-span-4 md:col-span-2"
            type="number"
            min="0"
            step="0.01"
            placeholder="Unit price"
            value={item.unit_price}
            onChange={(e) => update(i, 'unit_price', Number(e.target.value))}
          />
          <div className="col-span-3 md:col-span-1 text-right text-sm font-medium">
            {formatCurrency(lineTotal(item), currency)}
          </div>
          <div className="col-span-1 flex justify-end">
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> Add line item
      </Button>
    </div>
  );
}