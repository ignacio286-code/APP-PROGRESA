import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const OAUTH_CONFIGS: Record<string, (clientId: string, state: string) => string> = {
  facebook: (clientId, state) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/facebook`,
      scope: "pages_read_engagement,pages_show_list,instagram_basic,instagram_manage_insights,ads_read,read_insights,business_management",
      state,
      response_type: "code",
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  },
  instagram: (clientId, state) => {
    // Instagram uses Meta OAuth with same app
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/instagram`,
      scope: "instagram_basic,instagram_manage_insights,pages_show_list",
      state,
      response_type: "code",
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  },
  youtube: (clientId, state) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/youtube`,
      scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly",
      state,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
  google_ads: (clientId, state) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/google_ads`,
      scope: "https://www.googleapis.com/auth/adwords",
      state,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  },
  tiktok: (clientId, state) => {
    const params = new URLSearchParams({
      client_key: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/tiktok`,
      scope: "user.info.basic,video.list,business.get",
      state,
      response_type: "code",
    });
    return `https://business-api.tiktok.com/portal/auth?${params}`;
  },
  linkedin: (clientId, state) => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${BASE_URL}/api/analytics/callback/linkedin`,
      scope: "r_organization_social r_ads_reporting r_organization_followers r_basicprofile",
      state,
      response_type: "code",
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  },
};

// Per-platform env var mappings for app credentials
const CLIENT_ID_ENV: Record<string, string> = {
  facebook: "META_APP_ID",
  instagram: "META_APP_ID",
  youtube: "GOOGLE_CLIENT_ID",
  google_ads: "GOOGLE_CLIENT_ID",
  tiktok: "TIKTOK_CLIENT_KEY",
  linkedin: "LINKEDIN_CLIENT_ID",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }

  const builder = OAUTH_CONFIGS[platform];
  if (!builder) {
    return NextResponse.json({ error: "Plataforma no soportada" }, { status: 400 });
  }

  const envKey = CLIENT_ID_ENV[platform];
  const appClientId = process.env[envKey];
  if (!appClientId) {
    return NextResponse.json(
      { error: `Variable de entorno ${envKey} no configurada` },
      { status: 500 }
    );
  }

  // Encode clientId in state for callback
  const state = Buffer.from(JSON.stringify({ clientId, platform })).toString("base64url");
  const oauthUrl = builder(appClientId, state);

  return NextResponse.redirect(oauthUrl);
}
