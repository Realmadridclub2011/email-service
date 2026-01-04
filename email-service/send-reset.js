import nodemailer from "nodemailer";

export async function handler(event) {
  // ✅ CORS (لو هتستدعي من المتصفح)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" };
  }

  try {
    // ✅ حماية بسيطة: Bearer Token
    const auth = event.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token || token !== process.env.EMAIL_SERVICE_TOKEN) {
      return { statusCode: 401, headers: corsHeaders, body: "Unauthorized" };
    }

    const body = JSON.parse(event.body || "{}");
    const { email, code, appName } = body;

    if (!email || !code) {
      return { statusCode: 400, headers: corsHeaders, body: "Missing email/code" };
    }

    // ✅ SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromName = appName ? String(appName) : "Mohamed Apps";
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject: "Reset your password",
      text: `Your password reset code is: ${code}`,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: `Server error: ${err?.message || "unknown"}`,
    };
  }
}
