/**
 * Oracle for the snice-user-card matrix.
 *
 * Read off `docs/ai/components/user-card.md` and `snice-user-card.types.ts`:
 *
 *   name, avatar, role, company, email, phone, location : string = ''
 *   social: SocialLink[]      { platform, url }
 *   status: 'online'|'away'|'offline'|'busy' = 'offline'
 *   variant: 'card'|'horizontal'|'compact' = 'card'
 *   method   emitActionClick(action) -> action-click { action }
 *   events   social-click { platform, url }
 *   parts    base, avatar, status, name, role, contact, social, actions
 *   slot     (default) — action buttons
 *   a11y     avatar fallback uses INITIALS from name;
 *            status indicator has role="img" and aria-label;
 *            social links have aria-label and title;
 *            email/phone rendered as accessible LINKS.
 *
 * "Accessible link" is read strictly: an anchor whose href is the scheme the
 * data type implies (`mailto:` for email, `tel:` for phone), because an
 * anchor with no scheme is not a contact link, it is text that looks like one.
 * `location` is documented as contact info but not as a link, so the oracle
 * expects text for it.
 */
import { Problems, all, one, part, text } from '../matrix-kit';
import type { SocialLink, UserCardStatus, UserCardVariant } from
  '../../../packages/components/src/user-card/snice-user-card.types';

export type { SocialLink, UserCardStatus, UserCardVariant };

export const VARIANTS: UserCardVariant[] = ['card', 'horizontal', 'compact'];
export const STATUSES: UserCardStatus[] = ['online', 'away', 'offline', 'busy'];

/** A user's field vector — every documented string property. */
export interface Profile {
  name: string;
  avatar?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export const AVATAR_URL = 'https://example.test/avatar.png';

/**
 * The documented initials rule: "avatar fallback uses initials from name".
 * One word yields one initial; more than one yields the first two, uppercased.
 * An empty name has no initials to show.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** The documented role line: role and company joined, either alone allowed. */
export function roleLineOf(profile: Profile): string {
  return [profile.role, profile.company].filter(Boolean).join(' at ');
}

export const hasContact = (profile: Profile): boolean =>
  Boolean(profile.email || profile.phone || profile.location);

/**
 * The avatar region: exactly one of the image (when `avatar` is set) or the
 * initials fallback (when it is not), plus the status dot.
 */
export function checkAvatar(
  el: HTMLElement,
  profile: Profile,
  status: UserCardStatus,
  problems: Problems,
): void {
  const wrapper = part(el, 'avatar');
  if (!problems.check(wrapper !== null, 'no [part="avatar"] wrapper')) return;

  const img = wrapper!.querySelector('img');
  const fallback = wrapper!.querySelector('.user-card-avatar-fallback');

  if (profile.avatar) {
    if (problems.check(img !== null, `avatar "${profile.avatar}" set but no <img> rendered`)) {
      problems.equal(img!.getAttribute('src'), profile.avatar, 'avatar src');
      // The alt text is the person, which is what a screen reader needs.
      problems.equal(img!.getAttribute('alt'), profile.name, 'avatar alt');
    }
    problems.check(fallback === null, 'an avatar image and an initials fallback rendered together');
  } else {
    problems.check(img === null, 'no avatar set but an <img> rendered');
    if (problems.check(fallback !== null, 'no avatar and no initials fallback')) {
      problems.equal(text(fallback), initialsOf(profile.name), 'initials fallback');
    }
  }

  const dot = part(el, 'status');
  if (!problems.check(dot !== null, 'no [part="status"] indicator')) return;
  problems.equal(dot!.getAttribute('role'), 'img', 'status role');
  problems.equal(dot!.getAttribute('aria-label'), status, 'status aria-label');
}

/** Name heading and the role/company line. */
export function checkIdentity(el: HTMLElement, profile: Profile, problems: Problems): void {
  const name = part(el, 'name');
  if (profile.name) {
    if (problems.check(name !== null, `name "${profile.name}" set but no [part="name"]`)) {
      problems.equal(text(name), profile.name, 'name text');
    }
  } else {
    problems.check(name === null, 'no name set but a name heading rendered');
  }

  const line = roleLineOf(profile);
  const role = part(el, 'role');
  if (line) {
    if (problems.check(role !== null, `role line "${line}" expected but no [part="role"]`)) {
      problems.equal(text(role), line, 'role/company line');
    }
  } else {
    problems.check(role === null, 'neither role nor company set but a role line rendered');
  }
}

/** The contact block: present only when there is something to contact. */
export function checkContact(el: HTMLElement, profile: Profile, problems: Problems): void {
  const contact = part(el, 'contact');
  if (!hasContact(profile)) {
    problems.check(contact === null, 'no contact fields set but a contact block rendered');
    return;
  }
  if (!problems.check(contact !== null, 'contact fields set but no [part="contact"]')) return;

  const links = [...contact!.querySelectorAll('a')];
  const hrefs = links.map(a => a.getAttribute('href'));

  if (profile.email) {
    const email = links.find(a => a.getAttribute('href') === `mailto:${profile.email}`);
    if (problems.check(
      email !== undefined,
      `email "${profile.email}" is not a mailto: link (hrefs ${JSON.stringify(hrefs)})`,
    )) {
      problems.equal(text(email), profile.email, 'email link text');
    }
  } else {
    problems.check(
      !hrefs.some(href => href?.startsWith('mailto:')),
      `no email set but a mailto: link rendered (${JSON.stringify(hrefs)})`,
    );
  }

  if (profile.phone) {
    const phone = links.find(a => a.getAttribute('href') === `tel:${profile.phone}`);
    if (problems.check(
      phone !== undefined,
      `phone "${profile.phone}" is not a tel: link (hrefs ${JSON.stringify(hrefs)})`,
    )) {
      problems.equal(text(phone), profile.phone, 'phone link text');
    }
  } else {
    problems.check(
      !hrefs.some(href => href?.startsWith('tel:')),
      `no phone set but a tel: link rendered (${JSON.stringify(hrefs)})`,
    );
  }

  const locationText = text(contact!.querySelector('.user-card-contact-text'));
  if (profile.location) {
    problems.equal(locationText, profile.location, 'location text');
  } else {
    problems.check(locationText === '', `no location set but "${locationText}" rendered`);
  }
}

/** The social row: one labelled control per link, in order. */
export function checkSocial(el: HTMLElement, social: SocialLink[], problems: Problems): void {
  const row = part(el, 'social');
  if (social.length === 0) {
    problems.check(row === null, 'no social links but a social row rendered');
    return;
  }
  if (!problems.check(row !== null, 'social links set but no [part="social"]')) return;

  const controls = [...row!.querySelectorAll('.user-card-social-link')];
  if (!problems.equal(controls.length, social.length, 'social control count')) return;

  controls.forEach((control, i) => {
    const link = social[i];
    problems.equal(control.getAttribute('aria-label'), link.platform, `social ${i} aria-label`);
    problems.equal(control.getAttribute('title'), link.platform, `social ${i} title`);
    problems.check(
      control.querySelector('svg') !== null,
      `social ${i} (${link.platform}) renders no icon`,
    );
  });
}

/** The action slot wrapper, which the doc lists as a part in its own right. */
export function checkActions(el: HTMLElement, problems: Problems): void {
  const actions = part(el, 'actions');
  if (!problems.check(actions !== null, 'no [part="actions"] wrapper')) return;
  problems.check(actions!.querySelector('slot') !== null, 'actions wrapper exposes no slot');
}

/** The social controls, as the elements a user clicks. */
export const socialControlsOf = (el: HTMLElement): HTMLElement[] =>
  all<HTMLElement>(el, '.user-card-social-link');

/** The base part — every combo must produce one. */
export const baseOf = (el: HTMLElement): HTMLElement | null => one<HTMLElement>(el, '[part~="base"]');
