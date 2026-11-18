'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores/ui-store';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/workspaces', label: 'Workspaces' },
  { href: '#boards', label: 'Boards', disabled: true },
  { href: '#tasks', label: 'Tasks', disabled: true },
  { href: '#settings', label: 'Settings', disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] transition-all duration-200 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
          SB
        </div>
        {sidebarOpen && (
          <div>
            <p className="text-sm font-semibold text-white">SyncBoard</p>
            <p className="text-xs text-slate-400">Collaborative workspace</p>
          </div>
        )}
      </div>

      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(`${item.href}/`));
          const className = `flex items-center rounded-lg px-3 py-2 text-sm transition ${
            item.disabled
              ? 'cursor-not-allowed text-slate-500'
              : isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`;

          if (item.disabled) {
            return (
              <span key={item.label} className={className} title="Coming in a later milestone">
                {sidebarOpen ? item.label : item.label[0]}
              </span>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {sidebarOpen ? item.label : item.label[0]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}