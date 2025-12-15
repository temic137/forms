import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AnyForm',
  description: 'Privacy Policy for AnyForm - The AI Form Builder',
};

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: {currentDate}</p>

        <div className="prose prose-blue max-w-none text-gray-600">
          <p>
            At AnyForm ("we", "us", or "our"), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Account Information:</strong> When you sign up, we collect your email address and authentication details.</li>
            <li><strong>Form Data:</strong> The content of the forms you create, including questions, options, and logic.</li>
            <li><strong>Response Data:</strong> Information collected through the forms you create and share.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our service, such as features used and time spent.</li>
            <li><strong>Voice and File Inputs:</strong> Voice recordings (transcribed immediately) and files you upload to generate forms.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process your form generation requests using AI technologies.</li>
            <li>Store and manage the responses to your forms.</li>
            <li>Send you technical notices, updates, and support messages.</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our service.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Service Providers:</strong> With third-party vendors who help us operate our business (e.g., cloud hosting, AI processing).</li>
            <li><strong>Legal Requirements:</strong> If required to do so by law or in response to valid requests by public authorities.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, sale of assets, or acquisition of our business.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p>Depending on your location, you may have rights regarding your personal information, including:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>Accessing, correcting, or deleting your personal data.</li>
            <li>Objecting to or restricting processing of your data.</li>
            <li>Data portability.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Links</h2>
          <p>
            Our service may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@anyform.live.
          </p>
        </div>
      </div>
    </div>
  );
}

