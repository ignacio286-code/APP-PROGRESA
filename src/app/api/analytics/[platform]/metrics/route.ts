import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Facebook metrics ───────────────────────────────────────────────────────────
async function fetchFacebookMetrics(token: string, accountId: string, since: string, until: string) {
  const fields = "fan_count,followers_count,name,about,category";
  const pageRes = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}?fields=${fields}&access_token=${token}`
  );
  const pageData = await pageRes.json();

  const insightMetrics = "page_impressions,page_reach,page_engaged_users,page_post_engagements,page_fan_adds,page_views_total";
  const insightRes = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/insights?metric=${insightMetrics}&period=day&since=${since}&until=${until}&access_token=${token}`
  );
  const insightData = await insightRes.json();

  // Posts
  const postsRes = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/posts?fields=id,message,created_time,full_picture,likes.summary(true),comments.summary(true),shares&limit=10&access_token=${token}`
  );
  const postsData = await postsRes.json();

  return {
    platform: "facebook",
    account: { id: accountId, name: pageData.name, category: pageData.category },
    summary: {
      followers: pageData.followers_count || pageData.fan_count || 0,
      fans: pageData.fan_count || 0,
    },
    insights: insightData.data || [],
    posts: postsData.data || [],
  };
}

// ── Instagram metrics ──────────────────────────────────────────────────────────
async function fetchInstagramMetrics(token: string, pageId: string, since: string, until: string) {
  // Get IG business account linked to FB page
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${token}`
  );
  const igData = await igRes.json();
  const igId = igData.instagram_business_account?.id;
  if (!igId) throw new Error("No hay cuenta de Instagram Business vinculada a esta página");

  const profileRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}?fields=id,name,username,followers_count,media_count,profile_picture_url,biography&access_token=${token}`
  );
  const profile = await profileRes.json();

  const insightMetrics = "impressions,reach,profile_views,follower_count,accounts_engaged";
  const insightRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}/insights?metric=${insightMetrics}&period=day&since=${since}&until=${until}&access_token=${token}`
  );
  const insights = await insightRes.json();

  const mediaRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}/media?fields=id,caption,media_type,timestamp,thumbnail_url,media_url,like_count,comments_count,reach,impressions&limit=12&access_token=${token}`
  );
  const media = await mediaRes.json();

  return {
    platform: "instagram",
    account: { id: igId, name: profile.name, username: profile.username, profilePicture: profile.profile_picture_url },
    summary: {
      followers: profile.followers_count || 0,
      mediaCount: profile.media_count || 0,
    },
    insights: insights.data || [],
    media: media.data || [],
  };
}

// ── YouTube metrics ────────────────────────────────────────────────────────────
async function fetchYouTubeMetrics(token: string, since: string, until: string) {
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${token}`
  );
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];
  if (!channel) throw new Error("No se encontró canal de YouTube");

  const analyticsRes = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3D${channel.id}&startDate=${since}&endDate=${until}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments&dimensions=day&sort=day&access_token=${token}`
  );
  const analytics = await analyticsRes.json();

  const videosRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&order=date&maxResults=10&type=video&access_token=${token}`
  );
  const videos = await videosRes.json();

  return {
    platform: "youtube",
    account: { id: channel.id, name: channel.snippet?.title, thumbnail: channel.snippet?.thumbnails?.default?.url },
    summary: {
      subscribers: parseInt(channel.statistics?.subscriberCount || "0"),
      views: parseInt(channel.statistics?.viewCount || "0"),
      videoCount: parseInt(channel.statistics?.videoCount || "0"),
    },
    analytics: analytics.rows || [],
    analyticsHeaders: analytics.columnHeaders || [],
    videos: videos.items || [],
  };
}

// ── TikTok metrics ─────────────────────────────────────────────────────────────
async function fetchTikTokMetrics(token: string, advertiserId: string, since: string, until: string) {
  const accountRes = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/user/info/?access_token=${token}`
  );
  const accountData = await accountRes.json();

  const metricsRes = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?advertiser_id=${advertiserId}&report_type=BASIC&dimensions=["stat_time_day"]&metrics=["spend","impressions","clicks","ctr","cpc","conversions"]&start_date=${since}&end_date=${until}&page_size=30&access_token=${token}`
  );
  const metricsData = await metricsRes.json();

  return {
    platform: "tiktok",
    account: { id: advertiserId, name: accountData.data?.display_name || "Cuenta TikTok" },
    summary: { followers: accountData.data?.follower_count || 0 },
    metrics: metricsData.data?.list || [],
  };
}

// ── LinkedIn metrics ───────────────────────────────────────────────────────────
async function fetchLinkedInMetrics(token: string, organizationId: string, since: string, until: string) {
  const orgRes = await fetch(
    `https://api.linkedin.com/v2/organizations/${organizationId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const org = await orgRes.json();

  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();

  const statsRes = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${sinceMs}&timeIntervals.timeRange.end=${untilMs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const stats = await statsRes.json();

  const followersRes = await fetch(
    `https://api.linkedin.com/v2/organizationFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const followers = await followersRes.json();

  return {
    platform: "linkedin",
    account: { id: organizationId, name: org.localizedName || "Empresa LinkedIn" },
    summary: {
      followers: followers.elements?.[0]?.followerCounts?.organicFollowerCount || 0,
    },
    stats: stats.elements || [],
  };
}

// ── Google Ads metrics ─────────────────────────────────────────────────────────
async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function fetchGoogleAdsMetrics(token: string, customerId: string, since: string, until: string) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
    ORDER BY metrics.impressions DESC
    LIMIT 20
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  return {
    platform: "google_ads",
    account: { id: customerId, name: `Google Ads ${customerId}` },
    campaigns: data.results || [],
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const to = searchParams.get("to") || new Date().toISOString().split("T")[0];

  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }

  const connections = await prisma.socialConnection.findMany({
    where: { clientId, platform, isActive: true },
  });

  if (connections.length === 0) {
    return NextResponse.json({ error: "No hay conexión activa para esta plataforma", connected: false }, { status: 404 });
  }

  const results = [];

  for (const conn of connections) {
    try {
      let token = conn.accessToken;

      // Refresh Google tokens if needed
      if ((platform === "youtube" || platform === "google_ads") && conn.refreshToken) {
        if (!conn.tokenExpiry || conn.tokenExpiry < new Date()) {
          token = await refreshGoogleToken(conn.refreshToken);
          await prisma.socialConnection.update({
            where: { id: conn.id },
            data: { accessToken: token, tokenExpiry: new Date(Date.now() + 3600 * 1000) },
          });
        }
      }

      let metrics;
      if (platform === "facebook") {
        metrics = await fetchFacebookMetrics(token, conn.accountId, from, to);
      } else if (platform === "instagram") {
        metrics = await fetchInstagramMetrics(token, conn.accountId, from, to);
      } else if (platform === "youtube") {
        metrics = await fetchYouTubeMetrics(token, from, to);
      } else if (platform === "tiktok") {
        metrics = await fetchTikTokMetrics(token, conn.accountId, from, to);
      } else if (platform === "linkedin") {
        metrics = await fetchLinkedInMetrics(token, conn.accountId, from, to);
      } else if (platform === "google_ads") {
        metrics = await fetchGoogleAdsMetrics(token, conn.accountId, from, to);
      } else {
        metrics = { error: "Plataforma no implementada" };
      }

      results.push({ connectionId: conn.id, accountName: conn.accountName, ...metrics });
    } catch (err) {
      results.push({
        connectionId: conn.id,
        accountName: conn.accountName,
        error: err instanceof Error ? err.message : "Error al obtener métricas",
      });
    }
  }

  return NextResponse.json({ platform, dateRange: { from, to }, results });
}
