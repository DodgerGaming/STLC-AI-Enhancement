import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Store, Layers, ClipboardList, LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../assets/Logo.png'

const NAV_ITEMS_ADMIN = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/sales', label: 'Sales Entry', icon: Store },
  { to: '/manage-leather', label: 'Manage Leather', icon: Layers },
  { to: '/audit-trail', label: 'Audit Trail', icon: ClipboardList },
]

const NAV_ITEMS_CLERK = [
  { to: '/sales', label: 'Sales Entry', icon: Store },
]

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth()
  const userEmail = localStorage.getItem('userEmail') || 'User'
  const userRole = localStorage.getItem('userRole') || 'Clerk'
  const userInitials = userEmail
    .split('@')[0]
    .split('')
    .slice(0, 2)
    .map((c) => c.toUpperCase())
    .join('')

  const handleLogout = () => {
    logout()
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex h-screen w-[260px] flex-col border-r border-outline-variant bg-surface transition-transform duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex items-center justify-between px-6 pb-5 pt-7">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Cutwise IMS Logo" className="h-8 w-8" />
            <p className="text-lg font-extrabold leading-tight text-primary-dark">Cutwise IMS</p>
          </div>
          <p className="text-xs font-medium text-on-surface-variant">Sales and Cutting Leather</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="lg:hidden rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-variant"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="mt-2 flex-1 px-3">
        <ul className="space-y-1">
          {(userRole === 'Admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_CLERK).map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-primary bg-primary/[0.08] text-primary'
                      : 'border-transparent text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
                  ].join(' ')
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="m-3 mb-5 rounded-xl border border-outline-variant bg-surface-variant/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-surface">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-surface">{userEmail.split('@')[0]}</p>
            <p className="truncate text-xs text-on-surface-variant">{userRole}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface hover:text-error"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
