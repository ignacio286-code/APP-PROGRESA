import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const ENV_PATH = join(process.cwd(), ".env");

async function readEnv(): Promise<Record<string, string>> {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
      }
    }
    return vars;
  } catch {
    return {};
  }
}

async function writeEnv(vars: Record<string, string>) {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  await writeFile(ENV_PATH, lines.join("\n") + "\n", "utf-8");
}

export async function GET() {
  const vars = await readEnv();
  // Return masked keys for security
  return NextResponse.json({
    ANTHROPIC_API_KEY: vars.ANTHROPIC_API_KEY
      ? "sk-ant-......" + vars.ANTHROPIC_API_KEY.slice(-6)
      : "",
    MONDAY_API_TOKEN: vars.MONDAY_API_TOKEN
      ? "......" + vars.MONDAY_API_TOKEN.slice(-6)
      : "",
    RESEND_API_KEY: vars.RESEND_API_KEY
      ? "re_......" + vars.RESEND_API_KEY.slice(-6)
      : "",
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const vars = await readEnv();

  // Only update keys that are provided and not masked
  if (body.ANTHROPIC_API_KEY && !body.ANTHROPIC_API_KEY.includes("......")) {
    vars.ANTHROPIC_API_KEY = body.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = body.ANTHROPIC_API_KEY;
  }
  if (body.MONDAY_API_TOKEN && !body.MONDAY_API_TOKEN.includes("......")) {
    vars.MONDAY_API_TOKEN = body.MONDAY_API_TOKEN;
    process.env.MONDAY_API_TOKEN = body.MONDAY_API_TOKEN;
  }
  if (body.RESEND_API_KEY && !body.RESEND_API_KEY.includes("......")) {
    vars.RESEND_API_KEY = body.RESEND_API_KEY;
    process.env.RESEND_API_KEY = body.RESEND_API_KEY;
  }

  await writeEnv(vars);

  return NextResponse.json({ ok: true });
}
