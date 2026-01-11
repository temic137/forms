import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Form Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;

  // Fetch form title from API route (since Prisma doesn't work in Edge Runtime)
  let title = 'Form';
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/forms/${formId}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      title = data.title || 'Form';
    }
  } catch (error) {
    console.error('Failed to fetch form title for OG image:', error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo/Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '60px',
          }}
        >
          {/* Form Icon */}
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            📋
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            AnyForm
          </div>
        </div>

        {/* Form Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.2,
            marginBottom: '40px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Fill out this form
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            fontSize: '24px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✓
          </div>
          Powered by AnyForm
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
