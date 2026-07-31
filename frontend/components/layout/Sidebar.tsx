'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/equipment', label: 'Equipment', icon: 'inventory_2' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 p-4 h-full w-64 rounded-r-xl bg-surface shadow-md border-r border-outline-variant">
      <Link href="/" className="flex items-center gap-2 mb-8 px-4" aria-label="Reksolindo Dashboard">
        <span className="material-symbols-outlined text-primary text-3xl" aria-hidden="true">
          precision_manufacturing
        </span>
        <div>
          <div className="text-xl font-bold text-primary leading-tight">Reksolindo</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
            Asset Reliability
          </div>
        </div>
      </Link>

      <nav aria-label="Navigasi utama">
        <ul className="flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-full px-4 py-2.5 flex items-center gap-3 w-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-container text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto rounded-xl bg-primary-fixed p-4 text-primary">
        <p className="text-xs font-bold">Equipment Inventory</p>
        <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">
          Pencatatan dan pemantauan inspeksi aset industri.
        </p>
      </div>
    </aside>
  );
}
