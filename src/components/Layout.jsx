import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  FileText
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'New Quote', path: '/quotes/new', icon: FilePlus2 },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Settings', path: '/settings', icon: SettingsIcon }
];

function NavLinks({ onNavigate }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState('QuoteMaker');

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.BusinessProfile.list();
        if (list && list.length && list[0].company_name) setBrand(list[0].company_name);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleLogout = () => base44.auth.logout();

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r bg-sidebar p-5">
        <Link to="/" className="flex items-center gap-2.5 px-1 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg tracking-tight">{brand}</span>
        </Link>
        <NavLinks />
        <div className="mt-auto pt-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-3" /> Logout
          </Button>
        </div>
      </aside>

      <div className="md:hidden flex items-center justify-between border-b px-4 h-14 sticky top-0 bg-background z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-5 flex flex-col">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg">{brand}</span>
            </Link>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-3" /> Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-display text-lg">{brand}</span>
        <Link to="/quotes/new">
          <Button size="sm">New Quote</Button>
        </Link>
      </div>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 md:px-10 py-6 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}