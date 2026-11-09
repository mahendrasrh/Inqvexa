import { NextResponse } from 'next/server';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { COUNTRIES } from '@/lib/countries';
import { validateContact, type ContactInput } from '@/lib/contact';

export const runtime = 'nodejs';

const DIALS = new Set(COUNTRIES.map((c) => c[1]));
const TO = process.env.CONTACT_TO_EMAIL || 'karthik.bm@inqvexa.com';

// Very small in-memory rate limit (per server instance). Use WAF / API Gateway throttling for stronger protection.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(req: Request) {
  let data: ContactInput;
  try { data = (await req.json()) as ContactInput; } catch { return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 }); }

  if (data._honey) return NextResponse.json({ ok: true }); // silently accept bots

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });

  const errors = validateContact(data, DIALS);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const rows: [string, string][] = [
    ['Name', data.name],
    ['Company', data.company || '—'],
    ['Email', data.email],
    ['Role', data.role || '—'],
    ['Phone', data.phone ? `${data.countryCode} ${data.phone}` : '—'],
    ['Area of interest', data.interest || '—'],
    ['Message', data.message],
  ];
  const subject = `New INQVEXA website enquiry — ${data.interest || 'General'} — ${data.name}`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="border:1px solid #ddd;font-weight:bold;vertical-align:top">${esc(k)}</td><td style="border:1px solid #ddd;white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('')}</table>`;

  try {
    if (process.env.SES_FROM_EMAIL) {
      const ses = new SESv2Client({ region: process.env.SES_REGION || 'ap-south-1' });
      await ses.send(new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL,
        Destination: { ToAddresses: [TO] },
        ReplyToAddresses: [data.email],
        Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' }, Html: { Data: html, Charset: 'UTF-8' } } } },
      }));
    } else {
      // Fallback until SES is configured: FormSubmit relay (recipient must confirm once).
      const r = await fetch(`https://formsubmit.co/ajax/${TO}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: subject, _template: 'table', _captcha: 'false', _replyto: data.email, ...Object.fromEntries(rows) }),
      });
      if (!r.ok) throw new Error(`FormSubmit ${r.status}`);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact send failed', err);
    return NextResponse.json({ ok: false, error: 'Send failed' }, { status: 502 });
  }
}
