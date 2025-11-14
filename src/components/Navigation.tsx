"use client";

import UserMenu from "./UserMenu";
import Logo from "./Logo";

export default function Navigation() {
  return (
    <nav
      className="border-b-2 border-black sticky top-0 z-50 backdrop-blur-sm bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Logo />
          </div>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
