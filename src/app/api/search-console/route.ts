import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { readFile } from "fs/promises";

async function getAuth() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) throw new Error("GOOGLE_SERVICE_ACCOUNT_PATH not set");
  const keyFile = JSON.parse(await readFile(keyPath, "utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: ["https://www.googleapis.com/auth/webmasters"],
  });
  return auth;
}

// GET: fetch search analytics data or submit sitemap
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "analytics";
  const siteUrl = searchParams.get("site") || "https://agencia-de-marketing.cl";

  try {
    const auth = await getAuth();
    const webmasters = google.searchconsole({ version: "v1", auth });

    if (action === "submit-sitemap") {
      const sitemapUrl = searchParams.get("sitemap") || `${siteUrl}/sitemap.xml`;
      await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });
      return NextResponse.json({ ok: true, submitted: sitemapUrl });
    }

    if (action === "sitemaps") {
      const res = await webmasters.sitemaps.list({ siteUrl });
      return NextResponse.json(res.data);
    }

    if (action === "inspect") {
      const inspectUrl = searchParams.get("url") || siteUrl;
      const res = await webmasters.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: inspectUrl,
          siteUrl,
        },
      });
      return NextResponse.json(res.data);
    }

    // Default: search analytics
    const days = parseInt(searchParams.get("days") || "28");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);

    const dimension = searchParams.get("dimension") || "query";

    const res = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        dimensions: [dimension],
        rowLimit: 50,
      },
    });

    return NextResponse.json({
      rows: res.data.rows || [],
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: submit URLs for indexing
export async function POST(req: NextRequest) {
  try {
    const { urls, sitemap } = await req.json();
    const auth = await getAuth();
    const webmasters = google.searchconsole({ version: "v1", auth });
    const siteUrl = "https://agencia-de-marketing.cl";

    const results = [];

    // Submit sitemap
    if (sitemap) {
      await webmasters.sitemaps.submit({ siteUrl, feedpath: sitemap });
      results.push({ type: "sitemap", url: sitemap, status: "submitted" });
    }

    // Request indexing for each URL
    if (urls && Array.isArray(urls)) {
      for (const url of urls) {
        try {
          const res = await webmasters.urlInspection.index.inspect({
            requestBody: { inspectionUrl: url, siteUrl },
          });
          results.push({ type: "url", url, status: res.data.inspectionResult?.indexStatusResult?.coverageState || "inspected" });
        } catch (e) {
          results.push({ type: "url", url, status: "error", error: (e as Error).message });
        }
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
