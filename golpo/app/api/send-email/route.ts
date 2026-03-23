import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  const { email, name, imageDataUrl } = (await request.json()) as {
    email: string;
    name: string;
    imageDataUrl: string;
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");

  try {
    await transporter.sendMail({
      from: `"Golpo" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your Golpo postcard — ${name}`,
      html: `<p>Hi ${name},</p><p>Your Golpo postcard is attached.</p>`,
      attachments: [
        {
          filename: "golpo-postcard.png",
          content: Buffer.from(base64Data, "base64"),
          contentType: "image/png",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
