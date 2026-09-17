import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, createAdminToken } from '@/lib/auth';

// In-memory rate limiting for brute-force protection
const loginAttempts: Map<string, { count: number; blockedUntil: number }> = new Map();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };

  // Check if IP is temporarily blocked (after 5 failed attempts, blocked for 3 minutes)
  if (attempt.blockedUntil > now) {
    const remainingSecs = Math.ceil((attempt.blockedUntil - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan gagal. Silakan tunggu ${remainingSecs} detik lagi.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { password } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!password || password !== expectedPassword) {
      // Record failed attempt
      const newCount = attempt.count + 1;
      const blockedUntil = newCount >= 5 ? now + 3 * 60 * 1000 : 0;
      loginAttempts.set(ip, { count: newCount, blockedUntil });

      // Artificial delay (400ms) to thwart rapid automated timing attacks
      await new Promise((r) => setTimeout(r, 400));

      return NextResponse.json(
        {
          success: false,
          error:
            newCount >= 5
              ? 'Terlalu banyak percobaan gagal. Akun terkunci selama 3 menit.'
              : `Password Admin salah. Sisa kesempatan: ${5 - newCount}x.`,
        },
        { status: 401 }
      );
    }

    // Success: Reset rate limit attempts
    loginAttempts.delete(ip);

    // Create secure token (valid 72 hours)
    const token = await createAdminToken(72);

    const response = NextResponse.json({
      success: true,
      message: 'Login Admin berhasil',
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 72 * 3600, // 3 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
