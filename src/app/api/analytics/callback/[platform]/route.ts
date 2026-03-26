import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function exchangeFacebookToken(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Exchange for long-lived token
  const llParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: data.access_token,
  });
  const llRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?${llParams}`);
  const llData = await llRes.json();
  return llData.access_token || data.access_token;
}

async function exchangeGoogleToken(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

async function exchangeTikTokToken(code: string) {
  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_CLIENT_KEY,
      secret: process.env.TIKTOK_CLIENT_SECRET,
      auth_code: code,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message || "Error TikTok OAuth");
  return data.data;
}

async function exchangeLinkedInToken(code: string, redirectUri: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

async function getFacebookAccountInfo(accessToken: string) {
  const res = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`);
  const data = await res.json();
  return { accountId: data.id, accountName: data.name || "Cuenta Facebook" };
}

async function getGoogleAccountInfo(accessToken: string) {
  const res = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
  const data = await res.json();
  return { accountId: data.id, accountName: data.name || data.email || "Cuenta Google" };
}

async function getLinkedInAccountInfo(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return {
    accountId: data.id,
    accountName: `${data.localizedFirstName || ""} ${data.localizedLastName || ""}`.trim() || "Cuenta LinkedIn",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${BASE_URL}/analytics?error=${encodeURIComponent(error)}`);
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(`${BASE_URL}/analytics?error=missing_params`);
  }

  let state: { clientId: string; platform: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
  } catch {
    return NextResponse.redirect(`${BASE_URL}/analytics?error=invalid_state`);
  }

  try {
    let accessToken = "";
    let refreshToken: string | undefined;
    let tokenExpiry: Date | undefined;
    let accountId = "";
    let accountName = "";

    const redirectUri = `${BASE_URL}/api/analytics/callback/${platform}`;

    if (platform === "facebook" || platform === "instagram") {
      accessToken = await exchangeFacebookToken(code, redirectUri);
      const info = await getFacebookAccountInfo(accessToken);
      accountId = info.accountId;
      accountName = info.accountName;
      tokenExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // ~60 days
    } else if (platform === "youtube" || platform === "google_ads") {
      const tokenData = await exchangeGoogleToken(code, redirectUri);
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
      const info = await getGoogleAccountInfo(accessToken);
      accountId = info.accountId;
      accountName = info.accountName;
    } else if (platform === "tiktok") {
      const tokenData = await exchangeTikTokToken(code);
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
      accountId = tokenData.advertiser_id || tokenData.open_id || "tiktok";
      accountName = tokenData.advertiser_name || "Cuenta TikTok";
    } else if (platform === "linkedin") {
      const tokenData = await exchangeLinkedInToken(code, redirectUri);
      accessToken = tokenData.access_token;
      tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
      const info = await getLinkedInAccountInfo(accessToken);
      accountId = info.accountId;
      accountName = info.accountName;
    }

    // Upsert connection
    await prisma.socialConnection.upsert({
      where: {
        clientId_platform_accountId: {
          clientId: state.clientId,
          platform,
          accountId,
        },
      },
      update: {
        accessToken,
        refreshToken,
        tokenExpiry,
        accountName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        clientId: state.clientId,
        platform,
        accountId,
        accountName,
        accessToken,
        refreshToken,
        tokenExpiry,
        isActive: true,
      },
    });

    return NextResponse.redirect(`${BASE_URL}/analytics?connected=${platform}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.redirect(`${BASE_URL}/analytics?error=${encodeURIComponent(msg)}`);
  }
}
