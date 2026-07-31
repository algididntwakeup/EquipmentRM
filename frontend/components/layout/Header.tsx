interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center w-full border-b border-outline-variant bg-surface px-4 py-3 md:border-b-0 md:bg-gray-50 md:py-6">
      <div className="md:hidden" aria-hidden="true">
        <span className="material-symbols-outlined text-primary text-3xl">
          precision_manufacturing
        </span>
      </div>
      <div className="ml-3 md:ml-0">
        <h1 className="text-lg md:text-2xl font-bold text-on-surface">{title}</h1>
        <p className="hidden sm:block text-xs text-on-surface-variant mt-1">{description}</p>
      </div>
    </header>
  );
}
