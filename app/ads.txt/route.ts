import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = `# Google AdSense ads.txt Specification
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
