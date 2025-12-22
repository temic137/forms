"use client";

import UserMenu from "./UserMenu";
import FeedbackButton from "@/components/FeedbackButton";
import Logo from "./Logo";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-sm bg-white/95 transition-all`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Logo />

            {/* Landing Page Navigation Links */}
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
            {/* Show Sign In/Get Started if on landing page and not signed in (UserMenu handles signed in state internally, but we might want explicit buttons if UserMenu returns null or something, but UserMenu handles both states well actually. Let's rely on UserMenu or custom logic? UserMenu shows Sign In/Sign Up if not session. Let's just use UserMenu but maybe style it differently? UserMenu currently renders Sign In / Sign Up buttons if no session. Perfect.) */}
            <FeedbackButton />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
