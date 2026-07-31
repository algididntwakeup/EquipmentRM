import { ReactNode } from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';

interface AppShellProps {
  title: string;
  description: string;
  children: ReactNode;
  maxWidth?: '3xl' | '7xl';
}

export default function AppShell({
  title,
  description,
  children,
  maxWidth = '7xl',
}: AppShellProps) {
  const widthClass = maxWidth === '3xl' ? 'max-w-3xl' : 'max-w-7xl';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />
      <Header title={title} description={description} />
      <main className={`p-4 md:p-6 ${widthClass} w-full mx-auto flex-1`}>{children}</main>
      <MobileNav />
    </div>
  );
}
