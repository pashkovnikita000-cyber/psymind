import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, User } from 'lucide-react';
import { haptic } from '../lib/telegram';

const navItems = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/catalog', icon: BookOpen, label: 'Тесты' },
  { to: '/profile', icon: User, label: 'Профиль' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{
        backgroundColor: 'var(--tg-theme-secondary-bg-color)',
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center py-2 gap-1 transition-colors ${
              isActive ? 'text-primary-500' : ''
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? 'var(--psymind-accent)' : 'var(--tg-theme-hint-color)',
          })}
          onClick={() => haptic.light()}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};
