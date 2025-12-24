"use client";

import { useState } from "react";
import UserMenu from "./UserMenu";
import FeedbackButton from "@/components/FeedbackButton";
import Logo from "./Logo";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-sm bg-white/95 transition-all`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Logo />

            {/* Desktop Navigation Links */}
            {isLandingPage && (
              <div className="hidden md:flex items-center gap-8">
                <Link
                  href="#features"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#comparison"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Why Switch
                </Link>
                <Link
                  href="#"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <FeedbackButton />
            <UserMenu />

            {/* Mobile Menu Button */}
            {isLandingPage && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 rounded-md"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isLandingPage && isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Features
            </Link>
            <Link
              href="#comparison"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Why Switch
            </Link>
            <Link
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              Pricing
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
