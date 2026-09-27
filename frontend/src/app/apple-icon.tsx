import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Same PatternForge flame badge as icon.tsx, scaled up for iOS home-screen /
// bookmark bar use (Apple recommends 180x180).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(to top right, #f97316, #fcd34d)',
          border: '8px solid rgba(194,65,12,0.55)',
          borderBottomWidth: 16,
        }}
      >
        <svg
          width="104"
          height="104"
          viewBox="0 0 24 24"
          fill="white"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
