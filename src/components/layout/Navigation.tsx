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
  const [showPricingAnimation, setShowPricingAnimation] = useState(false);

  const handlePricingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPricingAnimation(true);
    setTimeout(() => setShowPricingAnimation(false), 2000);
  };

  return (
    <nav
      className={`sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-black/10 font-paper`}
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
                  className="text-base font-bold text-black hover:underline transition-all"
                >
                  Features
                </Link>
                <Link
                  href="#comparison"
                  className="text-base font-bold text-black hover:underline transition-all"
                >
                  Why Switch
                </Link>
                <div className="relative group">
                  <Link
                    href="#"
                    onClick={handlePricingClick}
                    className="text-base font-bold text-black hover:underline transition-all"
                  >
                    Pricing
                  </Link>
                  {showPricingAnimation && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-xs font-bold rounded-full animate-bounce whitespace-nowrap z-50">
                      It's Free! 👻
                    </div>
                  )}
                </div>
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
        <div className="md:hidden border-t border-black/10 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-bold text-black hover:bg-white rounded-full"
            >
              Features
            </Link>
            <Link
              href="#comparison"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-bold text-black hover:bg-white rounded-full"
            >
              Why Switch
            </Link>
            <div className="relative">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPricingAnimation(true);
                  setTimeout(() => {
                    setShowPricingAnimation(false);
                    setIsMobileMenuOpen(false);
                  }, 1500);
                }}
                className="block px-3 py-2 text-base font-bold text-black hover:bg-white rounded-full"
              >
                Pricing
              </Link>
              {showPricingAnimation && (
                <div className="absolute top-2 right-4 px-3 py-1 bg-black text-white text-xs font-bold rounded-full animate-bounce whitespace-nowrap">
                  It's Free! 👻
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
