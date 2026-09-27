import { ImageResponse } from 'next/og';

// Route segment config — this image is static, generate it once.
export const dynamic = 'force-static';

// Image metadata
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// PatternForge's brand mark: the same amber/orange flame badge used in
// PatternForgeNavigation.tsx (rounded-xl, gradient-to-tr orange-500 -> amber-300,
// border-b-4 border-orange-600/40, white lucide "Flame" glyph).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(to top right, #f97316, #fcd34d)',
          border: '2px solid rgba(194,65,12,0.55)',
          borderBottomWidth: 4,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="white"
          stroke="white"
          strokeWidth="2"
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
