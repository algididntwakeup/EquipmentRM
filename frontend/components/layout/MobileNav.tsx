'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/equipment', label: 'Equipment', icon: 'inventory_2' },
  { href: '/equipment/add', label: 'Tambah', icon: 'add_circle' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi seluler"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-4 py-2 bg-surface-container shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.16)] border-t border-outline-variant"
    >
      {navigation.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : item.href === '/equipment'
              ? pathname === '/equipment' || /^\/equipment\/[^/]+$/.test(pathname)
              : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`min-w-20 flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-colors ${
              isActive ? 'bg-primary-container text-white' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined mb-0.5" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
