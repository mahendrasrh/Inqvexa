'use client';

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { FIELD_ORDER, validateContact, type ContactErrors, type ContactInput } from '@/lib/contact';

const DIALS = new Set(COUNTRIES.map((c) => c[1]));
const DEFAULT_CODE = '+91  India';
const INTERESTS = [
  'AI & Intelligent Technology', 'Document Intelligence', 'AI Voice Agents & Voice Automation', 'Supply Chain & Operations',
  'Software & SaaS', 'Digital Transformation', 'Business Consulting', 'Finance & Accounting', 'Credit & Risk',
  'Procurement & Inventory', 'Digital Marketing', 'Training', 'Research & Innovation', 'Partnership', 'Careers', 'Other',
];

const label: CSSProperties = { display: 'grid', gap: 8, fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9FB0C6', fontFamily: "'IBM Plex Mono',monospace" };
const input = (bad: boolean): CSSProperties => ({ width: '100%', background: 'rgba(255,255,255,.05)', border: `1px solid ${bad ? 'rgba(248,113,113,.85)' : 'rgba(255,255,255,.14)'}`, borderRadius: 10, padding: '13px 14px', color: '#fff', fontSize: 15.5, fontFamily: 'inherit', textTransform: 'none', letterSpacing: 0 });
const errStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Manrope,sans-serif', textTransform: 'none', letterSpacing: 0, fontSize: 13.5, fontWeight: 600, color: '#F87171' };

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <span id={id} role="alert" data-form-err="" style={errStyle}>
      <span aria-hidden="true" style={{ width: 15, height: 15, flex: 'none', borderRadius: '50%', border: '1.5px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>!</span>
      {msg}
    </span>
  );
}

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [msgLen, setMsgLen] = useState(0);
  const [codeQuery, setCodeQuery] = useState(DEFAULT_CODE);
  const [selectedCode, setSelectedCode] = useState(DEFAULT_CODE);
  const [codesOpen, setCodesOpen] = useState(false);

  const matches = useMemo(() => {
    const all = COUNTRIES.map(([name, dial]) => ({ dial, label: `${dial}  ${name}`, name: name.toLowerCase() }));
    const q = codeQuery.trim().toLowerCase();
    if (!q || q === selectedCode.toLowerCase()) return all.slice(0, 60);
    const digits = q.replace(/\D/g, '');
    return all
      .map((c) => {
        const bare = c.dial.replace('+', '');
        let rank = -1;
        if (digits && bare === digits) rank = 0;
        else if (digits && bare.startsWith(digits)) rank = 1;
        else if (c.name.startsWith(q)) rank = 2;
        else if (c.label.toLowerCase().includes(q)) rank = 3;
        return { c, rank };
      })
      .filter((m) => m.rank > -1)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 60)
      .map((m) => m.c);
  }, [codeQuery, selectedCode]);

  function read(): ContactInput {
    const f = formRef.current!;
    const v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value || '').trim();
    const codeOk = codeQuery.trim() === selectedCode.trim();
    return {
      name: v('name'), company: v('company'), email: v('email'), role: v('role'),
      countryCode: codeOk ? selectedCode.split(/\s+/)[0] : '', phone: v('phone'),
      interest: v('interest'), message: v('message'), _honey: v('_honey'),
    };
  }
  function check(name: string) {
    const all = validateContact(read(), DIALS);
    setErrors((prev) => {
      const next = { ...prev };
      const keys = (name === 'phone' || name === 'countryCode' ? ['phone', 'countryCode'] : [name]) as (keyof ContactErrors)[];
      keys.forEach((k) => { if (all[k]) next[k] = all[k]; else delete next[k]; });
      return next;
    });
    setSendError('');
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { setTouched((t) => ({ ...t, [e.target.name]: true })); check(e.target.name); };
  const onInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const t = e.currentTarget;
    if (t.name === 'message') setMsgLen(t.value.length);
    if (touched[t.name] || errors[t.name as keyof ContactErrors]) check(t.name);
  };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const data = read();
    const errs = validateContact(data, DIALS);
    setErrors(errs);
    setTouched(Object.fromEntries(FIELD_ORDER.map((k) => [k, true])));
    setSendError('');
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) { (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus(); return; }
    setSending(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        throw new Error(body.error || 'send failed');
      }
      setSentTo(data.email);
      formRef.current?.reset();
      setMsgLen(0); setCodeQuery(DEFAULT_CODE); setSelectedCode(DEFAULT_CODE);
    } catch {
      setSendError('We couldn’t send your message just now. Please try again, or email us directly at karthik.bm@inqvexa.com.');
    } finally {
      setSending(false);
    }
  }

  const bad = (k: keyof ContactErrors) => Boolean(errors[k]);

  return (
    <form ref={formRef} onSubmit={submit} noValidate style={{ background: 'linear-gradient(155deg,#0B1628,#101D31 65%,#152744)', borderRadius: 23, padding: 32 }}>
      {sentTo ? (
        <div style={{ textAlign: 'center', padding: '40px 10px' }}>
          <div style={{ width: 54, height: 54, margin: '0 auto', borderRadius: '50%', background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', fontSize: 24, fontWeight: 700 }}>✓</div>
          <h2 style={{ margin: '22px 0 10px', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Thank you — your message has been sent.</h2>
          <p style={{ margin: '0 auto', maxWidth: 380, fontSize: 16, lineHeight: 1.6, color: '#A9B7C9' }}>Our team has received your enquiry and will reply to {sentTo}.</p>
          <button type="button" data-btn="ghost" onClick={() => { setSentTo(null); setErrors({}); setTouched({}); }} style={{ marginTop: 26, border: '1px solid rgba(255,255,255,.24)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 15, padding: '13px 22px', borderRadius: 11, cursor: 'pointer' }}>Send another</button>
        </div>
      ) : (
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Start the conversation</h2>
          <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.55, color: '#8FA0B7' }}>Fields marked with an asterisk are required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: '16px 18px' }}>
            <label style={label}>Name *
              <input name="name" type="text" required maxLength={80} autoComplete="name" placeholder="Your full name" onBlur={onBlur} onInput={onInput} aria-invalid={bad('name')} aria-describedby="err-name" style={input(bad('name'))} />
              <FieldError id="err-name" msg={errors.name} />
            </label>
            <label style={label}>Company
              <input name="company" type="text" maxLength={100} autoComplete="organization" placeholder="Organization name" onBlur={onBlur} onInput={onInput} aria-invalid={bad('company')} style={input(bad('company'))} />
              <FieldError id="err-company" msg={errors.company} />
            </label>
            <label style={label}>Email *
              <input name="email" type="email" required maxLength={120} autoComplete="email" inputMode="email" placeholder="name@gmail.com" onBlur={onBlur} onInput={onInput} aria-invalid={bad('email')} aria-describedby="err-email" style={input(bad('email'))} />
              <FieldError id="err-email" msg={errors.email} />
            </label>
            <label style={label}>Role
              <input name="role" type="text" maxLength={100} autoComplete="organization-title" placeholder="e.g. Head of Operations" onBlur={onBlur} onInput={onInput} aria-invalid={bad('role')} style={input(bad('role'))} />
              <FieldError id="err-role" msg={errors.role} />
            </label>
            <label style={{ ...label, gridColumn: '1/-1' }}>Phone
              <span style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                <span style={{ position: 'relative', flex: '0 0 clamp(150px,32%,198px)', minWidth: 0 }}>
                  <input name="countryCode" type="text" autoComplete="off" value={codeQuery} aria-label="Country code" aria-invalid={bad('countryCode')}
                    onChange={(e) => { setCodeQuery(e.target.value); setCodesOpen(true); }}
                    onFocus={(e) => { setCodesOpen(true); e.target.select(); }}
                    onBlur={() => setTimeout(() => { setCodesOpen(false); setCodeQuery((q) => (DIALS.has(q.split(/\s+/)[0]) && q === selectedCode ? q : selectedCode)); }, 120)}
                    placeholder="Search country" style={{ ...input(bad('countryCode')), fontSize: 15 }} />
                  {codesOpen && (
                    <span role="listbox" style={{ position: 'absolute', zIndex: 20, top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 230, overflowY: 'auto', background: '#0E1B2E', border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, boxShadow: '0 24px 50px rgba(0,0,0,.5)', display: 'block' }}>
                      {matches.map((c) => (
                        <span key={c.label} role="option" aria-selected={c.label === selectedCode}
                          onMouseDown={(e) => { e.preventDefault(); setCodeQuery(c.label); setSelectedCode(c.label); setCodesOpen(false); if (errors.countryCode || errors.phone) setTimeout(() => check('phone'), 0); }}
                          className="inq-code-opt"
                          style={{ display: 'block', padding: '11px 14px', fontSize: 14.5, color: '#DCE5F0', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontFamily: 'Manrope,sans-serif' }}>{c.label}</span>
                      ))}
                      {matches.length === 0 && <span style={{ display: 'block', padding: '12px 14px', fontSize: 14, color: '#7A8CA5', textTransform: 'none', letterSpacing: 0, fontFamily: 'Manrope,sans-serif' }}>No match</span>}
                    </span>
                  )}
                </span>
                <input name="phone" type="tel" inputMode="tel" maxLength={20} autoComplete="tel-national" placeholder="98765 43210" onBlur={onBlur} onInput={onInput} aria-invalid={bad('phone')} aria-describedby="err-phone" style={{ ...input(bad('phone')), flex: '1 1 160px', minWidth: 0 }} />
              </span>
              <FieldError id="err-countryCode" msg={errors.countryCode} />
              <FieldError id="err-phone" msg={errors.phone} />
            </label>
            <label style={{ ...label, gridColumn: '1/-1' }}>Area of interest
              <select name="interest" defaultValue={INTERESTS[0]} style={{ ...input(false), padding: '13px 42px 13px 14px' }}>
                {INTERESTS.map((o) => <option key={o} style={{ color: '#0B1628' }}>{o}</option>)}
              </select>
            </label>
          </div>
          <label style={{ ...label, marginTop: 16 }}>Message *
            <textarea name="message" rows={5} required maxLength={2000} placeholder="Which process is slowing you down, and what happens today?" onBlur={onBlur} onInput={onInput} aria-invalid={bad('message')} aria-describedby="err-message" style={{ ...input(bad('message')), resize: 'vertical' }} />
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontFamily: 'Manrope,sans-serif', textTransform: 'none', letterSpacing: 0 }}>
              <span><FieldError id="err-message" msg={errors.message} /></span>
              <span style={{ fontSize: 12.5, color: '#7A8CA5', flex: 'none' }}>{msgLen} / 2000</span>
            </span>
          </label>
          <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
          {sendError && (
            <div role="alert" data-send-err="" style={{ marginTop: 18, border: '1px solid rgba(248,113,113,.45)', background: 'rgba(248,113,113,.1)', borderRadius: 12, padding: '12px 14px', fontSize: 14.5, lineHeight: 1.5, color: '#FCA5A5' }}>{sendError}</div>
          )}
          <button type="submit" disabled={sending} aria-busy={sending} data-btn="primary" className="inq-send"
            style={{ marginTop: 22, width: '100%', background: '#E25822', border: 'none', color: '#fff', fontWeight: 700, fontSize: 16.5, padding: '16px 24px', borderRadius: 12, cursor: sending ? 'wait' : 'pointer', boxShadow: '0 12px 32px rgba(226,88,34,.32)', opacity: sending ? 0.8 : 1 }}>
            {sending ? 'Sending…' : 'Send'}
          </button>
          <p style={{ margin: '16px 0 0', fontSize: 13.5, lineHeight: 1.55, color: '#7A8CA5' }}>We use your details only to respond to this inquiry.</p>
        </div>
      )}
    </form>
  );
}
