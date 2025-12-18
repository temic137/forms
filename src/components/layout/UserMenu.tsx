"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/signin"
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            color: 'var(--foreground)',
            border: '1px solid var(--card-border)',
          }}
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-dark)',
          }}
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-2 rounded-full transition-all"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
        }}
        aria-label={session.user?.name ? `Open menu for ${session.user.name}` : 'Open user menu'}
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user?.name || session.user?.email || 'User avatar'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-medium"
            style={{
              background: 'var(--accent-light)',
              color: 'var(--foreground)',
            }}
          >
            {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="sr-only">
          {session.user?.name || session.user?.email}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--foreground-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 py-2 rounded-lg shadow-lg z-50"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
          }}
        >
          <Link
            href="/dashboard"
            className="block px-4 py-2 transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href="/settings/privacy"
            className="block px-4 py-2 transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => setIsOpen(false)}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy Settings
            </span>
          </Link>
          <div
            className="my-2"
            style={{
              height: '1px',
              background: 'var(--divider)',
            }}
          />
          <button
            onClick={() => {
              setIsOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="w-full text-left px-4 py-2 transition-colors"
            style={{ color: 'var(--foreground)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export { UserMenu };
export default UserMenu;
