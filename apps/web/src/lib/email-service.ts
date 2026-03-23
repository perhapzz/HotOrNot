import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log("[Email] SMTP not configured — skipping email");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return false;
  }
}

// ==================== Email Templates ====================

const WRAPPER = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px;text-align:center">
      <h1 style="margin:0;color:white;font-size:24px">🔥 HotOrNot</h1>
    </div>
    <div style="padding:32px 24px">${content}</div>
    <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af">
      HotOrNot — 智能内容分析平台
    </div>
  </div>
</body>
</html>`;

export function hotlistAlertEmail(keyword: string, platform: string, rank: number): EmailOptions {
  return {
    to: "",
    subject: `🔥 「${keyword}」上热榜了！`,
    html: WRAPPER(`
      <h2 style="margin:0 0 16px;color:#111827">关键词上榜提醒</h2>
      <p style="color:#4b5563;line-height:1.6">
        你关注的关键词 <strong style="color:#2563eb">${keyword}</strong>
        已上 <strong>${platform}</strong> 热榜，当前排名 <strong>#${rank}</strong>。
      </p>
      <p style="color:#4b5563">抓住热点，立即分析！</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}/analysis/keywords"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
        查看分析 →
      </a>
    `),
  };
}

export function analysisCompleteEmail(
  type: string,
  title: string,
  score: number,
  analysisId: string
): EmailOptions {
  const scoreColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return {
    to: "",
    subject: `📊 分析完成 — ${title}`,
    html: WRAPPER(`
      <h2 style="margin:0 0 16px;color:#111827">分析结果已生成</h2>
      <p style="color:#4b5563;line-height:1.6">
        你的${type === "content" ? "内容" : type === "keyword" ? "关键词" : "账号"}分析已完成：
      </p>
      <div style="text-align:center;padding:24px;background:#f9fafb;border-radius:8px;margin:16px 0">
        <p style="margin:0;color:#6b7280;font-size:14px">${title}</p>
        <p style="margin:8px 0 0;font-size:48px;font-weight:bold;color:${scoreColor}">${score}</p>
        <p style="margin:4px 0 0;color:#9ca3af;font-size:12px">/ 100</p>
      </div>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app"}/share/${type}/${analysisId}"
         style="display:inline-block;margin-top:8px;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
        查看详情 →
      </a>
    `),
  };
}

export function teamInviteEmail(teamName: string, inviterName: string, inviteLink: string): EmailOptions {
  return {
    to: "",
    subject: `📨 邀请你加入团队「${teamName}」`,
    html: WRAPPER(`
      <h2 style="margin:0 0 16px;color:#111827">团队邀请</h2>
      <p style="color:#4b5563;line-height:1.6">
        <strong>${inviterName}</strong> 邀请你加入团队 <strong style="color:#2563eb">${teamName}</strong>。
      </p>
      <p style="color:#4b5563">加入团队后，你可以查看共享的分析结果和数据。</p>
      <a href="${inviteLink}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600">
        接受邀请 →
      </a>
    `),
  };
}
