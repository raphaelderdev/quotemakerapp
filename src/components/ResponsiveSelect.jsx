import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function ResponsiveSelect({ value, onValueChange, options, placeholder, className, id }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn(!selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder || 'Select'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{placeholder || 'Select an option'}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto pb-[max(var(--safe-bottom),1rem)]">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onValueChange(o.value);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 text-left text-sm border-b last:border-0',
                o.value === value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
              )}
            >
              {o.label}
              {o.value === value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}