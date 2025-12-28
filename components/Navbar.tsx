
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MenuIcon, XIcon, BookOpenIcon } from './icons';

const NavItem: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        isActive
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`
    }
  >
    {children}
  </NavLink>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="bg-gray-950/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
                <BookOpenIcon className="h-8 w-8 text-primary-500" />
                <span className="font-black text-xl tracking-tighter">STUDY<span className="text-primary-500">AI</span></span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavItem to="/">Home</NavItem>
                <NavItem to="/quiz">Quiz</NavItem>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/settings">Settings</NavItem>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? <MenuIcon className="block h-6 w-6" /> : <XIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavItem to="/" onClick={closeMenu}>Home</NavItem>
            <NavItem to="/quiz" onClick={closeMenu}>Quiz</NavItem>
            <NavItem to="/dashboard" onClick={closeMenu}>Dashboard</NavItem>
            <NavItem to="/settings" onClick={closeMenu}>Settings</NavItem>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
