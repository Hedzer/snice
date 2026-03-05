/**
 * Snice Theme Presets
 * Each preset overrides HSL color primitives (gray/blue/green/red/yellow 50-950).
 * Semantic colors cascade automatically via theme.css.
 */

export const PRESETS = [
  {
    name: 'default',
    label: 'Default',
    description: 'The standard Snice palette',
    swatches: ['#2563eb', '#16a34a', '#dc2626', '#eab308'],
    css: '',
    cssDark: ''
  },
  {
    name: 'ocean',
    label: 'Ocean',
    description: 'Teal primary with cool blue-tinted grays',
    swatches: ['#0891b2', '#06b6d4', '#164e63', '#cffafe'],
    css: `:root {
  --snice-color-gray-50: 200 20% 98%;
  --snice-color-gray-100: 200 18% 95%;
  --snice-color-gray-200: 200 15% 89%;
  --snice-color-gray-300: 200 12% 82%;
  --snice-color-gray-400: 200 10% 64%;
  --snice-color-gray-500: 200 10% 45%;
  --snice-color-gray-600: 200 12% 32%;
  --snice-color-gray-700: 200 15% 25%;
  --snice-color-gray-800: 200 18% 15%;
  --snice-color-gray-900: 200 20% 9%;
  --snice-color-gray-950: 200 22% 4%;
  --snice-color-blue-50: 188 100% 97%;
  --snice-color-blue-100: 188 95% 92%;
  --snice-color-blue-200: 187 92% 83%;
  --snice-color-blue-300: 187 88% 72%;
  --snice-color-blue-400: 188 85% 58%;
  --snice-color-blue-500: 189 94% 43%;
  --snice-color-blue-600: 192 91% 36%;
  --snice-color-blue-700: 193 82% 31%;
  --snice-color-blue-800: 194 70% 26%;
  --snice-color-blue-900: 196 64% 22%;
  --snice-color-blue-950: 197 60% 12%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(200 25% 8%);
  --snice-color-background-element: hsl(200 15% 16%);
}`
  },
  {
    name: 'forest',
    label: 'Forest',
    description: 'Green primary with warm earthy grays',
    swatches: ['#15803d', '#22c55e', '#365314', '#f0fdf4'],
    css: `:root {
  --snice-color-gray-50: 40 15% 98%;
  --snice-color-gray-100: 40 12% 95%;
  --snice-color-gray-200: 38 10% 89%;
  --snice-color-gray-300: 36 8% 82%;
  --snice-color-gray-400: 34 6% 64%;
  --snice-color-gray-500: 32 6% 45%;
  --snice-color-gray-600: 30 8% 32%;
  --snice-color-gray-700: 28 10% 25%;
  --snice-color-gray-800: 26 12% 15%;
  --snice-color-gray-900: 24 15% 9%;
  --snice-color-gray-950: 22 18% 4%;
  --snice-color-blue-50: 138 76% 97%;
  --snice-color-blue-100: 141 84% 93%;
  --snice-color-blue-200: 141 79% 85%;
  --snice-color-blue-300: 142 77% 73%;
  --snice-color-blue-400: 142 69% 58%;
  --snice-color-blue-500: 142 71% 45%;
  --snice-color-blue-600: 142 76% 36%;
  --snice-color-blue-700: 142 72% 29%;
  --snice-color-blue-800: 143 64% 24%;
  --snice-color-blue-900: 144 61% 20%;
  --snice-color-blue-950: 145 80% 10%;
  --snice-color-green-50: 80 80% 96%;
  --snice-color-green-100: 80 76% 90%;
  --snice-color-green-200: 82 73% 80%;
  --snice-color-green-300: 84 68% 67%;
  --snice-color-green-400: 86 62% 52%;
  --snice-color-green-500: 88 65% 42%;
  --snice-color-green-600: 90 68% 34%;
  --snice-color-green-700: 92 64% 28%;
  --snice-color-green-800: 93 58% 23%;
  --snice-color-green-900: 94 52% 19%;
  --snice-color-green-950: 96 48% 10%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(24 18% 8%);
  --snice-color-background-element: hsl(26 12% 16%);
}`
  },
  {
    name: 'sunset',
    label: 'Sunset',
    description: 'Orange primary with warm grays',
    swatches: ['#ea580c', '#f97316', '#7c2d12', '#fff7ed'],
    css: `:root {
  --snice-color-gray-50: 30 20% 98%;
  --snice-color-gray-100: 30 16% 95%;
  --snice-color-gray-200: 28 12% 89%;
  --snice-color-gray-300: 26 10% 82%;
  --snice-color-gray-400: 24 8% 64%;
  --snice-color-gray-500: 22 8% 45%;
  --snice-color-gray-600: 20 10% 32%;
  --snice-color-gray-700: 18 12% 25%;
  --snice-color-gray-800: 16 15% 15%;
  --snice-color-gray-900: 14 18% 9%;
  --snice-color-gray-950: 12 20% 4%;
  --snice-color-blue-50: 33 100% 96%;
  --snice-color-blue-100: 34 100% 92%;
  --snice-color-blue-200: 32 98% 83%;
  --snice-color-blue-300: 31 97% 72%;
  --snice-color-blue-400: 27 96% 61%;
  --snice-color-blue-500: 25 95% 53%;
  --snice-color-blue-600: 21 90% 48%;
  --snice-color-blue-700: 17 88% 40%;
  --snice-color-blue-800: 15 79% 34%;
  --snice-color-blue-900: 13 70% 28%;
  --snice-color-blue-950: 10 65% 15%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(14 20% 7%);
  --snice-color-background-element: hsl(16 14% 15%);
}`
  },
  {
    name: 'violet',
    label: 'Violet',
    description: 'Purple primary with cool grays',
    swatches: ['#7c3aed', '#a78bfa', '#4c1d95', '#f5f3ff'],
    css: `:root {
  --snice-color-gray-50: 260 15% 98%;
  --snice-color-gray-100: 260 12% 95%;
  --snice-color-gray-200: 258 10% 89%;
  --snice-color-gray-300: 256 8% 82%;
  --snice-color-gray-400: 254 6% 64%;
  --snice-color-gray-500: 252 6% 45%;
  --snice-color-gray-600: 250 8% 32%;
  --snice-color-gray-700: 248 10% 25%;
  --snice-color-gray-800: 246 12% 15%;
  --snice-color-gray-900: 244 15% 9%;
  --snice-color-gray-950: 242 18% 4%;
  --snice-color-blue-50: 270 100% 98%;
  --snice-color-blue-100: 269 100% 95%;
  --snice-color-blue-200: 268 100% 89%;
  --snice-color-blue-300: 269 97% 81%;
  --snice-color-blue-400: 270 95% 71%;
  --snice-color-blue-500: 271 91% 65%;
  --snice-color-blue-600: 271 81% 56%;
  --snice-color-blue-700: 272 72% 47%;
  --snice-color-blue-800: 273 67% 39%;
  --snice-color-blue-900: 274 62% 32%;
  --snice-color-blue-950: 275 60% 18%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(244 18% 8%);
  --snice-color-background-element: hsl(246 12% 16%);
}`
  },
  {
    name: 'rose',
    label: 'Rose',
    description: 'Pink primary with warm-neutral grays',
    swatches: ['#e11d48', '#fb7185', '#881337', '#fff1f2'],
    css: `:root {
  --snice-color-gray-50: 10 15% 98%;
  --snice-color-gray-100: 10 12% 95%;
  --snice-color-gray-200: 8 10% 89%;
  --snice-color-gray-300: 6 8% 82%;
  --snice-color-gray-400: 4 6% 64%;
  --snice-color-gray-500: 2 6% 45%;
  --snice-color-gray-600: 0 8% 32%;
  --snice-color-gray-700: 358 10% 25%;
  --snice-color-gray-800: 356 12% 15%;
  --snice-color-gray-900: 354 15% 9%;
  --snice-color-gray-950: 352 18% 4%;
  --snice-color-blue-50: 348 100% 97%;
  --snice-color-blue-100: 346 100% 95%;
  --snice-color-blue-200: 344 96% 90%;
  --snice-color-blue-300: 342 95% 82%;
  --snice-color-blue-400: 341 90% 71%;
  --snice-color-blue-500: 340 82% 59%;
  --snice-color-blue-600: 339 76% 51%;
  --snice-color-blue-700: 338 72% 43%;
  --snice-color-blue-800: 336 65% 36%;
  --snice-color-blue-900: 334 58% 30%;
  --snice-color-blue-950: 332 55% 16%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(354 18% 8%);
  --snice-color-background-element: hsl(356 12% 15%);
}`
  },
  {
    name: 'slate',
    label: 'Slate',
    description: 'Muted blue-gray primary with slate grays',
    swatches: ['#475569', '#94a3b8', '#1e293b', '#f8fafc'],
    css: `:root {
  --snice-color-gray-50: 210 40% 98%;
  --snice-color-gray-100: 210 35% 96%;
  --snice-color-gray-200: 214 32% 91%;
  --snice-color-gray-300: 213 27% 84%;
  --snice-color-gray-400: 215 20% 65%;
  --snice-color-gray-500: 215 16% 47%;
  --snice-color-gray-600: 215 19% 35%;
  --snice-color-gray-700: 217 23% 27%;
  --snice-color-gray-800: 217 33% 17%;
  --snice-color-gray-900: 222 47% 11%;
  --snice-color-gray-950: 229 84% 5%;
  --snice-color-blue-50: 210 40% 97%;
  --snice-color-blue-100: 212 35% 93%;
  --snice-color-blue-200: 214 30% 86%;
  --snice-color-blue-300: 213 25% 76%;
  --snice-color-blue-400: 215 20% 65%;
  --snice-color-blue-500: 215 19% 50%;
  --snice-color-blue-600: 215 25% 40%;
  --snice-color-blue-700: 217 30% 32%;
  --snice-color-blue-800: 217 33% 24%;
  --snice-color-blue-900: 222 40% 17%;
  --snice-color-blue-950: 229 50% 10%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(222 47% 7%);
  --snice-color-background-element: hsl(217 33% 14%);
}`
  },
  {
    name: 'sand',
    label: 'Sand',
    description: 'Amber primary with sandy warm grays',
    swatches: ['#d97706', '#fbbf24', '#78350f', '#fffbeb'],
    css: `:root {
  --snice-color-gray-50: 45 20% 98%;
  --snice-color-gray-100: 44 16% 95%;
  --snice-color-gray-200: 42 14% 89%;
  --snice-color-gray-300: 40 12% 82%;
  --snice-color-gray-400: 38 10% 64%;
  --snice-color-gray-500: 36 10% 45%;
  --snice-color-gray-600: 34 12% 32%;
  --snice-color-gray-700: 32 14% 25%;
  --snice-color-gray-800: 30 16% 15%;
  --snice-color-gray-900: 28 18% 9%;
  --snice-color-gray-950: 26 20% 4%;
  --snice-color-blue-50: 48 100% 96%;
  --snice-color-blue-100: 48 97% 89%;
  --snice-color-blue-200: 48 96% 79%;
  --snice-color-blue-300: 46 97% 65%;
  --snice-color-blue-400: 43 96% 56%;
  --snice-color-blue-500: 38 92% 50%;
  --snice-color-blue-600: 33 90% 45%;
  --snice-color-blue-700: 28 80% 37%;
  --snice-color-blue-800: 26 72% 31%;
  --snice-color-blue-900: 24 65% 26%;
  --snice-color-blue-950: 22 60% 14%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(28 20% 7%);
  --snice-color-background-element: hsl(30 14% 15%);
}`
  },
  {
    name: 'midnight',
    label: 'Midnight',
    description: 'Deep indigo primary with cool dark tones',
    swatches: ['#4338ca', '#6366f1', '#1e1b4b', '#eef2ff'],
    css: `:root {
  --snice-color-gray-50: 230 20% 98%;
  --snice-color-gray-100: 230 18% 96%;
  --snice-color-gray-200: 232 16% 90%;
  --snice-color-gray-300: 234 14% 83%;
  --snice-color-gray-400: 236 10% 64%;
  --snice-color-gray-500: 238 10% 46%;
  --snice-color-gray-600: 240 12% 34%;
  --snice-color-gray-700: 242 15% 26%;
  --snice-color-gray-800: 244 20% 16%;
  --snice-color-gray-900: 246 30% 10%;
  --snice-color-gray-950: 248 40% 5%;
  --snice-color-blue-50: 244 100% 97%;
  --snice-color-blue-100: 243 100% 94%;
  --snice-color-blue-200: 245 100% 88%;
  --snice-color-blue-300: 246 96% 80%;
  --snice-color-blue-400: 247 92% 70%;
  --snice-color-blue-500: 249 90% 63%;
  --snice-color-blue-600: 250 84% 54%;
  --snice-color-blue-700: 252 78% 46%;
  --snice-color-blue-800: 253 70% 38%;
  --snice-color-blue-900: 254 62% 30%;
  --snice-color-blue-950: 255 58% 17%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(246 35% 7%);
  --snice-color-background-element: hsl(244 22% 14%);
}`
  },
  {
    name: 'coffee',
    label: 'Coffee',
    description: 'Warm espresso primary with mocha grays',
    swatches: ['#78350f', '#a16207', '#451a03', '#fef3c7'],
    css: `:root {
  --snice-color-gray-50: 35 25% 98%;
  --snice-color-gray-100: 34 20% 95%;
  --snice-color-gray-200: 32 16% 88%;
  --snice-color-gray-300: 30 14% 80%;
  --snice-color-gray-400: 28 10% 62%;
  --snice-color-gray-500: 26 10% 44%;
  --snice-color-gray-600: 24 14% 32%;
  --snice-color-gray-700: 22 18% 24%;
  --snice-color-gray-800: 20 22% 15%;
  --snice-color-gray-900: 18 26% 9%;
  --snice-color-gray-950: 16 30% 4%;
  --snice-color-blue-50: 30 80% 96%;
  --snice-color-blue-100: 28 78% 90%;
  --snice-color-blue-200: 26 72% 80%;
  --snice-color-blue-300: 24 66% 66%;
  --snice-color-blue-400: 22 62% 52%;
  --snice-color-blue-500: 20 70% 42%;
  --snice-color-blue-600: 18 75% 34%;
  --snice-color-blue-700: 16 72% 27%;
  --snice-color-blue-800: 14 64% 22%;
  --snice-color-blue-900: 12 56% 18%;
  --snice-color-blue-950: 10 50% 10%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(18 28% 6%);
  --snice-color-background-element: hsl(20 18% 13%);
}`
  },
  {
    name: 'cherry',
    label: 'Cherry',
    description: 'Rich crimson primary with cool-warm grays',
    swatches: ['#be123c', '#f43f5e', '#881337', '#ffe4e6'],
    css: `:root {
  --snice-color-gray-50: 355 14% 98%;
  --snice-color-gray-100: 355 12% 95%;
  --snice-color-gray-200: 356 10% 89%;
  --snice-color-gray-300: 357 8% 82%;
  --snice-color-gray-400: 358 6% 64%;
  --snice-color-gray-500: 359 6% 46%;
  --snice-color-gray-600: 0 8% 33%;
  --snice-color-gray-700: 0 10% 26%;
  --snice-color-gray-800: 0 13% 16%;
  --snice-color-gray-900: 0 16% 10%;
  --snice-color-gray-950: 0 20% 5%;
  --snice-color-blue-50: 356 100% 97%;
  --snice-color-blue-100: 356 100% 94%;
  --snice-color-blue-200: 355 96% 87%;
  --snice-color-blue-300: 354 92% 78%;
  --snice-color-blue-400: 352 86% 66%;
  --snice-color-blue-500: 350 80% 55%;
  --snice-color-blue-600: 348 75% 46%;
  --snice-color-blue-700: 346 72% 38%;
  --snice-color-blue-800: 344 65% 31%;
  --snice-color-blue-900: 342 58% 25%;
  --snice-color-blue-950: 340 55% 14%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(0 18% 7%);
  --snice-color-background-element: hsl(0 12% 14%);
}`
  },
  {
    name: 'coral',
    label: 'Coral',
    description: 'Warm coral primary with soft neutral grays',
    swatches: ['#e7563a', '#f97066', '#9a3412', '#fff1f0'],
    css: `:root {
  --snice-color-gray-50: 20 15% 98%;
  --snice-color-gray-100: 18 12% 95%;
  --snice-color-gray-200: 16 10% 89%;
  --snice-color-gray-300: 14 8% 82%;
  --snice-color-gray-400: 12 6% 64%;
  --snice-color-gray-500: 10 6% 45%;
  --snice-color-gray-600: 8 8% 33%;
  --snice-color-gray-700: 6 10% 26%;
  --snice-color-gray-800: 4 12% 16%;
  --snice-color-gray-900: 2 14% 10%;
  --snice-color-gray-950: 0 16% 5%;
  --snice-color-blue-50: 8 100% 97%;
  --snice-color-blue-100: 8 96% 93%;
  --snice-color-blue-200: 10 92% 85%;
  --snice-color-blue-300: 12 88% 75%;
  --snice-color-blue-400: 14 84% 64%;
  --snice-color-blue-500: 16 80% 55%;
  --snice-color-blue-600: 14 76% 47%;
  --snice-color-blue-700: 12 70% 39%;
  --snice-color-blue-800: 10 62% 32%;
  --snice-color-blue-900: 8 54% 26%;
  --snice-color-blue-950: 6 48% 14%;
}`,
    cssDark: `[data-theme="dark"] {
  --snice-color-background: hsl(2 16% 7%);
  --snice-color-background-element: hsl(4 12% 14%);
}`
  }
];
