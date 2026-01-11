import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const alt = 'Form Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;

  // Fetch form title directly from DB
  let title = 'Form';
  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { title: true }
    });
    if (form?.title) {
      title = form.title;
    }
  } catch (error) {
    console.error('Failed to fetch form title for OG image:', error);
  }

  // Load Patrick Hand font from the file system
  // We need to resolve the path relative to the process working directory in production
  const fontPath = path.join(process.cwd(), 'src/assets/fonts/PatrickHand-Regular.ttf');
  const fontData = fs.readFileSync(fontPath);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Subtle dot grid background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: 0.5,
          }}
        />

        {/* Main Card with border */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: '3px solid #000000',
            borderRadius: '24px',
            padding: '60px',
            width: '100%',
            maxWidth: '1000px',
            height: '85%',
            position: 'relative',
            boxShadow: '0 0 0 rgba(0,0,0,0)',
          }}
        >
          {/* Logo in top-left */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* AnyForm Logo SVG */}
            <svg
              viewBox="0 0 40 40"
              width="48"
              height="48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="6"
                width="28"
                height="30"
                rx="3"
                fill="black"
                stroke="black"
                strokeWidth="2"
              />
              <path
                d="M28 6 L32 10 L28 10 Z"
                fill="white"
                stroke="black"
                strokeWidth="1"
              />
              <line
                x1="10"
                y1="14"
                x2="26"
                y2="14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="20"
                x2="26"
                y2="20"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="26"
                x2="22"
                y2="26"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <rect
                x="10"
                y="30"
                width="6"
                height="6"
                rx="1"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M12 32.5 L13.5 34 L16 31.5"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 400,
                color: '#000000',
                fontFamily: '"Patrick Hand"',
                letterSpacing: '-0.02em',
              }}
            >
              AnyForm
            </div>
          </div>

          {/* Form Title - centered */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 400,
                color: '#000000',
                lineHeight: 1.1,
                fontFamily: '"Patrick Hand"',
                marginBottom: '30px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </div>

            {/* CTA Button */}
            <div
              style={{
                fontSize: '24px',
                fontWeight: 400,
                background: '#000000',
                color: '#ffffff',
                padding: '16px 48px',
                borderRadius: '9999px',
                fontFamily: '"Patrick Hand"',
              }}
            >
              Fill out this form
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '35px',
              fontSize: '18px',
              color: 'rgba(0, 0, 0, 0.4)',
              fontFamily: '"Patrick Hand"',
              fontWeight: 400,
            }}
          >
            Powered by AnyForm
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Patrick Hand',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
