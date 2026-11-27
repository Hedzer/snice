/**
 * Built-in snice icon set — a small curated subset of Heroicons, used by
 * components as their default glyph when no consumer slot or `icon` prop is
 * provided. Consumers can always override by slotting their own icon library
 * (Font Awesome, Material Symbols, Lucide, custom SVG, etc.).
 *
 * Copied from Heroicons v2 — MIT License, © Tailwind Labs.
 * https://github.com/tailwindlabs/heroicons
 *
 * Why embed instead of depending on a package:
 * - Snice ships zero runtime dependencies beyond the framework itself.
 * - We only need ~15 glyphs; the full Heroicons package is 600+ icons.
 * - Embedding sidesteps shadow DOM / module-resolution concerns and keeps
 *   default icons available even in sandboxed environments.
 *
 * All SVGs:
 * - viewBox="0 0 24 24"
 * - solid variants use `fill="currentColor"`
 * - outline variants use `stroke="currentColor"` + no fill
 *
 * Components pass `currentColor` through by setting `color:` on the wrapper.
 */

/** Heroicon source style. Components pick based on visual weight needed. */
export type IconStyle = 'solid' | 'outline';

import { INFO_CIRCLE_SOLID } from './info-circle-solid';
import { CHECK_CIRCLE_SOLID } from './check-circle-solid';
import { EXCLAMATION_TRIANGLE_SOLID } from './exclamation-triangle-solid';
import { X_CIRCLE_SOLID } from './x-circle-solid';
import { PAPER_AIRPLANE_SOLID } from './paper-airplane-solid';
import { X_MARK } from './x-mark';
import { CHEVRON_DOWN } from './chevron-down';
import { CHEVRON_UP } from './chevron-up';
import { CHEVRON_RIGHT } from './chevron-right';
import { CHEVRON_LEFT } from './chevron-left';
import { CHECK } from './check';
import { MAGNIFYING_GLASS } from './magnifying-glass';
import { BARS_3 } from './bars-3';
import { PHOTO } from './photo';
import { ELLIPSIS_HORIZONTAL } from './ellipsis-horizontal';
import { TRASH } from './trash';
import { PLUS } from './plus';
import { CAMERA } from './camera';
import { PENCIL } from './pencil';
import { ARROW_UP } from './arrow-up';
import { ARROW_DOWN } from './arrow-down';
import { ARROW_RIGHT } from './arrow-right';
import { ARROW_TRENDING_UP } from './arrow-trending-up';
import { ARROW_TRENDING_DOWN } from './arrow-trending-down';
import { STAR_SOLID } from './star-solid';
import { STAR_OUTLINE } from './star-outline';
import { CIRCLE_SOLID } from './circle-solid';
import { FUNNEL } from './funnel';
import { ARROW_DOWN_TRAY } from './arrow-down-tray';
import { ARROW_UP_TRAY } from './arrow-up-tray';
import { CHAT_BUBBLE } from './chat-bubble';
import { ROCKET_LAUNCH } from './rocket-launch';
import { KEY } from './key';
import { FIRE } from './fire';
import { COG_6_TOOTH } from './cog-6-tooth';
import { ENVELOPE } from './envelope';
import { LIGHT_BULB } from './light-bulb';
import { USERS } from './users';
import { HEART } from './heart';
import { HOME } from './home';
import { CHART_BAR } from './chart-bar';
import { SCISSORS } from './scissors';
import { USER } from './user';
import { CLIPBOARD } from './clipboard';
import { BUG_ANT } from './bug-ant';
import { CALENDAR_DAYS } from './calendar-days';
import { SPARKLES } from './sparkles';
import { BELL_ALERT } from './bell-alert';
import { CUBE } from './cube';
import { BANKNOTES } from './banknotes';
import { CAKE } from './cake';
import { PAINT_BRUSH } from './paint-brush';
import { GIFT } from './gift';
import { FOLDER } from './folder';
import { DOCUMENT_TEXT } from './document-text';
import { BELL } from './bell';
import { LINK } from './link';
import { PHONE } from './phone';
import { COMPUTER_DESKTOP } from './computer-desktop';
import { MUSICAL_NOTE } from './musical-note';
import { TABLE_CELLS } from './table-cells';
import { MINUS } from './minus';
import { LOCK_CLOSED } from './lock-closed';
import { ARROWS_POINTING_OUT } from './arrows-pointing-out';
import { EYE_SLASH } from './eye-slash';
import { MAP_PIN } from './map-pin';
import { ARROWS_RIGHT_LEFT } from './arrows-right-left';
import { PAPER_CLIP } from './paper-clip';

export { INFO_CIRCLE_SOLID } from './info-circle-solid';
export { CHECK_CIRCLE_SOLID } from './check-circle-solid';
export { EXCLAMATION_TRIANGLE_SOLID } from './exclamation-triangle-solid';
export { X_CIRCLE_SOLID } from './x-circle-solid';
export { PAPER_AIRPLANE_SOLID } from './paper-airplane-solid';
export { X_MARK } from './x-mark';
export { CHEVRON_DOWN } from './chevron-down';
export { CHEVRON_UP } from './chevron-up';
export { CHEVRON_RIGHT } from './chevron-right';
export { CHEVRON_LEFT } from './chevron-left';
export { CHECK } from './check';
export { MAGNIFYING_GLASS } from './magnifying-glass';
export { BARS_3 } from './bars-3';
export { PHOTO } from './photo';
export { ELLIPSIS_HORIZONTAL } from './ellipsis-horizontal';
export { TRASH } from './trash';
export { PLUS } from './plus';
export { CAMERA } from './camera';
export { PENCIL } from './pencil';
export { ARROW_UP } from './arrow-up';
export { ARROW_DOWN } from './arrow-down';
export { ARROW_RIGHT } from './arrow-right';
export { ARROW_TRENDING_UP } from './arrow-trending-up';
export { ARROW_TRENDING_DOWN } from './arrow-trending-down';
export { STAR_SOLID } from './star-solid';
export { STAR_OUTLINE } from './star-outline';
export { CIRCLE_SOLID } from './circle-solid';
export { FUNNEL } from './funnel';
export { ARROW_DOWN_TRAY } from './arrow-down-tray';
export { ARROW_UP_TRAY } from './arrow-up-tray';
export { CHAT_BUBBLE } from './chat-bubble';
export { ROCKET_LAUNCH } from './rocket-launch';
export { KEY } from './key';
export { FIRE } from './fire';
export { COG_6_TOOTH } from './cog-6-tooth';
export { ENVELOPE } from './envelope';
export { LIGHT_BULB } from './light-bulb';
export { USERS } from './users';
export { HEART } from './heart';
export { HOME } from './home';
export { CHART_BAR } from './chart-bar';
export { SCISSORS } from './scissors';
export { USER } from './user';
export { CLIPBOARD } from './clipboard';
export { BUG_ANT } from './bug-ant';
export { CALENDAR_DAYS } from './calendar-days';
export { SPARKLES } from './sparkles';
export { BELL_ALERT } from './bell-alert';
export { CUBE } from './cube';
export { BANKNOTES } from './banknotes';
export { CAKE } from './cake';
export { PAINT_BRUSH } from './paint-brush';
export { GIFT } from './gift';
export { FOLDER } from './folder';
export { DOCUMENT_TEXT } from './document-text';
export { BELL } from './bell';
export { LINK } from './link';
export { PHONE } from './phone';
export { COMPUTER_DESKTOP } from './computer-desktop';
export { MUSICAL_NOTE } from './musical-note';
export { TABLE_CELLS } from './table-cells';
export { MINUS } from './minus';
export { LOCK_CLOSED } from './lock-closed';
export { ARROWS_POINTING_OUT } from './arrows-pointing-out';
export { EYE_SLASH } from './eye-slash';
export { MAP_PIN } from './map-pin';
export { ARROWS_RIGHT_LEFT } from './arrows-right-left';
export { PAPER_CLIP } from './paper-clip';

/** Small lookup for named access from template-string paths. */
export const ICONS = {
  'info-circle':           INFO_CIRCLE_SOLID,
  'check-circle':          CHECK_CIRCLE_SOLID,
  'exclamation-triangle':  EXCLAMATION_TRIANGLE_SOLID,
  'x-circle':              X_CIRCLE_SOLID,
  'x-mark':                X_MARK,
  'chevron-down':          CHEVRON_DOWN,
  'chevron-up':            CHEVRON_UP,
  'chevron-right':         CHEVRON_RIGHT,
  'chevron-left':          CHEVRON_LEFT,
  'check':                 CHECK,
  'magnifying-glass':      MAGNIFYING_GLASS,
  'search':                MAGNIFYING_GLASS, // common alias (table toolbar, inputs)
  'bars-3':                BARS_3,
  'photo':                 PHOTO,
  'ellipsis-horizontal':   ELLIPSIS_HORIZONTAL,
  'trash':                 TRASH,
  'plus':                  PLUS,
  'camera':                CAMERA,
  'pencil':                PENCIL,
  'arrow-up':              ARROW_UP,
  'arrow-down':            ARROW_DOWN,
  'arrow-right':           ARROW_RIGHT,
  'arrow-trending-up':     ARROW_TRENDING_UP,
  'arrow-trending-down':   ARROW_TRENDING_DOWN,
  'star':                  STAR_SOLID,
  'star-outline':          STAR_OUTLINE,
  'circle':                CIRCLE_SOLID,
  'paper-clip':            PAPER_CLIP,
  'paper-airplane':        PAPER_AIRPLANE_SOLID,
  'arrow-down-tray':       ARROW_DOWN_TRAY,
  'arrow-up-tray':         ARROW_UP_TRAY,
  'chat-bubble':           CHAT_BUBBLE,
  'rocket-launch':         ROCKET_LAUNCH,
  'key':                   KEY,
  'arrows-right-left':     ARROWS_RIGHT_LEFT,
  'arrows-pointing-out':   ARROWS_POINTING_OUT,
  'eye-slash':             EYE_SLASH,
  'map-pin':               MAP_PIN,
  'fire':                  FIRE,
  'cog-6-tooth':           COG_6_TOOTH,
  'settings':              COG_6_TOOTH, // common alias
  'envelope':              ENVELOPE,
  'light-bulb':            LIGHT_BULB,
  'users':                 USERS,
  'heart':                 HEART,
  'home':                  HOME,
  'chart-bar':             CHART_BAR,
  'scissors':              SCISSORS,
  'user':                  USER,
  'clipboard':             CLIPBOARD,
  'bug-ant':               BUG_ANT,
  'calendar-days':         CALENDAR_DAYS,
  'sparkles':              SPARKLES,
  'bell-alert':            BELL_ALERT,
  'cube':                  CUBE,
  'banknotes':             BANKNOTES,
  'cake':                  CAKE,
  'paint-brush':           PAINT_BRUSH,
  'gift':                  GIFT,
  'folder':                FOLDER,
  'document-text':         DOCUMENT_TEXT,
  'bell':                  BELL,
  'link':                  LINK,
  'phone':                 PHONE,
  'computer-desktop':      COMPUTER_DESKTOP,
  'musical-note':          MUSICAL_NOTE,
  'lock-closed':           LOCK_CLOSED,
  'table-cells':           TABLE_CELLS,
  'minus':                 MINUS,
} as const;

export type IconName = keyof typeof ICONS;
