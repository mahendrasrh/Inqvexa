export type ContactInput = {
  name: string;
  company?: string;
  email: string;
  role?: string;
  countryCode?: string;
  phone?: string;
  interest?: string;
  message: string;
  _honey?: string;
};

export type ContactErrors = Partial<Record<'name' | 'company' | 'email' | 'role' | 'countryCode' | 'phone' | 'message', string>>;

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'’-]*$/u;
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+'-]{0,62}[A-Za-z0-9_%+'-])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

/** Field-level rules shared by the browser form and the /api/contact route. */
export function validateContact(v: ContactInput, validDialCodes: ReadonlySet<string>): ContactErrors {
  const e: ContactErrors = {};
  const name = (v.name || '').trim();
  if (!name) e.name = 'Please enter your name.';
  else if (name.length < 2) e.name = 'Name must be at least 2 characters.';
  else if (name.length > 80) e.name = 'Name must be 80 characters or fewer.';
  else if (!NAME_RE.test(name)) e.name = 'Use letters, spaces, hyphens or apostrophes only.';

  const email = (v.email || '').trim();
  if (!email) e.email = 'Please enter your email address.';
  else if (email.length > 120 || !EMAIL_RE.test(email) || /\.\./.test(email)) e.email = 'Enter a valid email address, e.g. name@gmail.com.';

  const company = (v.company || '').trim();
  if (company && company.length < 2) e.company = 'Company name looks too short.';
  else if (company.length > 100) e.company = 'Company name must be 100 characters or fewer.';

  const role = (v.role || '').trim();
  if (role && role.length < 2) e.role = 'Role looks too short.';
  else if (role.length > 100) e.role = 'Role must be 100 characters or fewer.';

  const phone = (v.phone || '').trim();
  if (phone) {
    if (!/^[0-9\s()+-]+$/.test(phone)) e.phone = 'Phone number can contain digits, spaces and hyphens only.';
    else {
      const d = phone.replace(/\D/g, '');
      if (d.length < 6 || d.length > 14) e.phone = 'Enter a valid phone number (6–14 digits).';
    }
    if (!v.countryCode || !validDialCodes.has(v.countryCode)) e.countryCode = 'Select a country code from the list.';
  }

  const msg = (v.message || '').trim();
  if (!msg) e.message = 'Please tell us briefly what you are trying to solve.';
  else if (msg.length < 20) e.message = 'Please add a little more detail (at least 20 characters).';
  else if (msg.length > 2000) e.message = 'Message must be 2000 characters or fewer.';
  return e;
}

export const FIELD_ORDER = ['name', 'company', 'email', 'role', 'countryCode', 'phone', 'message'] as const;
