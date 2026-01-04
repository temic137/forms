import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | AnyForm',
  description: 'Privacy Policy for AnyForm - The AI Form Builder.',
};

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-paper-texture font-paper text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-black">Privacy Policy</h1>
        <p className="mb-8 text-black/60 font-bold">Last updated: {currentDate}</p>

        {/* Privacy Summary Card */}
        <div className="rounded-xl p-6 mb-8 bg-white border border-black/10 shadow-none">
          <div className="flex items-start gap-4">
            <div className="rounded-full p-2 bg-black/5 border border-black/10">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2 text-black">Your Privacy Matters</h2>
              <ul className="text-sm space-y-1 text-black/70 font-bold">
                <li>✓ We never sell your personal data</li>
                <li>✓ You can export or delete your data anytime</li>
                <li>✓ All data is encrypted in transit (HTTPS)</li>
              </ul>
              <Link 
                href="/settings/privacy" 
                className="inline-block mt-3 text-sm font-bold hover:underline text-black"
              >
                Manage your privacy settings →
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-black/80 font-paper">
          <p className="text-lg">
            At AnyForm (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">1. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-black/40">
              <li><strong>Account Information:</strong> Your email address and authentication details when you sign up.</li>
              <li><strong>Form Data:</strong> The content of forms you create, including questions and settings.</li>
              <li><strong>Response Data:</strong> Information collected through the forms you create and share.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service.</li>
              <li><strong>Voice Inputs:</strong> Voice recordings are processed locally in your browser - no audio is sent to our servers, only the transcribed text.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 marker:text-black/40">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your form generation requests using AI technologies</li>
              <li>Store and manage form responses</li>
              <li>Send you technical notices and support messages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">3. Data Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-5 space-y-2 marker:text-black/40">
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate our service (cloud hosting, AI processing).</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid legal requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-black">4. Data Security</h2>
            <p>
              We use HTTPS encryption for all data in transit. We implement reasonable security measures to protect your information, but no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>5. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Account data is kept until you delete your account</li>
              <li>Form submissions are retained until you delete them</li>
              <li>Voice transcriptions are temporary and cleared after form generation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>6. Your Rights</h2>
            <p className="mb-4">You can:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
            </ul>
            <div 
              className="mt-4 p-4 rounded-lg"
              style={{ background: 'var(--accent-light)' }}
            >
              <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
                Manage your data from your account settings:
              </p>
              <Link 
                href="/settings/privacy" 
                className="inline-block px-4 py-2 rounded-lg text-sm font-medium transition"
                style={{ 
                  background: 'var(--accent)',
                  color: '#ffffff'
                }}
              >
                Privacy Settings
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>7. Cookies</h2>
            <p>
              We use essential cookies for authentication and to remember your preferences. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>8. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of changes by updating the &quot;Last updated&quot; date on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a 
                href="mailto:support@anyform.live" 
                className="hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                support@anyform.live
              </a>
            </p>
          </section>
        </div>

        {/* Bottom CTA */}
        <div 
          className="mt-12 rounded-xl p-6 text-center"
          style={{ 
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)'
          }}
        >
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Manage Your Data</h3>
          <p className="mb-4" style={{ color: 'var(--foreground-muted)' }}>
            View, export, or delete your personal data anytime.
          </p>
          <Link 
            href="/settings/privacy" 
            className="inline-block px-6 py-3 rounded-lg font-medium transition"
            style={{ 
              background: 'var(--foreground)',
              color: 'var(--background)'
            }}
          >
            Privacy Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

