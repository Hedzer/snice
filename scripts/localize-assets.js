#!/usr/bin/env node
/**
 * Replace external image URLs with local assets in showcase HTML files.
 * Usage: node scripts/localize-assets.js          (dry run)
 *        node scripts/localize-assets.js --apply   (write changes)
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const apply = process.argv.includes('--apply');

// Map of external URL patterns → local paths
const REPLACEMENTS = [
  // Avatars (pravatar)
  ['https://i.pravatar.cc/100?u=1', 'assets/avatars/pravatar-100-1.jpg'],
  ['https://i.pravatar.cc/100?u=2', 'assets/avatars/pravatar-100-2.jpg'],
  ['https://i.pravatar.cc/80?u=1', 'assets/avatars/pravatar-80-1.jpg'],
  ['https://i.pravatar.cc/80?u=3', 'assets/avatars/pravatar-80-3.jpg'],
  ['https://i.pravatar.cc/80?u=a1', 'assets/avatars/pravatar-80-a1.jpg'],
  ['https://i.pravatar.cc/80?u=a3', 'assets/avatars/pravatar-80-a3.jpg'],
  ['https://i.pravatar.cc/100?u=a7', 'assets/avatars/pravatar-100-a7.jpg'],
  ['https://i.pravatar.cc/100?u=a9', 'assets/avatars/pravatar-100-a9.jpg'],
  ['https://i.pravatar.cc/40?u=alice-sc', 'assets/avatars/pravatar-40-alice.jpg'],
  ['https://i.pravatar.cc/40?u=bob-sc', 'assets/avatars/pravatar-40-bob.jpg'],
  ['https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'assets/avatars/dicebear-sarah.svg'],

  // Photos (picsum) — book
  ['https://picsum.photos/seed/bookcover/400/600', 'assets/photos/book-cover.jpg'],

  // Photos (picsum) — carousel
  ['https://picsum.photos/seed/slide1/800/300', 'assets/photos/slide1.jpg'],
  ['https://picsum.photos/seed/slide2/800/300', 'assets/photos/slide2.jpg'],
  ['https://picsum.photos/seed/slide3/800/300', 'assets/photos/slide3.jpg'],
  ['https://picsum.photos/seed/auto1/800/250', 'assets/photos/auto1.jpg'],
  ['https://picsum.photos/seed/auto2/800/250', 'assets/photos/auto2.jpg'],
  ['https://picsum.photos/seed/auto3/800/250', 'assets/photos/auto3.jpg'],
  ['https://picsum.photos/seed/multi1/400/200', 'assets/photos/multi1.jpg'],
  ['https://picsum.photos/seed/multi2/400/200', 'assets/photos/multi2.jpg'],
  ['https://picsum.photos/seed/multi3/400/200', 'assets/photos/multi3.jpg'],
  ['https://picsum.photos/seed/multi4/400/200', 'assets/photos/multi4.jpg'],
  ['https://picsum.photos/seed/multi5/400/200', 'assets/photos/multi5.jpg'],
  ['https://picsum.photos/seed/multi6/400/200', 'assets/photos/multi6.jpg'],

  // Photos (picsum) — cropper
  ['https://picsum.photos/seed/cropper/500/500', 'assets/photos/cropper.jpg'],

  // Photos (picsum) — image showcase
  ['https://picsum.photos/100/100?r=1', 'assets/photos/thumb1.jpg'],
  ['https://picsum.photos/100/100?r=2', 'assets/photos/thumb2.jpg'],
  ['https://picsum.photos/100/100?r=3', 'assets/photos/thumb3.jpg'],
  ['https://picsum.photos/100/100?r=4', 'assets/photos/thumb4.jpg'],
  ['https://picsum.photos/200/200', 'assets/photos/sample-200.jpg'],

  // Photos (picsum) — link-preview
  ['https://picsum.photos/600/300', 'assets/photos/link-preview.jpg'],

  // Photos (picsum) — masonry
  ['https://picsum.photos/seed/cabin/400/300', 'assets/photos/masonry-cabin.jpg'],
  ['https://picsum.photos/seed/sunset/400/500', 'assets/photos/masonry-sunset.jpg'],
  ['https://picsum.photos/seed/garden/400/260', 'assets/photos/masonry-garden.jpg'],
  ['https://picsum.photos/seed/dark-ui/400/400', 'assets/photos/masonry-dark-ui.jpg'],
  ['https://picsum.photos/seed/food/400/320', 'assets/photos/masonry-food.jpg'],
  ['https://picsum.photos/seed/ceramic/400/550', 'assets/photos/masonry-ceramic.jpg'],
  ['https://picsum.photos/seed/type/400/240', 'assets/photos/masonry-type.jpg'],
  ['https://picsum.photos/seed/coastal/400/380', 'assets/photos/masonry-coastal.jpg'],
  ['https://picsum.photos/seed/desk/400/340', 'assets/photos/masonry-desk.jpg'],

  // Photos (picsum) — product cards
  ['https://picsum.photos/seed/macbook1/800/450', 'assets/photos/product-macbook1.jpg'],
  ['https://picsum.photos/seed/macbook2/800/450', 'assets/photos/product-macbook2.jpg'],
  ['https://picsum.photos/seed/headphones1/400/400', 'assets/photos/product-headphones1.jpg'],
  ['https://picsum.photos/seed/headphones2/400/400', 'assets/photos/product-headphones2.jpg'],
  ['https://picsum.photos/seed/headphones3/400/400', 'assets/photos/product-headphones3.jpg'],
  ['https://picsum.photos/seed/sweater1/400/500', 'assets/photos/product-sweater1.jpg'],
  ['https://picsum.photos/seed/sweater2/400/500', 'assets/photos/product-sweater2.jpg'],
  ['https://picsum.photos/seed/cable1/200/200', 'assets/photos/product-cable1.jpg'],
  ['https://picsum.photos/seed/shoes1/400/400', 'assets/photos/product-shoes1.jpg'],
  ['https://picsum.photos/seed/yogamat/400/400', 'assets/photos/product-yogamat.jpg'],
  ['https://picsum.photos/seed/bottle1/400/400', 'assets/photos/product-bottle1.jpg'],
  ['https://picsum.photos/seed/bands1/400/400', 'assets/photos/product-bands1.jpg'],

  // Photos — testimonial
  ['https://picsum.photos/seed/sarah/80/80', 'assets/photos/testimonial-sarah.jpg'],
  ['https://picsum.photos/seed/marcus/80/80', 'assets/photos/testimonial-marcus.jpg'],

  // Photos — video poster
  ['https://picsum.photos/seed/videoposter/640/360', 'assets/photos/video-poster.jpg'],

  // Photos (unsplash) — recipe
  ['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=400&fit=crop', 'assets/photos/recipe.jpg'],

  // Placeholders (placehold.co) — cart
  ['https://placehold.co/80x80/e2e8f0/475569?text=🎧', 'assets/placeholders/cart-headphones.png'],
  ['https://placehold.co/80x80/e2e8f0/475569?text=📱', 'assets/placeholders/cart-phone.png'],
  ['https://placehold.co/80x80/e2e8f0/475569?text=🔌', 'assets/placeholders/cart-charger.png'],

  // Flags (flagcdn)
  ['https://flagcdn.com/w20/us.png', 'assets/flags/us.png'],
  ['https://flagcdn.com/w20/gb.png', 'assets/flags/gb.png'],
  ['https://flagcdn.com/w20/ca.png', 'assets/flags/ca.png'],
  ['https://flagcdn.com/w20/au.png', 'assets/flags/au.png'],
  ['https://flagcdn.com/w20/de.png', 'assets/flags/de.png'],
  ['https://flagcdn.com/w20/fr.png', 'assets/flags/fr.png'],
  ['https://flagcdn.com/w20/jp.png', 'assets/flags/jp.png'],

  // Icons (simple-icons via jsdelivr)
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlechrome.svg', 'assets/icons/googlechrome.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/firefox.svg', 'assets/icons/firefox.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/visualstudiocode.svg', 'assets/icons/visualstudiocode.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg', 'assets/icons/spotify.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/twitch.svg', 'assets/icons/twitch.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/reddit.svg', 'assets/icons/reddit.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg', 'assets/icons/discord.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg', 'assets/icons/slack.svg'],
  ['https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg', 'assets/icons/github.svg'],
];

// Scan files: showcases + build-website.js
const targets = [];

// Showcase fragments
const showcaseDir = join(root, 'public', 'showcases');
for (const f of readdirSync(showcaseDir)) {
  if (f.endsWith('.html')) targets.push(join(showcaseDir, f));
}

// build-website.js
targets.push(join(root, 'scripts', 'build-website.js'));

console.log(apply ? '=== APPLYING CHANGES ===' : '=== DRY RUN (use --apply to write) ===');
console.log();

let totalReplacements = 0;

for (const filePath of targets) {
  const original = readFileSync(filePath, 'utf-8');
  let content = original;
  const fileHits = [];

  for (const [from, to] of REPLACEMENTS) {
    let count = 0;
    let idx = -1;
    while ((idx = content.indexOf(from, idx + 1)) !== -1) count++;

    if (count > 0) {
      content = content.replaceAll(from, to);
      fileHits.push({ from, to, count });
      totalReplacements += count;
    }
  }

  if (fileHits.length > 0) {
    const rel = filePath.replace(root + '/', '');
    console.log(`${rel}:`);
    for (const h of fileHits) {
      console.log(`  ${h.from}`);
      console.log(`    → ${h.to} (×${h.count})`);
    }
    console.log();

    if (apply && content !== original) {
      writeFileSync(filePath, content);
    }
  }
}

console.log(`Total: ${totalReplacements} replacements across ${targets.length} files scanned`);
if (!apply) console.log('\nRun with --apply to write changes.');
