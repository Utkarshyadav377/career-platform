import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/resume', label: 'Resume' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/interview', label: 'AI Interview' },
  { to: '/career', label: 'Career' },
  { to: '/profile', label: 'Profile' },
];

export default function Sidebar() {
  return (
    <nav className="sticky top-6 flex h-fit w-44 shrink-0 flex-col gap-1 self-start max-md:hidden">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
