import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  FileText,
  Home
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'New Quote', path: '/quotes/new', icon: FilePlus2 },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Settings', path: '/settings', icon: SettingsIcon }
];

const tabItems = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Settings', path: '/settings', icon: SettingsIcon }
];

function tabForPath(p) {
  if (p.startsWith('/customers')) return '/customers';
  if (p.startsWith('/settings')) return '/settings';
  return '/';
}

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

function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const stacks = useRef({
    '/': ['/'],
    '/customers': ['/customers'],
    '/settings': ['/settings']
  });

  useEffect(() => {
    const tab = tabForPath(location.pathname);
    const stack = stacks.current[tab];
    if (location.pathname === tab) {
      stacks.current[tab] = [tab];
    } else if (stack[stack.length - 1] !== location.pathname) {
      stack.push(location.pathname);
    }
  }, [location.pathname]);

  const handleTab = (tabRoot) => {
    const currentTab = tabForPath(location.pathname);
    if (tabRoot === currentTab) {
      // Clicking the active tab returns it to its root
      navigate(tabRoot);
    } else {
      // Switching tabs restores the last page viewed in that tab's stack
      const stack = stacks.current[tabRoot];
      navigate(stack[stack.length - 1] || tabRoot);
    }
  };

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {tabItems.map((item) => {
          const active = tabForPath(location.pathname) === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleTab(item.path)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AnimatedOutlet() {
  const location = useLocation();
  const isMobile = useIsMobile();
  if (!isMobile) return <Outlet />;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState('QuoteMaker');

  const hideTopBar = location.pathname.startsWith('/quotes/');

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
      {/* Desktop sidebar */}
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

      {/* Mobile top bar — hidden on quote sub-pages to avoid redundant nav */}
      {!hideTopBar && (
        <div
          className="md:hidden flex items-center justify-between border-b px-4 sticky top-0 bg-background z-40"
          style={{ paddingTop: 'var(--safe-top)', height: 'calc(3.5rem + var(--safe-top))' }}
        >
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
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 md:px-10 py-6 md:py-12 pb-24 md:pb-12 overflow-hidden">
          <AnimatedOutlet />
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}