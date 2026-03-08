# [4.19.0](https://gitlab.com/Hedzer/snice/compare/v4.18.0...v4.19.0) (2026-03-08)


### Bug Fixes

* activity-feed hover/focus on content area, alert variant colors ([f480592](https://gitlab.com/Hedzer/snice/commit/f480592c7e6300a3e59918dcaf4e1e2bb4ceb3df))
* add attribute: false to complex Array/Object properties ([e4c6085](https://gitlab.com/Hedzer/snice/commit/e4c608528e4ba5eade062d6fc067db6eba782ff4))
* add box-sizing border-box to radio block variant wrapper ([e2d179f](https://gitlab.com/Hedzer/snice/commit/e2d179f5b44cc02e107bbad879efad0aaac1fbbe))
* add compact mode for checkbox sizing ([4d5859e](https://gitlab.com/Hedzer/snice/commit/4d5859edf858331d84405aa10dc5bdfc5e9c8b57))
* apply column width to DOM immediately during resize drag ([e138825](https://gitlab.com/Hedzer/snice/commit/e138825c94d12a7944d35b5080df772ae5acafac))
* badge, chip, tag, tag-input CSS refinements ([bd51a51](https://gitlab.com/Hedzer/snice/commit/bd51a515750e1ae577894a953b23101dc177bddd))
* buffer setHTML calls before doc editor is initialized ([bd7fb59](https://gitlab.com/Hedzer/snice/commit/bd7fb59bfceeff2f7ebe154bd18233d14da218ab))
* clamp step-input value on programmatic change ([994758e](https://gitlab.com/Hedzer/snice/commit/994758ed2665ae6fa1105d69f5751348288d8174))
* clean up drawer CSS ([498cee9](https://gitlab.com/Hedzer/snice/commit/498cee99bb18fff8deb66930c7740e099b58ec04))
* column menu outside-click uses composedPath for shadow DOM ([2846fa4](https://gitlab.com/Hedzer/snice/commit/2846fa414700952471e67c6de0d5b5fb8d499853))
* component CSS layout and sizing adjustments ([e28968f](https://gitlab.com/Hedzer/snice/commit/e28968ff4e176f57c17efec622bc0f14c24396da))
* countdown restarts timer on target change, use conditional template ([4ff8148](https://gitlab.com/Hedzer/snice/commit/4ff8148aeb1c8fff6d4e744f7210840fb9812d76))
* date-range-picker cursor styles and graduate from WIP ([0101035](https://gitlab.com/Hedzer/snice/commit/0101035c92ec76a8c0a8678c2ff408fac66abb78))
* defer drawer push-content transform to next frame for computed CSS vars ([e2b1c47](https://gitlab.com/Hedzer/snice/commit/e2b1c47e85356588e914c183d0ad3efea15ec4cd))
* derive tag variant backgrounds with color-mix from theme tokens ([3a56670](https://gitlab.com/Hedzer/snice/commit/3a56670df7ba1f354af5fda31e02ea6b8107614b))
* doc component types, tree querySelector scope ([4ccf589](https://gitlab.com/Hedzer/snice/commit/4ccf58903b204f02c223cb037d88a5ae91a2efb7))
* drawer component updates ([2c5c3a9](https://gitlab.com/Hedzer/snice/commit/2c5c3a93db53c5b4dc1b84589a526bf1e3bc3769))
* drawer contained overflow, persistent close guard, skip focus trap for contained ([91e4c79](https://gitlab.com/Hedzer/snice/commit/91e4c796770c7a67bc1d6e4babd89e1f8d79fbce))
* drawer push mode applies correct margin for right and bottom positions ([0fa28c0](https://gitlab.com/Hedzer/snice/commit/0fa28c05b82a3b1b6cb673abce7e5e201da4b1a1))
* gate duplicate-registration warning behind SNICE_DEBUG flag ([451e113](https://gitlab.com/Hedzer/snice/commit/451e11363e1609db381d3465ded5f3ef5bf564e7))
* handle all import patterns in showcase transform, fix cache headers ([f315ca8](https://gitlab.com/Hedzer/snice/commit/f315ca80c50b771e0af78bde3aae5f041f81a8c6))
* increase input icon slot size and padding ([685d0b9](https://gitlab.com/Hedzer/snice/commit/685d0b9628ba46050b6b6b8efd81e16c8f080416))
* make tooltip background and color themeable via CSS custom properties ([e8dadd0](https://gitlab.com/Hedzer/snice/commit/e8dadd026c448a0b81f53e4810d682ad3e252771))
* menu demo open by default with avatar src, add hash scroll to footer ([5cd0cd0](https://gitlab.com/Hedzer/snice/commit/5cd0cd0ac8c19b93e37e72e795bcde308932876c))
* move setToolbar after render to ensure container exists ([0d82d1f](https://gitlab.com/Hedzer/snice/commit/0d82d1fd482963f1b2642a7555e52f108d452af7))
* pre-strip script/style tags in markdown sanitizer, make renderedHtml reactive ([dbafa81](https://gitlab.com/Hedzer/snice/commit/dbafa81300d40a2fc9cfef06521fd721da1f2c47))
* product-card border-radius on gallery, spacing adjustments, remove overflow hidden ([ed0e372](https://gitlab.com/Hedzer/snice/commit/ed0e3722c84d2c5cb42a7da36902890a3049092d))
* product-card gallery controls use theme background instead of hardcoded white ([dbfd687](https://gitlab.com/Hedzer/snice/commit/dbfd68754a90903a1a98ca05d1768fd745c31cd3))
* product-card spacing for compact and grid variants ([36aa179](https://gitlab.com/Hedzer/snice/commit/36aa1796430e9c49f76d8c3e3d35461e1918ebb7))
* receipt thermal variant text colors ([2ccb1bc](https://gitlab.com/Hedzer/snice/commit/2ccb1bcd9c384be94e41c1262c618ba88d615710))
* remove contain layout style paint from component host styles ([8e30239](https://gitlab.com/Hedzer/snice/commit/8e3023937ffed26a0912af87db280f436005eb22))
* remove dark mode icon invert hack from app-tiles ([1996445](https://gitlab.com/Hedzer/snice/commit/199644592d9958ff8f022bb9be3bc792e774d5d2))
* replace fadeInUp with fadeIn to prevent transform containing block trapping fixed children ([03ff6ea](https://gitlab.com/Hedzer/snice/commit/03ff6eae971cef47ed0a1f46a3651c91a259e0db))
* restore immediate master-detail collapse, remove broken animation ([fe5f5e8](https://gitlab.com/Hedzer/snice/commit/fe5f5e8e03ef0181d0f17eb0b673a29556a92616))
* serve public/index.html at root in dev server ([3446451](https://gitlab.com/Hedzer/snice/commit/3446451eb9361beb4a325f75fd8a98c860d27834))
* showcase cell-type grid color token fallbacks ([7396d16](https://gitlab.com/Hedzer/snice/commit/7396d161252929168553e65a4808ae95a31fa12e))
* sidebar scroll-spy highlights topmost visible section ([3344df2](https://gitlab.com/Hedzer/snice/commit/3344df2754359058452b5325ebcab6ff94e7e8ca))
* split-button hover uses background-hover token ([d892f42](https://gitlab.com/Hedzer/snice/commit/d892f424b2366a715c4475db92ffd528ec22e330))
* standardize form field heights, labels, and alignment across controls ([12d3460](https://gitlab.com/Hedzer/snice/commit/12d34605cb58b56644c7b2786ec682d838de1948))
* streamline release pipeline, defer version sync to prerelease ([b6736b8](https://gitlab.com/Hedzer/snice/commit/b6736b8dde618f496f4d6e4cbebb3b5557b4941e))
* sync theme to showcase iframe, escape HTML in inline code and table pipes ([2808175](https://gitlab.com/Hedzer/snice/commit/28081756d8ae7d816f46929ef2c6ff4be928c43e))
* themes page layout order, use overflow-x clip, remove redundant heading ([d15bfa1](https://gitlab.com/Hedzer/snice/commit/d15bfa14b7e784cd8d40345aee309a4f34fb2ec2))
* tooltip repositions on scroll and resize ([03f8e1b](https://gitlab.com/Hedzer/snice/commit/03f8e1bae3fbabbac0dfece8309c417cde546d16))
* update tests for camera-annotate, cart, and countdown ([1085af7](https://gitlab.com/Hedzer/snice/commit/1085af7449c2174ea383ed87dc247dfee93dde07))
* use aspect-ratio for calendar day cells instead of fixed height ([b616a32](https://gitlab.com/Hedzer/snice/commit/b616a320fe001dad5369f0fbfec0ab4968b11289))
* use popover API for split-button menu with position fallback ([a5ccfa0](https://gitlab.com/Hedzer/snice/commit/a5ccfa0bb28ee91ea3768c6dd79e53b8cc75d778))


### Features

* add 33 new components (combobox, icon, tag, form-layout, range-slider, etc.) ([de8cd1e](https://gitlab.com/Hedzer/snice/commit/de8cd1e8fc9f42cc31091ba9064e8dcea3fe7342))
* add avatar trigger demo to menu showcase ([e830037](https://gitlab.com/Hedzer/snice/commit/e83003777a533d21a74eb1341f1bc650e3a6fa87))
* add block variant to radio component with description and suffix slot ([32cd1c4](https://gitlab.com/Hedzer/snice/commit/32cd1c4efe3733da3d5aae1bc4631de74c41a40f))
* add build-deploy.js for stamped deploy artifact in dist/site/ ([2c7ed59](https://gitlab.com/Hedzer/snice/commit/2c7ed59669dd793447b5ff743c8a6f40b56da63a))
* add custom icon prop and slot to notification-center, use themed hover color ([a9abcf4](https://gitlab.com/Hedzer/snice/commit/a9abcf44d448c9f424f29f360f35f05dc6e5bd9b))
* add date-range-picker component ([2754344](https://gitlab.com/Hedzer/snice/commit/27543449b333d77f9c83126940d7274790de9645))
* add date-range-picker React adapter ([37773bd](https://gitlab.com/Hedzer/snice/commit/37773bdb034d61cb881dffa4bb39ab65403474d0))
* add demo pages for 25 components ([2dacbd8](https://gitlab.com/Hedzer/snice/commit/2dacbd8ecb9b8234be239a25521d280218e50e4b))
* add demo.html files for existing components ([7bcfee3](https://gitlab.com/Hedzer/snice/commit/7bcfee3b8db4073a5562e624af20c2765d409731))
* add drawer-target element, simplify push-content logic ([ce47909](https://gitlab.com/Hedzer/snice/commit/ce479094c18f2ec94e460c0d73495f20d69e02fc))
* add elevated variant to accordion component ([7167139](https://gitlab.com/Hedzer/snice/commit/7167139a65b723a0dc4e48a2e551811198da8956))
* add get-next-version script for prerelease version sync ([3b737b1](https://gitlab.com/Hedzer/snice/commit/3b737b178087e88ac02ec7c48a0a45418078a5b1))
* add icon placement examples to button showcase ([988b940](https://gitlab.com/Hedzer/snice/commit/988b94057f30527c1a5250720f1f344563765733))
* add icon property validation to MCP code validator ([8d2588d](https://gitlab.com/Hedzer/snice/commit/8d2588d4e9adcc66a825c19ce0a7de7a62691ba6))
* add key-value component with kv-pair child element ([a752706](https://gitlab.com/Hedzer/snice/commit/a752706479bba9a86cd102dc4ec60e8f0d7f3320))
* add new cell types, refine table layout and sub-module integration ([f331d11](https://gitlab.com/Hedzer/snice/commit/f331d11fef04cc89aa486fb5d0b8bc7668ea6998))
* add react adapters for 33 new components, code-block format prop ([3b6e339](https://gitlab.com/Hedzer/snice/commit/3b6e33927f347095919029f48127ed2005e84113))
* add select remote search with debounce ([cd3eaa4](https://gitlab.com/Hedzer/snice/commit/cd3eaa464a2d9a9cec4d616d53d36140a8e391f5))
* add size, loading, and clearable props to time-picker ([028008b](https://gitlab.com/Hedzer/snice/commit/028008b320fad2c85a8b456ca0de356a93758966))
* add size, loading, clearable, year picker view to date-time-picker ([59097ca](https://gitlab.com/Hedzer/snice/commit/59097cabf7414976a9dadf94884490b15933a5a5))
* add split-button loading, outline, pill, and icon support ([cba6fe5](https://gitlab.com/Hedzer/snice/commit/cba6fe52cdc45334c46bf87d63c315acc9f23ac6))
* add table pagination with client and server modes ([04b35ca](https://gitlab.com/Hedzer/snice/commit/04b35ca7e270801c35db89ef797f168cc7209240))
* add table state-change events and column menu filter action ([f1a7c38](https://gitlab.com/Hedzer/snice/commit/f1a7c385376dbc12ebf2f84359d0aa34fd668ac6))
* add table sub-modules for column menu, master-detail, row DnD, toolbar, tree data ([44217da](https://gitlab.com/Hedzer/snice/commit/44217da65026811a72c91a26d3150d9e7ebc4274))
* add table sub-modules for virtualization, columns, filtering, editing, keyboard, export ([6fe8eb0](https://gitlab.com/Hedzer/snice/commit/6fe8eb07182ec0d9797ab5c6a67c1e390a3e4dcc))
* add themes page with preset picker and custom CSS editor ([49ea6d4](https://gitlab.com/Hedzer/snice/commit/49ea6d4c77d0370cfa3c99b4295b4aa3cd42a935))
* add website showcases for 33 new components ([efbb6cb](https://gitlab.com/Hedzer/snice/commit/efbb6cb631fab4df58ebf48a3458f7402b047dbb))
* add WIP component exclusion system for in-progress builds ([b22c3d5](https://gitlab.com/Hedzer/snice/commit/b22c3d5ac33148aa9f1c51bdba282853b3151735))
* add xl/2xl sizes and custom icon size CSS variable to app-tiles ([888fe5f](https://gitlab.com/Hedzer/snice/commit/888fe5f985f7fbca3e1c44461eefea8bd3abd6ee))
* add xl/2xl sizes to app-tiles, document custom icon size variable ([81dd5cc](https://gitlab.com/Hedzer/snice/commit/81dd5cccdd21b9b00b85c46bc588722464750043))
* add year picker view to date-picker ([3c1e132](https://gitlab.com/Hedzer/snice/commit/3c1e132b2b71245e22ab69c72e731e2abdcb7f4d))
* align cell-tag tokens with chip, add boolean color indicators ([4ac6e0f](https://gitlab.com/Hedzer/snice/commit/4ac6e0f9a24624567b4cf9dca539734995643373))
* animated master-detail collapse with transition ([83000e6](https://gitlab.com/Hedzer/snice/commit/83000e65647898a44706e96459e9dd596c0f4182))
* animated tree toggles and master-detail expand/collapse ([49f8b88](https://gitlab.com/Hedzer/snice/commit/49f8b88e39307bc740129c2f8571699154a1b71d))
* avatar-group dual API (slot + imperative), avatar CSS token fixes ([9f62161](https://gitlab.com/Hedzer/snice/commit/9f6216172c001f0ae4233eec99c63d7296a0d425))
* boolean cell SVG check/cross symbols with color classes ([9d648e4](https://gitlab.com/Hedzer/snice/commit/9d648e4c2a40eacfb72d6cba8f3b00a40a3bf0a4))
* code-block theme property and CSS improvements ([9aeb062](https://gitlab.com/Hedzer/snice/commit/9aeb062ff1069b0ef7ee783abe07a996cf50ebe7))
* createElement cell rendering, filter-aware select-all, column menu opens filter modal ([d94fd3a](https://gitlab.com/Hedzer/snice/commit/d94fd3a1660671ed103a217682be0ba1fd00a2b2))
* drawer inline mode, responsive breakpoint, no-header/no-footer options ([e253749](https://gitlab.com/Hedzer/snice/commit/e253749dd90ad599d247efa65d503d947d833963))
* estimate/receipt/work-order QR codes, terms, logo slots, part attributes ([c8e64dc](https://gitlab.com/Hedzer/snice/commit/c8e64dcf01665519ed63beb051e79345059c09e1))
* expand themes page preview with more component coverage and zoom ([747da3f](https://gitlab.com/Hedzer/snice/commit/747da3fa9354a68496f40ca0dd98ac43406e1a38))
* filter modal accepts preset column from column menu ([cc3229e](https://gitlab.com/Hedzer/snice/commit/cc3229e56013eb8d17c8bf3af1b231ef330e1925))
* filter rows use snice-badge for removal instead of absolute-positioned button ([281e7df](https://gitlab.com/Hedzer/snice/commit/281e7dfc0e2d903b39aa6fe6cb70caeb023fc7a7))
* fixed table layout, transparent header filter borders, tree text-click toggle, pass filters to controller ([1b560a9](https://gitlab.com/Hedzer/snice/commit/1b560a950d5157064a683c6658dd23981d12919b))
* fullscreen mode, toolbar menu styles, tree child animation, CSS token fallbacks ([09acd22](https://gitlab.com/Hedzer/snice/commit/09acd229c8d531a43a66f95bb41b44876c40a1a0))
* import modal/empty-state, toolbar padding fix, empty state slot, remove tree-child animation ([751c460](https://gitlab.com/Hedzer/snice/commit/751c460f9889f2470b11152f3f88aacde5a2f3ed))
* inject theme bootstrap into all full-showcase.html files ([6516699](https://gitlab.com/Hedzer/snice/commit/65166997775858553d0949f26ec3f6bc0fa7c6a5))
* integrate column menu, master-detail, row/column reorder, toolbar, tree data, lazy loading ([8aecb1e](https://gitlab.com/Hedzer/snice/commit/8aecb1e7891fe3eac0fac82e01b5faea32301186))
* integrate table sub-modules with column resize, editing, filtering, density, and virtualization ([ecbe8d2](https://gitlab.com/Hedzer/snice/commit/ecbe8d2704ca2d2cb1383355412c1aea1f68b85a))
* leaderboard dual API with snice-leaderboard-entry child element ([58b18b9](https://gitlab.com/Hedzer/snice/commit/58b18b91f8082b6f704d8ac301a8d8d465365fae))
* product-card variants, wishlist, badges, compare, quick-view ([b2f8718](https://gitlab.com/Hedzer/snice/commit/b2f8718877696f7e94b5ceb10d03b2157b069a33))
* progress cell per-row color override and auto-colorize by value ([f929083](https://gitlab.com/Hedzer/snice/commit/f9290833efc4425514a98a1bfd637142e1088a3f))
* react adapter updates for new props, add key-value adapter ([343d7cc](https://gitlab.com/Hedzer/snice/commit/343d7cc405bced8fa0fc763d4b7f240d3ddbbb1b))
* refine toolbar modal layout, stacked filter rows, text variant buttons ([3020d71](https://gitlab.com/Hedzer/snice/commit/3020d7133ac64720d69ff11b5000ee9b3e3e4e07))
* select allowFreeText, table client-side sort, range-slider layout fix ([8306f86](https://gitlab.com/Hedzer/snice/commit/8306f8666b46fb57b8dea63f6e26975b87cd07f0))
* sparkline supports per-row color via object value format ([4e69d33](https://gitlab.com/Hedzer/snice/commit/4e69d33be9651c64fe2fd91c2246d37900bb342d))
* SVG sort indicators, use public filter/sort API from toolbar ([2e6d6e1](https://gitlab.com/Hedzer/snice/commit/2e6d6e1aedfc8c2a7eeb731e41f9e430585540e4))
* sync React adapters with latest select, split-button, table properties ([9b3c811](https://gitlab.com/Hedzer/snice/commit/9b3c811a4af1fd49150b3f42fcbe2dbb4a0ffbe3))
* table frame layout, super-header slot, toolbar refinements, sub-module fixes ([1e16f30](https://gitlab.com/Hedzer/snice/commit/1e16f3021f0acc71bde1d7303d5347bdfe151620))
* toolbar icon buttons, sort toggle, density cycling ([580e61f](https://gitlab.com/Hedzer/snice/commit/580e61f65c7f65397eaf81ec4e2f9e617073f1a9))
* toolbar modals use snice-select, snice-input, snice-button throughout ([03ca2d5](https://gitlab.com/Hedzer/snice/commit/03ca2d56eff93083c63d6ea41d2e5388402bc087))
* toolbar sort/filter panels with full operator parity, fullscreen button ([4e49251](https://gitlab.com/Hedzer/snice/commit/4e49251d7099a7bb18fe0d8e8cdfb00eb3906fff))
* toolbar sort/filter use snice-modal with multi-row filter builder ([f4e5dfb](https://gitlab.com/Hedzer/snice/commit/f4e5dfb09788227c866f5bdf12c3e265d0442490))
* unified More panel with Docs + Full Showcase tabs ([84b6532](https://gitlab.com/Hedzer/snice/commit/84b653206f18816864b706e19d24df5fe339397b))
* update React adapters for time-picker, date-time-picker, and markdown ([4204bc5](https://gitlab.com/Hedzer/snice/commit/4204bc5aa921da2de4702760c8a0cdd95b164bf4))
* use popover API for menu panel with position fallback ([c0d2ea3](https://gitlab.com/Hedzer/snice/commit/c0d2ea31c23f5aa188b36d57f2cd4d8590ea4bcf))
* use popover API for picker calendar/dropdown panels ([ac617fb](https://gitlab.com/Hedzer/snice/commit/ac617fb82151c41ffd69d29a8975bacce599a862))

# [4.19.0](https://gitlab.com/Hedzer/snice/compare/v4.18.0...v4.19.0) (2026-03-08)


### Bug Fixes

* activity-feed hover/focus on content area, alert variant colors ([f480592](https://gitlab.com/Hedzer/snice/commit/f480592c7e6300a3e59918dcaf4e1e2bb4ceb3df))
* add attribute: false to complex Array/Object properties ([e4c6085](https://gitlab.com/Hedzer/snice/commit/e4c608528e4ba5eade062d6fc067db6eba782ff4))
* add box-sizing border-box to radio block variant wrapper ([e2d179f](https://gitlab.com/Hedzer/snice/commit/e2d179f5b44cc02e107bbad879efad0aaac1fbbe))
* add compact mode for checkbox sizing ([4d5859e](https://gitlab.com/Hedzer/snice/commit/4d5859edf858331d84405aa10dc5bdfc5e9c8b57))
* apply column width to DOM immediately during resize drag ([e138825](https://gitlab.com/Hedzer/snice/commit/e138825c94d12a7944d35b5080df772ae5acafac))
* badge, chip, tag, tag-input CSS refinements ([bd51a51](https://gitlab.com/Hedzer/snice/commit/bd51a515750e1ae577894a953b23101dc177bddd))
* buffer setHTML calls before doc editor is initialized ([bd7fb59](https://gitlab.com/Hedzer/snice/commit/bd7fb59bfceeff2f7ebe154bd18233d14da218ab))
* clamp step-input value on programmatic change ([994758e](https://gitlab.com/Hedzer/snice/commit/994758ed2665ae6fa1105d69f5751348288d8174))
* clean up drawer CSS ([498cee9](https://gitlab.com/Hedzer/snice/commit/498cee99bb18fff8deb66930c7740e099b58ec04))
* column menu outside-click uses composedPath for shadow DOM ([2846fa4](https://gitlab.com/Hedzer/snice/commit/2846fa414700952471e67c6de0d5b5fb8d499853))
* component CSS layout and sizing adjustments ([e28968f](https://gitlab.com/Hedzer/snice/commit/e28968ff4e176f57c17efec622bc0f14c24396da))
* countdown restarts timer on target change, use conditional template ([4ff8148](https://gitlab.com/Hedzer/snice/commit/4ff8148aeb1c8fff6d4e744f7210840fb9812d76))
* date-range-picker cursor styles and graduate from WIP ([0101035](https://gitlab.com/Hedzer/snice/commit/0101035c92ec76a8c0a8678c2ff408fac66abb78))
* defer drawer push-content transform to next frame for computed CSS vars ([e2b1c47](https://gitlab.com/Hedzer/snice/commit/e2b1c47e85356588e914c183d0ad3efea15ec4cd))
* derive tag variant backgrounds with color-mix from theme tokens ([3a56670](https://gitlab.com/Hedzer/snice/commit/3a56670df7ba1f354af5fda31e02ea6b8107614b))
* doc component types, tree querySelector scope ([4ccf589](https://gitlab.com/Hedzer/snice/commit/4ccf58903b204f02c223cb037d88a5ae91a2efb7))
* drawer component updates ([2c5c3a9](https://gitlab.com/Hedzer/snice/commit/2c5c3a93db53c5b4dc1b84589a526bf1e3bc3769))
* drawer contained overflow, persistent close guard, skip focus trap for contained ([91e4c79](https://gitlab.com/Hedzer/snice/commit/91e4c796770c7a67bc1d6e4babd89e1f8d79fbce))
* drawer push mode applies correct margin for right and bottom positions ([0fa28c0](https://gitlab.com/Hedzer/snice/commit/0fa28c05b82a3b1b6cb673abce7e5e201da4b1a1))
* gate duplicate-registration warning behind SNICE_DEBUG flag ([451e113](https://gitlab.com/Hedzer/snice/commit/451e11363e1609db381d3465ded5f3ef5bf564e7))
* handle all import patterns in showcase transform, fix cache headers ([f315ca8](https://gitlab.com/Hedzer/snice/commit/f315ca80c50b771e0af78bde3aae5f041f81a8c6))
* increase input icon slot size and padding ([685d0b9](https://gitlab.com/Hedzer/snice/commit/685d0b9628ba46050b6b6b8efd81e16c8f080416))
* make tooltip background and color themeable via CSS custom properties ([e8dadd0](https://gitlab.com/Hedzer/snice/commit/e8dadd026c448a0b81f53e4810d682ad3e252771))
* menu demo open by default with avatar src, add hash scroll to footer ([5cd0cd0](https://gitlab.com/Hedzer/snice/commit/5cd0cd0ac8c19b93e37e72e795bcde308932876c))
* move setToolbar after render to ensure container exists ([0d82d1f](https://gitlab.com/Hedzer/snice/commit/0d82d1fd482963f1b2642a7555e52f108d452af7))
* pre-strip script/style tags in markdown sanitizer, make renderedHtml reactive ([dbafa81](https://gitlab.com/Hedzer/snice/commit/dbafa81300d40a2fc9cfef06521fd721da1f2c47))
* product-card border-radius on gallery, spacing adjustments, remove overflow hidden ([ed0e372](https://gitlab.com/Hedzer/snice/commit/ed0e3722c84d2c5cb42a7da36902890a3049092d))
* product-card gallery controls use theme background instead of hardcoded white ([dbfd687](https://gitlab.com/Hedzer/snice/commit/dbfd68754a90903a1a98ca05d1768fd745c31cd3))
* product-card spacing for compact and grid variants ([36aa179](https://gitlab.com/Hedzer/snice/commit/36aa1796430e9c49f76d8c3e3d35461e1918ebb7))
* receipt thermal variant text colors ([2ccb1bc](https://gitlab.com/Hedzer/snice/commit/2ccb1bcd9c384be94e41c1262c618ba88d615710))
* remove contain layout style paint from component host styles ([8e30239](https://gitlab.com/Hedzer/snice/commit/8e3023937ffed26a0912af87db280f436005eb22))
* remove dark mode icon invert hack from app-tiles ([1996445](https://gitlab.com/Hedzer/snice/commit/199644592d9958ff8f022bb9be3bc792e774d5d2))
* replace fadeInUp with fadeIn to prevent transform containing block trapping fixed children ([03ff6ea](https://gitlab.com/Hedzer/snice/commit/03ff6eae971cef47ed0a1f46a3651c91a259e0db))
* restore immediate master-detail collapse, remove broken animation ([fe5f5e8](https://gitlab.com/Hedzer/snice/commit/fe5f5e8e03ef0181d0f17eb0b673a29556a92616))
* serve public/index.html at root in dev server ([3446451](https://gitlab.com/Hedzer/snice/commit/3446451eb9361beb4a325f75fd8a98c860d27834))
* showcase cell-type grid color token fallbacks ([7396d16](https://gitlab.com/Hedzer/snice/commit/7396d161252929168553e65a4808ae95a31fa12e))
* sidebar scroll-spy highlights topmost visible section ([3344df2](https://gitlab.com/Hedzer/snice/commit/3344df2754359058452b5325ebcab6ff94e7e8ca))
* split-button hover uses background-hover token ([d892f42](https://gitlab.com/Hedzer/snice/commit/d892f424b2366a715c4475db92ffd528ec22e330))
* standardize form field heights, labels, and alignment across controls ([12d3460](https://gitlab.com/Hedzer/snice/commit/12d34605cb58b56644c7b2786ec682d838de1948))
* sync theme to showcase iframe, escape HTML in inline code and table pipes ([2808175](https://gitlab.com/Hedzer/snice/commit/28081756d8ae7d816f46929ef2c6ff4be928c43e))
* themes page layout order, use overflow-x clip, remove redundant heading ([d15bfa1](https://gitlab.com/Hedzer/snice/commit/d15bfa14b7e784cd8d40345aee309a4f34fb2ec2))
* tooltip repositions on scroll and resize ([03f8e1b](https://gitlab.com/Hedzer/snice/commit/03f8e1bae3fbabbac0dfece8309c417cde546d16))
* update tests for camera-annotate, cart, and countdown ([1085af7](https://gitlab.com/Hedzer/snice/commit/1085af7449c2174ea383ed87dc247dfee93dde07))
* use aspect-ratio for calendar day cells instead of fixed height ([b616a32](https://gitlab.com/Hedzer/snice/commit/b616a320fe001dad5369f0fbfec0ab4968b11289))
* use popover API for split-button menu with position fallback ([a5ccfa0](https://gitlab.com/Hedzer/snice/commit/a5ccfa0bb28ee91ea3768c6dd79e53b8cc75d778))


### Features

* add 33 new components (combobox, icon, tag, form-layout, range-slider, etc.) ([de8cd1e](https://gitlab.com/Hedzer/snice/commit/de8cd1e8fc9f42cc31091ba9064e8dcea3fe7342))
* add avatar trigger demo to menu showcase ([e830037](https://gitlab.com/Hedzer/snice/commit/e83003777a533d21a74eb1341f1bc650e3a6fa87))
* add block variant to radio component with description and suffix slot ([32cd1c4](https://gitlab.com/Hedzer/snice/commit/32cd1c4efe3733da3d5aae1bc4631de74c41a40f))
* add build-deploy.js for stamped deploy artifact in dist/site/ ([2c7ed59](https://gitlab.com/Hedzer/snice/commit/2c7ed59669dd793447b5ff743c8a6f40b56da63a))
* add custom icon prop and slot to notification-center, use themed hover color ([a9abcf4](https://gitlab.com/Hedzer/snice/commit/a9abcf44d448c9f424f29f360f35f05dc6e5bd9b))
* add date-range-picker component ([2754344](https://gitlab.com/Hedzer/snice/commit/27543449b333d77f9c83126940d7274790de9645))
* add date-range-picker React adapter ([37773bd](https://gitlab.com/Hedzer/snice/commit/37773bdb034d61cb881dffa4bb39ab65403474d0))
* add demo pages for 25 components ([2dacbd8](https://gitlab.com/Hedzer/snice/commit/2dacbd8ecb9b8234be239a25521d280218e50e4b))
* add demo.html files for existing components ([7bcfee3](https://gitlab.com/Hedzer/snice/commit/7bcfee3b8db4073a5562e624af20c2765d409731))
* add drawer-target element, simplify push-content logic ([ce47909](https://gitlab.com/Hedzer/snice/commit/ce479094c18f2ec94e460c0d73495f20d69e02fc))
* add elevated variant to accordion component ([7167139](https://gitlab.com/Hedzer/snice/commit/7167139a65b723a0dc4e48a2e551811198da8956))
* add icon placement examples to button showcase ([988b940](https://gitlab.com/Hedzer/snice/commit/988b94057f30527c1a5250720f1f344563765733))
* add icon property validation to MCP code validator ([8d2588d](https://gitlab.com/Hedzer/snice/commit/8d2588d4e9adcc66a825c19ce0a7de7a62691ba6))
* add key-value component with kv-pair child element ([a752706](https://gitlab.com/Hedzer/snice/commit/a752706479bba9a86cd102dc4ec60e8f0d7f3320))
* add new cell types, refine table layout and sub-module integration ([f331d11](https://gitlab.com/Hedzer/snice/commit/f331d11fef04cc89aa486fb5d0b8bc7668ea6998))
* add react adapters for 33 new components, code-block format prop ([3b6e339](https://gitlab.com/Hedzer/snice/commit/3b6e33927f347095919029f48127ed2005e84113))
* add select remote search with debounce ([cd3eaa4](https://gitlab.com/Hedzer/snice/commit/cd3eaa464a2d9a9cec4d616d53d36140a8e391f5))
* add size, loading, and clearable props to time-picker ([028008b](https://gitlab.com/Hedzer/snice/commit/028008b320fad2c85a8b456ca0de356a93758966))
* add size, loading, clearable, year picker view to date-time-picker ([59097ca](https://gitlab.com/Hedzer/snice/commit/59097cabf7414976a9dadf94884490b15933a5a5))
* add split-button loading, outline, pill, and icon support ([cba6fe5](https://gitlab.com/Hedzer/snice/commit/cba6fe52cdc45334c46bf87d63c315acc9f23ac6))
* add table pagination with client and server modes ([04b35ca](https://gitlab.com/Hedzer/snice/commit/04b35ca7e270801c35db89ef797f168cc7209240))
* add table state-change events and column menu filter action ([f1a7c38](https://gitlab.com/Hedzer/snice/commit/f1a7c385376dbc12ebf2f84359d0aa34fd668ac6))
* add table sub-modules for column menu, master-detail, row DnD, toolbar, tree data ([44217da](https://gitlab.com/Hedzer/snice/commit/44217da65026811a72c91a26d3150d9e7ebc4274))
* add table sub-modules for virtualization, columns, filtering, editing, keyboard, export ([6fe8eb0](https://gitlab.com/Hedzer/snice/commit/6fe8eb07182ec0d9797ab5c6a67c1e390a3e4dcc))
* add themes page with preset picker and custom CSS editor ([49ea6d4](https://gitlab.com/Hedzer/snice/commit/49ea6d4c77d0370cfa3c99b4295b4aa3cd42a935))
* add website showcases for 33 new components ([efbb6cb](https://gitlab.com/Hedzer/snice/commit/efbb6cb631fab4df58ebf48a3458f7402b047dbb))
* add WIP component exclusion system for in-progress builds ([b22c3d5](https://gitlab.com/Hedzer/snice/commit/b22c3d5ac33148aa9f1c51bdba282853b3151735))
* add xl/2xl sizes and custom icon size CSS variable to app-tiles ([888fe5f](https://gitlab.com/Hedzer/snice/commit/888fe5f985f7fbca3e1c44461eefea8bd3abd6ee))
* add xl/2xl sizes to app-tiles, document custom icon size variable ([81dd5cc](https://gitlab.com/Hedzer/snice/commit/81dd5cccdd21b9b00b85c46bc588722464750043))
* add year picker view to date-picker ([3c1e132](https://gitlab.com/Hedzer/snice/commit/3c1e132b2b71245e22ab69c72e731e2abdcb7f4d))
* align cell-tag tokens with chip, add boolean color indicators ([4ac6e0f](https://gitlab.com/Hedzer/snice/commit/4ac6e0f9a24624567b4cf9dca539734995643373))
* animated master-detail collapse with transition ([83000e6](https://gitlab.com/Hedzer/snice/commit/83000e65647898a44706e96459e9dd596c0f4182))
* animated tree toggles and master-detail expand/collapse ([49f8b88](https://gitlab.com/Hedzer/snice/commit/49f8b88e39307bc740129c2f8571699154a1b71d))
* avatar-group dual API (slot + imperative), avatar CSS token fixes ([9f62161](https://gitlab.com/Hedzer/snice/commit/9f6216172c001f0ae4233eec99c63d7296a0d425))
* boolean cell SVG check/cross symbols with color classes ([9d648e4](https://gitlab.com/Hedzer/snice/commit/9d648e4c2a40eacfb72d6cba8f3b00a40a3bf0a4))
* code-block theme property and CSS improvements ([9aeb062](https://gitlab.com/Hedzer/snice/commit/9aeb062ff1069b0ef7ee783abe07a996cf50ebe7))
* createElement cell rendering, filter-aware select-all, column menu opens filter modal ([d94fd3a](https://gitlab.com/Hedzer/snice/commit/d94fd3a1660671ed103a217682be0ba1fd00a2b2))
* drawer inline mode, responsive breakpoint, no-header/no-footer options ([e253749](https://gitlab.com/Hedzer/snice/commit/e253749dd90ad599d247efa65d503d947d833963))
* estimate/receipt/work-order QR codes, terms, logo slots, part attributes ([c8e64dc](https://gitlab.com/Hedzer/snice/commit/c8e64dcf01665519ed63beb051e79345059c09e1))
* expand themes page preview with more component coverage and zoom ([747da3f](https://gitlab.com/Hedzer/snice/commit/747da3fa9354a68496f40ca0dd98ac43406e1a38))
* filter modal accepts preset column from column menu ([cc3229e](https://gitlab.com/Hedzer/snice/commit/cc3229e56013eb8d17c8bf3af1b231ef330e1925))
* filter rows use snice-badge for removal instead of absolute-positioned button ([281e7df](https://gitlab.com/Hedzer/snice/commit/281e7dfc0e2d903b39aa6fe6cb70caeb023fc7a7))
* fixed table layout, transparent header filter borders, tree text-click toggle, pass filters to controller ([1b560a9](https://gitlab.com/Hedzer/snice/commit/1b560a950d5157064a683c6658dd23981d12919b))
* fullscreen mode, toolbar menu styles, tree child animation, CSS token fallbacks ([09acd22](https://gitlab.com/Hedzer/snice/commit/09acd229c8d531a43a66f95bb41b44876c40a1a0))
* import modal/empty-state, toolbar padding fix, empty state slot, remove tree-child animation ([751c460](https://gitlab.com/Hedzer/snice/commit/751c460f9889f2470b11152f3f88aacde5a2f3ed))
* inject theme bootstrap into all full-showcase.html files ([6516699](https://gitlab.com/Hedzer/snice/commit/65166997775858553d0949f26ec3f6bc0fa7c6a5))
* integrate column menu, master-detail, row/column reorder, toolbar, tree data, lazy loading ([8aecb1e](https://gitlab.com/Hedzer/snice/commit/8aecb1e7891fe3eac0fac82e01b5faea32301186))
* integrate table sub-modules with column resize, editing, filtering, density, and virtualization ([ecbe8d2](https://gitlab.com/Hedzer/snice/commit/ecbe8d2704ca2d2cb1383355412c1aea1f68b85a))
* leaderboard dual API with snice-leaderboard-entry child element ([58b18b9](https://gitlab.com/Hedzer/snice/commit/58b18b91f8082b6f704d8ac301a8d8d465365fae))
* product-card variants, wishlist, badges, compare, quick-view ([b2f8718](https://gitlab.com/Hedzer/snice/commit/b2f8718877696f7e94b5ceb10d03b2157b069a33))
* progress cell per-row color override and auto-colorize by value ([f929083](https://gitlab.com/Hedzer/snice/commit/f9290833efc4425514a98a1bfd637142e1088a3f))
* react adapter updates for new props, add key-value adapter ([343d7cc](https://gitlab.com/Hedzer/snice/commit/343d7cc405bced8fa0fc763d4b7f240d3ddbbb1b))
* refine toolbar modal layout, stacked filter rows, text variant buttons ([3020d71](https://gitlab.com/Hedzer/snice/commit/3020d7133ac64720d69ff11b5000ee9b3e3e4e07))
* select allowFreeText, table client-side sort, range-slider layout fix ([8306f86](https://gitlab.com/Hedzer/snice/commit/8306f8666b46fb57b8dea63f6e26975b87cd07f0))
* sparkline supports per-row color via object value format ([4e69d33](https://gitlab.com/Hedzer/snice/commit/4e69d33be9651c64fe2fd91c2246d37900bb342d))
* SVG sort indicators, use public filter/sort API from toolbar ([2e6d6e1](https://gitlab.com/Hedzer/snice/commit/2e6d6e1aedfc8c2a7eeb731e41f9e430585540e4))
* table frame layout, super-header slot, toolbar refinements, sub-module fixes ([1e16f30](https://gitlab.com/Hedzer/snice/commit/1e16f3021f0acc71bde1d7303d5347bdfe151620))
* toolbar icon buttons, sort toggle, density cycling ([580e61f](https://gitlab.com/Hedzer/snice/commit/580e61f65c7f65397eaf81ec4e2f9e617073f1a9))
* toolbar modals use snice-select, snice-input, snice-button throughout ([03ca2d5](https://gitlab.com/Hedzer/snice/commit/03ca2d56eff93083c63d6ea41d2e5388402bc087))
* toolbar sort/filter panels with full operator parity, fullscreen button ([4e49251](https://gitlab.com/Hedzer/snice/commit/4e49251d7099a7bb18fe0d8e8cdfb00eb3906fff))
* toolbar sort/filter use snice-modal with multi-row filter builder ([f4e5dfb](https://gitlab.com/Hedzer/snice/commit/f4e5dfb09788227c866f5bdf12c3e265d0442490))
* unified More panel with Docs + Full Showcase tabs ([84b6532](https://gitlab.com/Hedzer/snice/commit/84b653206f18816864b706e19d24df5fe339397b))
* update React adapters for time-picker, date-time-picker, and markdown ([4204bc5](https://gitlab.com/Hedzer/snice/commit/4204bc5aa921da2de4702760c8a0cdd95b164bf4))
* use popover API for menu panel with position fallback ([c0d2ea3](https://gitlab.com/Hedzer/snice/commit/c0d2ea31c23f5aa188b36d57f2cd4d8590ea4bcf))
* use popover API for picker calendar/dropdown panels ([ac617fb](https://gitlab.com/Hedzer/snice/commit/ac617fb82151c41ffd69d29a8975bacce599a862))

# [4.25.0](https://gitlab.com/Hedzer/snice/compare/v4.24.1...v4.25.0) (2026-03-06)


### Bug Fixes

* drawer push mode applies correct margin for right and bottom positions ([baa5b0c](https://gitlab.com/Hedzer/snice/commit/baa5b0cead52465ecf9ad06d40fcd834d4f9e9a5))
* increase input icon slot size and padding ([a99ceb0](https://gitlab.com/Hedzer/snice/commit/a99ceb0bc31a9703dc71e1696983e2c46a7c17bd))
* remove contain layout style paint from component host styles ([8a7da82](https://gitlab.com/Hedzer/snice/commit/8a7da82a95b6a8d336f4470174c08aeedf58e1ef))
* replace fadeInUp with fadeIn to prevent transform containing block trapping fixed children ([6cd3ac3](https://gitlab.com/Hedzer/snice/commit/6cd3ac36c43f38586fdc50c9e1d26145db790c82))


### Features

* add icon property validation to MCP code validator ([09c769e](https://gitlab.com/Hedzer/snice/commit/09c769ee6a8ecd0a27a7a0eef8ea4b8dec6ccc2c))

## [4.24.1](https://gitlab.com/Hedzer/snice/compare/v4.24.0...v4.24.1) (2026-03-05)


### Bug Fixes

* add box-sizing border-box to radio block variant wrapper ([0d0d0e5](https://gitlab.com/Hedzer/snice/commit/0d0d0e5a50bdf113392b6a7a34707dba2b726a33))

# [4.24.0](https://gitlab.com/Hedzer/snice/compare/v4.23.0...v4.24.0) (2026-03-05)


### Features

* add block variant to radio component with description and suffix slot ([60c689c](https://gitlab.com/Hedzer/snice/commit/60c689c0a8d83d8a7f0af502c74d98d3fe89b868))

# [4.23.0](https://gitlab.com/Hedzer/snice/compare/v4.22.0...v4.23.0) (2026-03-05)

# [4.22.0](https://gitlab.com/Hedzer/snice/compare/v4.21.0...v4.22.0) (2026-03-05)


### Bug Fixes

* product-card border-radius on gallery, spacing adjustments, remove overflow hidden ([519bf0a](https://gitlab.com/Hedzer/snice/commit/519bf0a9a70c2f6185e39ce64cf6230dc3353eff))
* product-card gallery controls use theme background instead of hardcoded white ([d8d16a7](https://gitlab.com/Hedzer/snice/commit/d8d16a757bec60e7e832c1b091cf7e873934cb91))
* sidebar scroll-spy highlights topmost visible section ([39cea50](https://gitlab.com/Hedzer/snice/commit/39cea50f5c5684d77f9a24d9c7c790e6151d8bc6))


### Features

* drawer inline mode, responsive breakpoint, no-header/no-footer options ([a9d7430](https://gitlab.com/Hedzer/snice/commit/a9d7430306248ffd3e98aa451d9a61fd2a42af4c))

# [4.21.0](https://gitlab.com/Hedzer/snice/compare/v4.20.1...v4.21.0) (2026-03-04)


### Features

* add custom icon prop and slot to notification-center, use themed hover color ([901c569](https://gitlab.com/Hedzer/snice/commit/901c5690c74c544a64c5bfa3fb70a04c3314f7d0))
* add xl/2xl sizes and custom icon size CSS variable to app-tiles ([c732f9d](https://gitlab.com/Hedzer/snice/commit/c732f9df379e7c7ead202163e79704c26d687e60))
* add xl/2xl sizes to app-tiles, document custom icon size variable ([4c5660e](https://gitlab.com/Hedzer/snice/commit/4c5660e917d9f5c8b3d159eeffd20c6e896e5251))

## [4.20.1](https://gitlab.com/Hedzer/snice/compare/v4.20.0...v4.20.1) (2026-03-03)


### Bug Fixes

* remove dark mode icon invert hack from app-tiles ([bdb3da3](https://gitlab.com/Hedzer/snice/commit/bdb3da3d9c32041a9562dfc6a1edc526bb1facb9))

# [4.20.0](https://gitlab.com/Hedzer/snice/compare/v4.19.0...v4.20.0) (2026-03-03)


### Bug Fixes

* menu demo open by default with avatar src, add hash scroll to footer ([64efc92](https://gitlab.com/Hedzer/snice/commit/64efc9223939bc19972e7459c42b62475f556465))


### Features

* add avatar trigger demo to menu showcase ([fbcd213](https://gitlab.com/Hedzer/snice/commit/fbcd2131f5eeae02ce6e1642eec9f0690c8614dd))

# [4.19.0](https://gitlab.com/Hedzer/snice/compare/v4.18.0...v4.19.0) (2026-03-03)


### Bug Fixes

* activity-feed hover/focus on content area, alert variant colors ([f480592](https://gitlab.com/Hedzer/snice/commit/f480592c7e6300a3e59918dcaf4e1e2bb4ceb3df))
* add attribute: false to complex Array/Object properties ([2f6459a](https://gitlab.com/Hedzer/snice/commit/2f6459a5cdbe07557607b88385876b0a399e70a3))
* doc component types, tree querySelector scope ([2fab6b2](https://gitlab.com/Hedzer/snice/commit/2fab6b21c38656b4f3db1de9561d26c91fe279e6))
* product-card spacing for compact and grid variants ([bd107c9](https://gitlab.com/Hedzer/snice/commit/bd107c9c6ea9deca499492502852a7e78052318d))
* receipt thermal variant text colors ([c078423](https://gitlab.com/Hedzer/snice/commit/c078423c31684e5fac51dee95e686d85468e196d))
* standardize form field heights, labels, and alignment across controls ([dbf884b](https://gitlab.com/Hedzer/snice/commit/dbf884b679fa16cc070025151f20491f112c19d8))
* themes page layout order, use overflow-x clip, remove redundant heading ([6a319e7](https://gitlab.com/Hedzer/snice/commit/6a319e740c9b40d8e977c4452241eb1293487c90))


### Features

* add 33 new components (combobox, icon, tag, form-layout, range-slider, etc.) ([de8cd1e](https://gitlab.com/Hedzer/snice/commit/de8cd1e8fc9f42cc31091ba9064e8dcea3fe7342))
* add demo pages for 25 components ([ab7fcab](https://gitlab.com/Hedzer/snice/commit/ab7fcaba7d288ebe41fc22517b7562fb968a7131))
* add elevated variant to accordion component ([6c68a48](https://gitlab.com/Hedzer/snice/commit/6c68a4829c2dc69b055b6512f28e10acce8900fe))
* add key-value component with kv-pair child element ([a752706](https://gitlab.com/Hedzer/snice/commit/a752706479bba9a86cd102dc4ec60e8f0d7f3320))
* add react adapters for 33 new components, code-block format prop ([3b6e339](https://gitlab.com/Hedzer/snice/commit/3b6e33927f347095919029f48127ed2005e84113))
* add themes page with preset picker and custom CSS editor ([9d745d8](https://gitlab.com/Hedzer/snice/commit/9d745d8fd2718bec487853bb118a4b9a05270252))
* add website showcases for 33 new components ([efbb6cb](https://gitlab.com/Hedzer/snice/commit/efbb6cb631fab4df58ebf48a3458f7402b047dbb))
* add WIP component exclusion system for in-progress builds ([af5cf27](https://gitlab.com/Hedzer/snice/commit/af5cf278c01ae6733f9fbb9114e09a0574e855fa))
* avatar-group dual API (slot + imperative), avatar CSS token fixes ([9f62161](https://gitlab.com/Hedzer/snice/commit/9f6216172c001f0ae4233eec99c63d7296a0d425))
* code-block theme property and CSS improvements ([9aeb062](https://gitlab.com/Hedzer/snice/commit/9aeb062ff1069b0ef7ee783abe07a996cf50ebe7))
* estimate/receipt/work-order QR codes, terms, logo slots, part attributes ([c8e64dc](https://gitlab.com/Hedzer/snice/commit/c8e64dcf01665519ed63beb051e79345059c09e1))
* expand themes page preview with more component coverage and zoom ([157b8da](https://gitlab.com/Hedzer/snice/commit/157b8da39e54301910eacb7ce750a30d03816b14))
* leaderboard dual API with snice-leaderboard-entry child element ([58b18b9](https://gitlab.com/Hedzer/snice/commit/58b18b91f8082b6f704d8ac301a8d8d465365fae))
* product-card variants, wishlist, badges, compare, quick-view ([b2f8718](https://gitlab.com/Hedzer/snice/commit/b2f8718877696f7e94b5ceb10d03b2157b069a33))
* react adapter updates for new props, add key-value adapter ([343d7cc](https://gitlab.com/Hedzer/snice/commit/343d7cc405bced8fa0fc763d4b7f240d3ddbbb1b))
* select allowFreeText, table client-side sort, range-slider layout fix ([8306f86](https://gitlab.com/Hedzer/snice/commit/8306f8666b46fb57b8dea63f6e26975b87cd07f0))

# [4.18.0](https://gitlab.com/Hedzer/snice/compare/v4.17.0...v4.18.0) (2026-02-27)


### Features

* code-block formatter support, content dedent, paint colorSelects adapter ([b609b9a](https://gitlab.com/Hedzer/snice/commit/b609b9a97a85f3d41599210cbc1d33b8b1d49986))
* declarative grammar-based code formatter engine with embedded format rules ([b6e2db3](https://gitlab.com/Hedzer/snice/commit/b6e2db3057941b3434c89afd6fdd3b027e7a458c))

# [4.17.0](https://gitlab.com/Hedzer/snice/compare/v4.16.0...v4.17.0) (2026-02-27)


### Bug Fixes

* .ready promise now awaits both initial render and all [@ready](https://gitlab.com/ready) handlers ([cd376c0](https://gitlab.com/Hedzer/snice/commit/cd376c049f05cc099fdf8ff84a0cad5b15736de0))


### Features

* add CSS ::part() attributes to accordion, chat, input, login, pagination, tag-input, toast, tooltip ([ff11192](https://gitlab.com/Hedzer/snice/commit/ff11192819bfab0ec2fd6b2dce32bf16fd4a88b4))
* add CSS ::part() attributes to all remaining components ([33fd6e2](https://gitlab.com/Hedzer/snice/commit/33fd6e20ea0b50c89849a360a4da3aa9392d3e1b))
* add docs-verify hook to validate component documentation on edit ([4b3a47a](https://gitlab.com/Hedzer/snice/commit/4b3a47ad5391dd37f430c7150658a7ce11f922df))
* dev orchestration script, standards hook, update design tokens docs ([d85b1b8](https://gitlab.com/Hedzer/snice/commit/d85b1b8e5c1237deac22febe65f71a8f49732a8c))
* input react adapter and docs for align, labelAlign, stretch props ([94ac061](https://gitlab.com/Hedzer/snice/commit/94ac0614a186b461584fbb12bdada139565b6c59))
* paint custom color picker inputs, toolbar slots, color-select event ([6122dec](https://gitlab.com/Hedzer/snice/commit/6122dec59b953ab9dc859121c44533b991f2bf3d))

# [4.16.0](https://gitlab.com/Hedzer/snice/compare/v4.15.0...v4.16.0) (2026-02-26)


### Features

* input align, label-align, and stretch properties for height control ([1acc11d](https://gitlab.com/Hedzer/snice/commit/1acc11dd53444c1e6fe874f357ac1d57903da7db))
* react adapters for doc icons prop, modal no-header/no-footer ([82f583d](https://gitlab.com/Hedzer/snice/commit/82f583d810d12314ef2d9b8216efe33abad43b99))

# [4.15.0](https://gitlab.com/Hedzer/snice/compare/v4.14.0...v4.15.0) (2026-02-26)


### Bug Fixes

* move modals outside comp-section containers, show notification panel open ([9016893](https://gitlab.com/Hedzer/snice/commit/90168934b21f9818eed8844e95582e3d6adcbee1))
* rebuild docs page, re-stamp asset hashes ([605c3bd](https://gitlab.com/Hedzer/snice/commit/605c3bd9241a44640b51c8cf8886cef5b68eb40f))
* switch/case/when/default elements use display:contents ([e446fb0](https://gitlab.com/Hedzer/snice/commit/e446fb02dae9a24bf1e790c194ed0e82e070abb0))


### Features

* attribute-based tooltips via useTooltips() observer ([9950ba4](https://gitlab.com/Hedzer/snice/commit/9950ba4c2f354b02c15c0df1b66c9c0bff77e9cf))
* book page-flip-start/end events, music-player time-update dispatch ([8fb32de](https://gitlab.com/Hedzer/snice/commit/8fb32de3e30ab16e89a147e98f8dd3bd32e5a6c3))
* doc editor icon sets, download/export, markdown conversion, dark mode ([a98e0c7](https://gitlab.com/Hedzer/snice/commit/a98e0c73e49be97e23de6b42162f38dddfe92e09))
* form association and component improvements ([a231d2d](https://gitlab.com/Hedzer/snice/commit/a231d2ddf75925f030efb67cdfaa3ba2fbc7567b))
* modal no-header/no-footer props, notification-center public open prop ([b6e9bbf](https://gitlab.com/Hedzer/snice/commit/b6e9bbfdf8813235151412858003d8c1efa3058c))
* support [@property](https://gitlab.com/property)({ attribute: false }) for internal-only properties ([12456c2](https://gitlab.com/Hedzer/snice/commit/12456c240a43cdf2ed7109fd66fb2f19d071122a))
* switch formAssociated with ElementInternals, table imports column/row ([dab8a1d](https://gitlab.com/Hedzer/snice/commit/dab8a1dc50a3b5e96eb816938b22b4aadec93939))

# [4.14.0](https://gitlab.com/Hedzer/snice/compare/v4.13.0...v4.14.0) (2026-02-24)


### Bug Fixes

* code-block comment color to VS Code green, improve grammar tokenizers ([75eb503](https://gitlab.com/Hedzer/snice/commit/75eb503ffc0727a76b2570e358f2f915a63ac080))
* correct events.ts comment, request timeout default to 120s ([5cb7c59](https://gitlab.com/Hedzer/snice/commit/5cb7c5937420013d6a8eda3014dc5bb079582d46))
* docs content padding, re-stamp asset hashes ([fe0c2dd](https://gitlab.com/Hedzer/snice/commit/fe0c2dd7f1e95cd9eeea5f8dbaff5c20f6c3745a))
* rebuild docs page, re-stamp asset hashes ([0bb08db](https://gitlab.com/Hedzer/snice/commit/0bb08db127bdf632bf0f2d14065bb4b138310959))
* slider host display flex, remove contain that breaks stretch ([6c2845c](https://gitlab.com/Hedzer/snice/commit/6c2845c2ad0fa494b55af7332c3f256e489dd265))


### Features

* add docs page with sidebar navigation, re-stamp assets, link decorators to docs ([eca3fa8](https://gitlab.com/Hedzer/snice/commit/eca3fa81676a156b2fd2787bbdb5985d78318f38))
* qr-code SVG overlays, quiet zone margin, SVG export support ([aa16479](https://gitlab.com/Hedzer/snice/commit/aa16479f8b414a03c24822a077b5bcbb6e14a94d))

# [4.13.0](https://gitlab.com/Hedzer/snice/compare/v4.12.0...v4.13.0) (2026-02-24)


### Features

* build-website generates snice-code-block markup, theme persistence, new decorator sections ([19226ba](https://gitlab.com/Hedzer/snice/commit/19226baf25de5c3b1412d005482cedefd979046c))

# [4.12.0](https://gitlab.com/Hedzer/snice/compare/v4.11.0...v4.12.0) (2026-02-24)


### Bug Fixes

* add slideCount prop to carousel react adapter ([16ded54](https://gitlab.com/Hedzer/snice/commit/16ded54824f7c76eed5ae116bf48ac051482938a))
* stamp asset URLs, preload code-block in head, showcase tweaks ([7c317c1](https://gitlab.com/Hedzer/snice/commit/7c317c1e2b2daf734de6a55b777f73328f587f46))


### Features

* asset cache-busting with git hash stamps, CDN cache headers ([19e178f](https://gitlab.com/Hedzer/snice/commit/19e178f9aa2d7918e6280d9e24782549b600cba6))
* html grammar with embedded JS/CSS highlighting, add website grammar files ([3e7556c](https://gitlab.com/Hedzer/snice/commit/3e7556c0a869c569cbee684b71aa565bb262a47e))
* migrate website code samples to snice-code-block, drop manual syntax spans ([70dbdae](https://gitlab.com/Hedzer/snice/commit/70dbdaefaf19fe031947b513a06ec4f452e6fc72))

# [4.11.0](https://gitlab.com/Hedzer/snice/compare/v4.10.0...v4.11.0) (2026-02-24)


### Bug Fixes

* carousel indicator count, markdown theme colors, pdf-viewer event delegation, podcast speed label ([0ffdfc1](https://gitlab.com/Hedzer/snice/commit/0ffdfc1a8132c6d97327e3488de790a9700c5847))
* deduplicate router placards, rename guards to descriptive predicates ([6632a85](https://gitlab.com/Hedzer/snice/commit/6632a85e6f9ab2932475b3cfde19b6a89ddf7376))
* react adapter props for book, diff, markdown, org-chart; add app-tiles adapter ([dd2573f](https://gitlab.com/Hedzer/snice/commit/dd2573f69d9dc6dbcec2bb6e46a95529db925314))
* remove duplicate footer from website pages, adjust guide sidebar offset ([fb5b9f7](https://gitlab.com/Hedzer/snice/commit/fb5b9f77d58e0084c4bd71348bbe2032b8798dcf))
* showcase fragment tweaks, update component checklist for new build system ([b03d9e5](https://gitlab.com/Hedzer/snice/commit/b03d9e54c1ac8d403d346c11e39376b4be3b9ab4))


### Features

* component search, sort by alpha/category/popular, content-visibility optimization ([6d63ae6](https://gitlab.com/Hedzer/snice/commit/6d63ae63d7a6e50b50390ff77dabd7e234e2fbaf))
* overhaul PWA template with components, controllers, new pages, and MCP guide ([fa7de36](https://gitlab.com/Hedzer/snice/commit/fa7de36392a8f77774d442a07fc643d043c18bae))

# [4.10.0](https://gitlab.com/Hedzer/snice/compare/v4.9.0...v4.10.0) (2026-02-23)


### Bug Fixes

* app-tiles badge layout, spotlight containing block offset ([f0312f3](https://gitlab.com/Hedzer/snice/commit/f0312f3104fc380b1f519d8e2167708b9c470012))
* book, comments, flow, markdown, org-chart, pdf-viewer, spotlight improvements ([c7e34c8](https://gitlab.com/Hedzer/snice/commit/c7e34c850ffb84b60966d8c3acd82c4cccb8b84e))
* lazy camera-annotate in modals, timer IDs, tagline update, v4.9.0 ([b28deec](https://gitlab.com/Hedzer/snice/commit/b28deec054293f53ffad8843facb3e4ec124eb48))
* pdf-viewer worker resolution and state visibility, signature resize cleanup ([2f6489b](https://gitlab.com/Hedzer/snice/commit/2f6489b4d95bbae3c69ad739a465e1cbc321f8e1))
* refactor book component CSS and rendering ([387cf48](https://gitlab.com/Hedzer/snice/commit/387cf48f9a62d6f0f7d6809708f4809b1def4694))
* remove internal properties from react adapters ([cf8bb0c](https://gitlab.com/Hedzer/snice/commit/cf8bb0c54e3b2f38d82497f1e0875cb8dfc60f88))
* simplify book component and showcase ([70c5fb7](https://gitlab.com/Hedzer/snice/commit/70c5fb719c590811d09ca8caa24ed42d10428dd0))
* spotlight portal rendering, waterfall direct DOM with [@watch](https://gitlab.com/watch) ([28b1f08](https://gitlab.com/Hedzer/snice/commit/28b1f08812c46c2dbd5e8a86b219ad37c9035315))


### Features

* add 27 new components ([79f3ea2](https://gitlab.com/Hedzer/snice/commit/79f3ea294e15a610341f2cda306459dd3a1a1714))
* add app-tiles component with docs and showcase ([63f3f9d](https://gitlab.com/Hedzer/snice/commit/63f3f9dcb838bc3846a69fb4bb155a52922c33cb))
* add showcases for new components, update tasks and build scripts ([b8981a4](https://gitlab.com/Hedzer/snice/commit/b8981a4d9feeca6cbe351d3aa73ee20379782f0d))
* add showcases for remaining new components, update manifest and build config ([fb85628](https://gitlab.com/Hedzer/snice/commit/fb856282d53217276a4a945af74e22cb2ccfb478))
* add tests and react adapters for new components ([72a3a9a](https://gitlab.com/Hedzer/snice/commit/72a3a9a0af4d8be5589bae4e9af6e5dfa40c8b25))
* incremental single-component rebuild in dev server ([223014b](https://gitlab.com/Hedzer/snice/commit/223014b415b403f02596b03bd91421f9ca059da2))
* mobile responsive website, collapsible code blocks, pricing-table mobile fix ([3713ad9](https://gitlab.com/Hedzer/snice/commit/3713ad99ca295dcdf3a7f6a8bc2406a77391adc4))
* spreadsheet multi-cell selection, undo/redo, column resize, context menu ([c310531](https://gitlab.com/Hedzer/snice/commit/c310531c5b9e385228dc3eeaff9ba37a6a3469b1))

# [4.9.0](https://gitlab.com/Hedzer/snice/compare/v4.8.0...v4.9.0) (2026-02-23)


### Bug Fixes

* candlestick [@watch](https://gitlab.com/watch) reactivity and direct DOM crosshair, breadcrumbs button reset ([67e941c](https://gitlab.com/Hedzer/snice/commit/67e941c146996037eb251341a24bc26b5e04d8b9))
* candlestick SVG mouse coordinates via getScreenCTM ([c099d9d](https://gitlab.com/Hedzer/snice/commit/c099d9d2760177caeb38eb849de5bd82ef314d39))
* direct DOM rendering for sankey, treemap, funnel, candlestick ([6dec304](https://gitlab.com/Hedzer/snice/commit/6dec304fe6ca6af9cc4ed12f15b757f6ac96a04d))
* network-graph direct DOM rendering with render({once: true}) ([ae8fcb2](https://gitlab.com/Hedzer/snice/commit/ae8fcb270ba0cd6dc3ac321c71923cfb0ce5b11d))
* pagination CSS theming, Material Symbols in list showcase, carousel layout ([21b3c82](https://gitlab.com/Hedzer/snice/commit/21b3c82a639152f3cb0a1a339fd340da79b86d42))
* stepper panel visibility, CDN build children, component rebuilder ([d2344f0](https://gitlab.com/Hedzer/snice/commit/d2344f082c945e385e4692cb73eaa9867c324a09))
* update list and nav showcases, dynamic component count ([cfaa8c5](https://gitlab.com/Hedzer/snice/commit/cfaa8c575d5a3189f0b7033fa0142221a13c045a))
* use [@watch](https://gitlab.com/watch) for data reactivity in visualization components ([5600848](https://gitlab.com/Hedzer/snice/commit/56008484db7dd966eb2476163b41457163278271))
* virtual-scroller scroll handling, router type cast, react adapter props ([7e37e41](https://gitlab.com/Hedzer/snice/commit/7e37e4191f0d2f4e943086837f3d734c8d5edbee))


### Features

* add camera-annotate component ([6cfb4e2](https://gitlab.com/Hedzer/snice/commit/6cfb4e281b11b98312641cdac030b56b1acc526a))
* add candlestick component ([9947cfe](https://gitlab.com/Hedzer/snice/commit/9947cfe452cc45974a131996d909ef61941d7626))
* add docs symlink to public directory ([6f1e23b](https://gitlab.com/Hedzer/snice/commit/6f1e23b2c8b1ac4f81219aa464ca8e17d865281e))
* add favicon, OG meta, logo in header, tweak network-graph and manifest ([258a5ba](https://gitlab.com/Hedzer/snice/commit/258a5bac1a089adfa2f394bd3a07a298c8052b2c))
* add funnel component ([7c2a18c](https://gitlab.com/Hedzer/snice/commit/7c2a18c44ce184f56de7a2836e8a27bd9e399118))
* add network-graph component ([af957ea](https://gitlab.com/Hedzer/snice/commit/af957ea102229d6f9f002342788f2656b1ac7b31))
* add react adapters and tests for new components ([43c8546](https://gitlab.com/Hedzer/snice/commit/43c854610ac51ae67087782db1f0d8b2d9f90f70))
* add sankey component ([b7562e0](https://gitlab.com/Hedzer/snice/commit/b7562e051ba6dbe9b3642d0d817d80570072f7df))
* add time-range-picker component ([c49cdcd](https://gitlab.com/Hedzer/snice/commit/c49cdcdce38aa95184fa2d1c482c6009d4725d91))
* add treemap component ([98d92b3](https://gitlab.com/Hedzer/snice/commit/98d92b3432a400fb92df7443d561b5c95c5a4901))
* add website showcases and expand stepper demo ([5a89061](https://gitlab.com/Hedzer/snice/commit/5a8906177138e3164480fcbeafdd01a52b63a4b6))
* add website showcases for new components ([07935f5](https://gitlab.com/Hedzer/snice/commit/07935f50d50670c8f55a95acb21b03d5f886128a))
* list-item heading/description props, nav image icons, breadcrumbs button reset ([df8fb02](https://gitlab.com/Hedzer/snice/commit/df8fb02f0408331dd5a526367f8d609979777b47))
* new category fragments, carousel and list showcase redesign, add logo ([176aed6](https://gitlab.com/Hedzer/snice/commit/176aed61f009a70914571cb4ecf8929dfd5893a2))
* reorganize component categories, redesign carousel and masonry showcases ([c9ccb20](https://gitlab.com/Hedzer/snice/commit/c9ccb2012c281e939e7c88b99db76bf240dea578))
* terminal demo build/test/deploy loop, guide code formatting, version bump ([de5a40c](https://gitlab.com/Hedzer/snice/commit/de5a40cf8ce5483a670018777cc3f846ef50de50))
* website sidebar nav, update sankey showcase data ([772eeb5](https://gitlab.com/Hedzer/snice/commit/772eeb5984aa2ac89496d2203cf7c16b7a2552ff))

# [4.8.0](https://gitlab.com/Hedzer/snice/compare/v4.7.0...v4.8.0) (2026-02-22)


### Bug Fixes

* add missing paint tag to component list ([1ecb969](https://gitlab.com/Hedzer/snice/commit/1ecb969cf484b837b4e654342878e828427fe7ed))
* filter runtime directory from CDN component copy ([f2bda32](https://gitlab.com/Hedzer/snice/commit/f2bda327d32e34a4b1780dfe72bdde3ed4374d59))
* heatmap tooltip reactivity, color-picker input sizing, paint css tag ([61e03b7](https://gitlab.com/Hedzer/snice/commit/61e03b72de5f480b81f193b195a70f2e127b0551))
* update paint react adapter to match component API ([661912b](https://gitlab.com/Hedzer/snice/commit/661912b653c4853a7a10200cfe1f44760a04dea4))
* use [@on](https://gitlab.com/on) decorator for slotchange and remove redundant code watcher in code-block ([5551905](https://gitlab.com/Hedzer/snice/commit/555190576c2b4672285b583f2fb65c54b7377bf1))


### Features

* add fetchMode, slotted content, and grammar-request event to code-block ([836ca25](https://gitlab.com/Hedzer/snice/commit/836ca2533d21fd9a9759bae0f9b0340e4ec21dbd))
* add grammar property to code-block react adapter ([a28e529](https://gitlab.com/Hedzer/snice/commit/a28e529f0724ad448bb732584b056c1f0e219500))
* simplify context update API to no-arg ctx.update() ([aa9ce3f](https://gitlab.com/Hedzer/snice/commit/aa9ce3fee402bcc3db702c598f5822aa4ba964a4))

# [4.7.0](https://gitlab.com/Hedzer/snice/compare/v4.6.0...v4.7.0) (2026-02-22)


### Bug Fixes

* include menu-item and menu-divider in standalone build ([8598696](https://gitlab.com/Hedzer/snice/commit/8598696a08a73b553e9c3679b5d6978f394494bf))
* remove default trigger styles from menu and fix demo overflow ([ecbd815](https://gitlab.com/Hedzer/snice/commit/ecbd81560c4dd1f7f94ea68784189afa570c29b1))
* set color-picker to full width ([e262366](https://gitlab.com/Hedzer/snice/commit/e2623665a7a95c5cb8a2b52051f890d70e3a54a0))
* set file-gallery to full width ([58b05ec](https://gitlab.com/Hedzer/snice/commit/58b05ec223f3cb3db3232349e11848949b8dda0a))
* simplify draw demo and remove tool buttons ([780e713](https://gitlab.com/Hedzer/snice/commit/780e71337697e056a7223f2676fdb8ba9ce63558))


### Features

* add gauge component ([2888122](https://gitlab.com/Hedzer/snice/commit/288812286825b025eb636b6223f3a0586638d032))
* add grammar-based syntax highlighting to code-block ([4689b0c](https://gitlab.com/Hedzer/snice/commit/4689b0c8dd9f50a17fd7a6384766509c2bdc730d))
* add heatmap component ([265da76](https://gitlab.com/Hedzer/snice/commit/265da768d3d5653cc43e3a86a9190f623715f9a9))
* add link-preview component ([5067b67](https://gitlab.com/Hedzer/snice/commit/5067b676c0a430d32126225d9a710c2d4797f1b4))
* add masonry component ([05d3d4a](https://gitlab.com/Hedzer/snice/commit/05d3d4afb3a4511d244bc190f20cf6a65888dc6d))
* add paint component ([b7b9760](https://gitlab.com/Hedzer/snice/commit/b7b97600f7af88e7c977827812e5b84edd40fc3a))
* add paint component to website and react adapter ([18ed76d](https://gitlab.com/Hedzer/snice/commit/18ed76dfbfab9090bee19f9fe042c38656c024b7))
* add shared runtime and lightweight standalone builds ([22dfd64](https://gitlab.com/Hedzer/snice/commit/22dfd641671a5c9764e0bc500fbe858fe661407b))
* add snice grammar for code-block syntax highlighting ([7903ab0](https://gitlab.com/Hedzer/snice/commit/7903ab0f17875fe6a5e4742bb0bf5f99193a7264))
* add usage modes section and update guide page ([9fd6057](https://gitlab.com/Hedzer/snice/commit/9fd60576847350b41a766d6f3b64b5194fddc61d))
* auto-build full and light versions in CLI ([e5a07d5](https://gitlab.com/Hedzer/snice/commit/e5a07d5c10b37ac813c19bd91c409a6d8fb61f1e))
* integrate new components into website and react adapters ([69267c9](https://gitlab.com/Hedzer/snice/commit/69267c95dbac4487a06e6152a60f26e5a5ab7d82))
* switch website to light builds with shared runtime ([0e99073](https://gitlab.com/Hedzer/snice/commit/0e99073659a605372a7fca532a6363ca7b3583d5))

# [4.6.0](https://gitlab.com/Hedzer/snice/compare/v4.5.0...v4.6.0) (2026-02-21)


### Bug Fixes

* add text-shadow variable to public theme copy ([f36f671](https://gitlab.com/Hedzer/snice/commit/f36f671e147a446c610594e6e4e11d559bd2d174))
* component CSS improvements ([2d53b2e](https://gitlab.com/Hedzer/snice/commit/2d53b2eb483ac7205e9751ae41433f0f38de5e1b))
* conditionally render icon slots in button and chip ([3feda4b](https://gitlab.com/Hedzer/snice/commit/3feda4b1c91a040172b457924101700804fbe4f8))
* improve text legibility on colored backgrounds ([4ea6d0b](https://gitlab.com/Hedzer/snice/commit/4ea6d0b35b8b345391c8679668bac7beefb2d0d3))
* remove controller tab and pitch item from homepage ([8906d18](https://gitlab.com/Hedzer/snice/commit/8906d1846c8f474fc79659b78c12efbf67dcf6fc))
* resolve CSS variables in sparkline canvas rendering ([7dc66f4](https://gitlab.com/Hedzer/snice/commit/7dc66f41331f2b4da437375c9f20a9513f263d60))
* stop build script from overwriting hand-maintained files ([e667c6e](https://gitlab.com/Hedzer/snice/commit/e667c6ebfe9318d1e840defbe5dd2a49af719a96))
* update slider demo to use label property ([0aa3d4b](https://gitlab.com/Hedzer/snice/commit/0aa3d4bf9194250af8861dbb6d8c5345bf7f1d14))


### Features

* add icon slot support to components ([a2cd3d2](https://gitlab.com/Hedzer/snice/commit/a2cd3d234e067632fec2f736badebc46bf815162))
* add showcase build system with vite HMR ([52f7696](https://gitlab.com/Hedzer/snice/commit/52f7696ee96a6a66d5054d4cd687a757a32edcc9))
* improve card and select demos with Material Symbols ([63306cf](https://gitlab.com/Hedzer/snice/commit/63306cf00f5e58789f1eaad8ed110e5fff0b5c53))
* improve controller and event examples on decorators page ([8de99b2](https://gitlab.com/Hedzer/snice/commit/8de99b2b7d52d2d187ccd8fe6ed7aab8958fe392))
* overhaul components demo and add showcase pages ([92c086e](https://gitlab.com/Hedzer/snice/commit/92c086e42348d36a7b31aa60d8cb05a00acb6bba))
* overhaul website styling and components demo ([0c56931](https://gitlab.com/Hedzer/snice/commit/0c56931ec3c6222395fb4d9872a1f46a5b5fe55d))
* redesign website demo pages ([83b30c7](https://gitlab.com/Hedzer/snice/commit/83b30c7b82064ba46ccb9a5406a9b745aae067ae))
* restore homepage code tabs with improved syntax highlighting ([cb3db2a](https://gitlab.com/Hedzer/snice/commit/cb3db2ac62662f6b5ed78f97081af1a86286e138))
* simplify homepage and refine showcase pages ([1d50865](https://gitlab.com/Hedzer/snice/commit/1d5086553eb4745b08b299f0358e4fd8aff3f872))

# [4.5.0](https://gitlab.com/Hedzer/snice/compare/v4.4.0...v4.5.0) (2026-02-19)


### Features

* add validation for component type imports ([a70232d](https://gitlab.com/Hedzer/snice/commit/a70232dfac05689b2de3a9c75927cf2cd515933b))

# [4.4.0](https://gitlab.com/Hedzer/snice/compare/v4.3.0...v4.4.0) (2026-02-19)


### Bug Fixes

* add text outline to avatar initials for contrast ([0a8622c](https://gitlab.com/Hedzer/snice/commit/0a8622c955a1f7174df37743f0835afb1b3734d5))
* warn instead of error on duplicate element registration ([dc8b75b](https://gitlab.com/Hedzer/snice/commit/dc8b75b2ba8007991898bcda3171309c456a20c7))


### Features

* add Cloudflare Workers deployment for snice.dev ([db5deab](https://gitlab.com/Hedzer/snice/commit/db5deabca9c6444878958f6482d1c5f25057d8bf))
* add MCP server and templates section to website ([011e701](https://gitlab.com/Hedzer/snice/commit/011e701cf613a1ab76adc15c4bbb82fe42e0b5a3))
* add renderIcon utility with auto-detection and scheme overrides ([b3e29c3](https://gitlab.com/Hedzer/snice/commit/b3e29c33c4590759d1994e2b981c4724f45daa8c))
* progress color accepts semantic names and custom CSS colors ([f066671](https://gitlab.com/Hedzer/snice/commit/f0666711e67d58bcb20e6a63eccdb5d3ef704d10))
* support @@ escape syntax for namespaced events ([70314dd](https://gitlab.com/Hedzer/snice/commit/70314dd1bec4d0278107f4dec3d1484fe56b084b))
* website improvements and release automation ([ba1bf2a](https://gitlab.com/Hedzer/snice/commit/ba1bf2a0533d7f96d5b23c63cde30dc79d29c0fc))

# [4.3.0](https://gitlab.com/Hedzer/snice/compare/v4.2.0...v4.3.0) (2026-02-12)


### Bug Fixes

* bi/pwa login & button types ([2405426](https://gitlab.com/Hedzer/snice/commit/24054268ea3d26549affa4d9f4d23d03de140787))
* demo.html dark modes ([6af74a4](https://gitlab.com/Hedzer/snice/commit/6af74a461172e10b35d5fdef84ae6304181c1e3c))
* react integration ([c714837](https://gitlab.com/Hedzer/snice/commit/c71483798273008d391a7400b498d22dd0190c48))
* react wrappers ([a96c7a6](https://gitlab.com/Hedzer/snice/commit/a96c7a6bca15a131067ad9059dbca2f0969a0620))
* tests, dark mode issues, docs ([cf9b3c5](https://gitlab.com/Hedzer/snice/commit/cf9b3c546ff6a0a5d80ec1fa415ab8775b2ebe78))


### Features

* added react support ([5547106](https://gitlab.com/Hedzer/snice/commit/5547106e0d9e52e3e232422bd1aae0d1b2c7774a))
* lit parity for interpolation ([28eb5f6](https://gitlab.com/Hedzer/snice/commit/28eb5f6c52ab69641c8ead5925056390a2174c41))
* public website ([f78c61e](https://gitlab.com/Hedzer/snice/commit/f78c61e105733bc7baabe17c372e87fe924f1d37))
* ux color improvements ([62518b8](https://gitlab.com/Hedzer/snice/commit/62518b8766c0118b4e4da36fde6a8eebbdc79eab))
* ux shadow/light improvements ([2ea063b](https://gitlab.com/Hedzer/snice/commit/2ea063bf55e67b9bb76420d842be744629bd283b))

# [4.2.0](https://gitlab.com/Hedzer/snice/compare/v4.1.0...v4.2.0) (2025-11-09)


### Bug Fixes

* login doc mistakes, loader state ([372f1da](https://gitlab.com/Hedzer/snice/commit/372f1dac00e8376bbbb9e785b3f7ba2a0463d79b))


### Features

* gallery header control ([ea0c284](https://gitlab.com/Hedzer/snice/commit/ea0c28424a06830f694097ade25bcbd831e2622c))

# [4.1.0](https://gitlab.com/Hedzer/snice/compare/v4.0.2...v4.1.0) (2025-11-04)


### Features

* made camera auto size ([bf27309](https://gitlab.com/Hedzer/snice/commit/bf273096921fa76276187ca329d2a24d33022a6a))

## [4.0.2](https://gitlab.com/Hedzer/snice/compare/v4.0.1...v4.0.2) (2025-11-04)


### Bug Fixes

* removed / sanitization ([6c891e8](https://gitlab.com/Hedzer/snice/commit/6c891e8080dbc107e0b1d1ed794fd67d4b9b59af))

## [4.0.1](https://gitlab.com/Hedzer/snice/compare/v4.0.0...v4.0.1) (2025-11-04)


### Bug Fixes

* template versions ([e57385e](https://gitlab.com/Hedzer/snice/commit/e57385ec186705ffb6f80c7098783e67c1576621))

# [4.0.0](https://gitlab.com/Hedzer/snice/compare/v3.11.0...v4.0.0) (2025-11-04)


*   feat!: migrate events from @snice/ prefix to unprefixed ([136e20a](https://gitlab.com/Hedzer/snice/commit/136e20a8846019630aa4f1ab5e4f4d7b405c487e))


### BREAKING CHANGES

* All component events have been migrated from @snice/ prefix to
  unprefixed (or component-specific names for native conflicts).

  Event name changes:
  - Most events: @snice/event-name → event-name
  - Button: @snice/click → button-click
  - Checkbox: @snice/change → checkbox-change
  - File Gallery: @snice/error → gallery-error
  - Split Pane: @snice/resize → pane-resize
  - Tabs: @snice/close → tab-close

  Template syntax updated:
  - @@snice/event-name → @event-name

  Migration required:
  - Update all addEventListener('@snice/...') to addEventListener('...')
  - Update all template event bindings from @@snice/ to @
  - See migration guide in documentation

# [3.11.0](https://gitlab.com/Hedzer/snice/compare/v3.10.5...v3.11.0) (2025-11-04)


### Features

* added file ghallery options ([fa51510](https://gitlab.com/Hedzer/snice/commit/fa51510dacfe6a24d91ee7d5a4034ffa5baf9235))
* added object-fit for camera ([8436a77](https://gitlab.com/Hedzer/snice/commit/8436a777afaa7f91f64550803dccdd37cdb97b21))

## [3.10.5](https://gitlab.com/Hedzer/snice/compare/v3.10.4...v3.10.5) (2025-11-03)


### Bug Fixes

* theming fixes ([82ef1e3](https://gitlab.com/Hedzer/snice/commit/82ef1e3eaecb3169ecf12bdbe8899bb1fb553c72))

## [3.10.4](https://gitlab.com/Hedzer/snice/compare/v3.10.3...v3.10.4) (2025-11-03)


### Bug Fixes

* nav warning ([72c4d6e](https://gitlab.com/Hedzer/snice/commit/72c4d6e9be8d6e5393cff621fbcc65c659798e94))
* updated snice cards to match theming ([ee68dba](https://gitlab.com/Hedzer/snice/commit/ee68dba303040e4b8dc4e8e8cff24386a3c92d1c))

## [3.10.3](https://gitlab.com/Hedzer/snice/compare/v3.10.2...v3.10.3) (2025-11-03)


### Bug Fixes

* property init issue ([954edbb](https://gitlab.com/Hedzer/snice/commit/954edbb29ce06ffe2a61f92113b7ae029929e3d1))

## [3.10.2](https://gitlab.com/Hedzer/snice/compare/v3.10.1...v3.10.2) (2025-11-03)


### Bug Fixes

* <if> undefined render bug ([740a48f](https://gitlab.com/Hedzer/snice/commit/740a48f9c3de891baa13fb908e32096cbb7d1d6d))

## [3.10.1](https://gitlab.com/Hedzer/snice/compare/v3.10.0...v3.10.1) (2025-11-03)


### Bug Fixes

* test issues ([dab4875](https://gitlab.com/Hedzer/snice/commit/dab4875cce1ef5a18e863d93c1581973b3055cd0))

# [3.10.0](https://gitlab.com/Hedzer/snice/compare/v3.9.0...v3.10.0) (2025-11-02)


### Bug Fixes

* slash events ([695b326](https://gitlab.com/Hedzer/snice/commit/695b32678d07975a44f6a62ca681f0a423dfb73a))


### Features

* added tap-start to qr-reader ([5171e79](https://gitlab.com/Hedzer/snice/commit/5171e794e8b6b4e7dc771e034b43470bd66e6978))

# [3.9.0](https://gitlab.com/Hedzer/snice/compare/v3.8.0...v3.9.0) (2025-11-02)


### Features

* added gitignore for templates ([2165ff1](https://gitlab.com/Hedzer/snice/commit/2165ff113819b6114ed9e821a7e230d161e4a043))
* qr-reader ([655e188](https://gitlab.com/Hedzer/snice/commit/655e18880734041c52626d815ab5a5f9bbda0de1))
* upload gallery component ([2eaaf64](https://gitlab.com/Hedzer/snice/commit/2eaaf6486ac2ef0c3ea91f0373bf9d29e40099e8))

# [3.8.0](https://gitlab.com/Hedzer/snice/compare/v3.7.0...v3.8.0) (2025-11-02)


### Bug Fixes

* docs, incorrect generic context ([994d1eb](https://gitlab.com/Hedzer/snice/commit/994d1eb3fc58bca4b5cd5a5ea3493f462fd30717))
* template manifest fixes ([7a4784e](https://gitlab.com/Hedzer/snice/commit/7a4784e3d4f8a0aace6762091cbbe034daa94616))


### Features

* pwa template ([bfe5dc6](https://gitlab.com/Hedzer/snice/commit/bfe5dc6550a13684c6c8ee578780a02a06b75fab))

# [3.7.0](https://gitlab.com/Hedzer/snice/compare/v3.6.0...v3.7.0) (2025-11-02)


### Features

* added fetcher feature ([b9c3b84](https://gitlab.com/Hedzer/snice/commit/b9c3b8478b81d142c7af019351f79699eab4547d))
* added QR scanner ([78f99d1](https://gitlab.com/Hedzer/snice/commit/78f99d15ab7da823b284a08170a50488e3e0968d))
* added timer component ([fa69bf7](https://gitlab.com/Hedzer/snice/commit/fa69bf7545a679f37aa28db2d1c9cf64b8852dc9))
* music player component ([47a8802](https://gitlab.com/Hedzer/snice/commit/47a88025fff3c7bb78ef8dd736984afa531efd4d))

# [3.6.0](https://gitlab.com/Hedzer/snice/compare/v3.5.0...v3.6.0) (2025-11-01)


### Features

* audio recorder ([8ca3f72](https://gitlab.com/Hedzer/snice/commit/8ca3f72e2cefa802b5e4edbd34cf29fd6350ed0c))

# [3.5.0](https://gitlab.com/Hedzer/snice/compare/v3.4.1...v3.5.0) (2025-11-01)


### Bug Fixes

* bar chart rendering ([249f8e5](https://gitlab.com/Hedzer/snice/commit/249f8e56ec325839388ca3ffc606a36fd927693d))
* bug bash, [@on](https://gitlab.com/on) decorator, double snice loading ([b6e7b36](https://gitlab.com/Hedzer/snice/commit/b6e7b36ffc979e477c0335926b0e00ac3dbe16b3))
* demos & calendar rendering ([4397caf](https://gitlab.com/Hedzer/snice/commit/4397caffe828f424b517c4fe0fe673673a08244c))
* draw component sizing ([50f2e4b](https://gitlab.com/Hedzer/snice/commit/50f2e4ba840a0f66dc84cd891e67467a58fec134))
* location component theming ([86ecda6](https://gitlab.com/Hedzer/snice/commit/86ecda6a4359b50fab6b57cc8ba832d2bce03e67))
* select rendereing issues ([d5d6598](https://gitlab.com/Hedzer/snice/commit/d5d65980f7b65c2ba62dfb9ef44881e79750fb15))
* split pane styling ([a4b29e1](https://gitlab.com/Hedzer/snice/commit/a4b29e1a1eb72d4146b17f1ef2b435d492ca0d24))
* style & z-index ([464295b](https://gitlab.com/Hedzer/snice/commit/464295bbd2d48e3c89930932885c357a07f26dcd))
* table themeing ([3c92139](https://gitlab.com/Hedzer/snice/commit/3c92139e9535ef1b73439e58304d7074b931e339))
* tree element style, lazy loading & visual fixes ([96f4844](https://gitlab.com/Hedzer/snice/commit/96f48447263cd0fea15779aa8b00f262e9a7e55e))


### Features

* added draw 'circle' mode ([c5a115d](https://gitlab.com/Hedzer/snice/commit/c5a115d2e4b030a1246da4851137a7fad15c2d3d))
* added loading state ([10cbd81](https://gitlab.com/Hedzer/snice/commit/10cbd8179ef4a68bf6041c9499a849019bd974bf))
* code block with highlighting ([263845b](https://gitlab.com/Hedzer/snice/commit/263845b57b6d50fead093100a7b95738584e5d41))
* improved demo.html ([83e98fc](https://gitlab.com/Hedzer/snice/commit/83e98fc42ee35c3a215afdb1f2247ee0a7fd0e19))
* kanban component ([f9f55c1](https://gitlab.com/Hedzer/snice/commit/f9f55c17528ac07ee99f2bc3c8563a381f5c8821))
* terminal ([df4ec41](https://gitlab.com/Hedzer/snice/commit/df4ec41a584b2d623167054b355857e32ee65c67))

## [3.4.1](https://gitlab.com/Hedzer/snice/compare/v3.4.0...v3.4.1) (2025-10-30)


### Bug Fixes

* bin/ versions :facepalm: ([1d5ae43](https://gitlab.com/Hedzer/snice/commit/1d5ae438a53ef0b17835d67027380f6e39e07cd2))

# [3.4.0](https://gitlab.com/Hedzer/snice/compare/v3.3.1...v3.4.0) (2025-10-30)


### Features

* added social templates & claude.md ([b742211](https://gitlab.com/Hedzer/snice/commit/b742211e43946c801a0a0273d2bb3786c6be1fc5))

## [3.3.1](https://gitlab.com/Hedzer/snice/compare/v3.3.0...v3.3.1) (2025-10-30)


### Bug Fixes

* converted bin/ & examples to v3 ([09cd3e7](https://gitlab.com/Hedzer/snice/commit/09cd3e77c021b57454fdb6177c6edf7779982cda))
* qr-code build ([9457f11](https://gitlab.com/Hedzer/snice/commit/9457f1143e64008cb7a64f294c210420fa846503))

# [3.3.0](https://gitlab.com/Hedzer/snice/compare/v3.2.0...v3.3.0) (2025-10-26)


### Bug Fixes

* build errors ([0c4aa2d](https://gitlab.com/Hedzer/snice/commit/0c4aa2d4b12c4adbb7d6e31b808ab43989060f3f))
* carousel rendering ([62899ed](https://gitlab.com/Hedzer/snice/commit/62899ed5c68e18ef5c2b49c3fa32f4dd33025a7a))
* chart rendering ([71e95e9](https://gitlab.com/Hedzer/snice/commit/71e95e9d8ba12baf0fae92fd461db8e08ab0d33c))
* draw brush smoothness ([3cf2c5e](https://gitlab.com/Hedzer/snice/commit/3cf2c5e4e59d8a60c5868c907a3ea61f374ad16a))
* kpi issues ([bec13be](https://gitlab.com/Hedzer/snice/commit/bec13be02db00c83d75d684bebd343ec5bde305b))
* list rendering ([4883fce](https://gitlab.com/Hedzer/snice/commit/4883fce15ff0e51e67ca5836709f48b3390c17a5))
* locations rendering ([3be2adb](https://gitlab.com/Hedzer/snice/commit/3be2adbe603d710e557c9d7c4eda102dfc8f5fea))
* qr code element ([b956b7c](https://gitlab.com/Hedzer/snice/commit/b956b7c8e9534d883cff4f54668dfaa201037344))
* syntax + new components ([79d99f4](https://gitlab.com/Hedzer/snice/commit/79d99f4d2ee4090a9c44522df951cb145ff0f96d))
* tree rendering issues ([010c38a](https://gitlab.com/Hedzer/snice/commit/010c38a5e5e3c3904c217b379fff68cc1cdd1294))


### Features

* added nav, menu components ([9c3443d](https://gitlab.com/Hedzer/snice/commit/9c3443d6223cce1a8ae94c3623342ea5ea1b90d8))
* auto-polygon for draw ([a373853](https://gitlab.com/Hedzer/snice/commit/a37385349d680874ccf153466710179ac89d515d))
* menu tests and docs ([79278fc](https://gitlab.com/Hedzer/snice/commit/79278fc00421d3a0c22c186abe18d3ae22629ce4))
* newcamera features ([21ba814](https://gitlab.com/Hedzer/snice/commit/21ba814bdcfd101df42719579203685549eed4d5))
* qr text improvements ([dfc9f70](https://gitlab.com/Hedzer/snice/commit/dfc9f70faffe5bd95ff89a4d7ece7f95da235663))
* rounded dot style ([043a98e](https://gitlab.com/Hedzer/snice/commit/043a98e0e7cc195c63efb310e7f54d1ed204149c))

# [3.2.0](https://gitlab.com/Hedzer/snice/compare/v3.1.0...v3.2.0) (2025-10-25)


### Bug Fixes

* styling & build issues ([a22a691](https://gitlab.com/Hedzer/snice/commit/a22a691cb8857f40f08476bd85bff85ca89104c2))


### Features

* added spinner, slideer, textarea, timeline, and other components ([da74e6b](https://gitlab.com/Hedzer/snice/commit/da74e6b7e932f028f10dc925b0662fbd4eb44701))
* kpi & stepper components ([4be6aa7](https://gitlab.com/Hedzer/snice/commit/4be6aa787f409d2f154220893c00ecd5ec92ed8d))
* new components ([1be65cd](https://gitlab.com/Hedzer/snice/commit/1be65cd7c76e83b14d502285b6dd1d93d305884f))
* removed conditional elements from dom tree ([61d00d2](https://gitlab.com/Hedzer/snice/commit/61d00d292a6184e691ee2c2acf17b5f94daa1dc7))
* render optimizations ([b27d9a9](https://gitlab.com/Hedzer/snice/commit/b27d9a9bed09cf507a7e09396527b38c2b81d534))
* resource leak tests ([8c587de](https://gitlab.com/Hedzer/snice/commit/8c587de1ef897ccf6a147b0176a8d15d329cab80))

# [3.1.0](https://gitlab.com/Hedzer/snice/compare/v3.0.0...v3.1.0) (2025-10-24)


### Bug Fixes

* [@context](https://gitlab.com/context) docs ([5e7f5de](https://gitlab.com/Hedzer/snice/commit/5e7f5defc90ef2192998f1d0b02b768ddc6b70e5))
* [@on](https://gitlab.com/on) captures special events ([9b9eb52](https://gitlab.com/Hedzer/snice/commit/9b9eb5215468d68cd34c4c59712a8dd412d3e5be))
* accidental handler duplication ([c3c3028](https://gitlab.com/Hedzer/snice/commit/c3c30282d3c090469f62813e016c344138946106))
* AI docs ([7c1fef4](https://gitlab.com/Hedzer/snice/commit/7c1fef4ccdf6cb3aed2c90a74bd4c9aa13cbcb49))
* circular progress rendering true inside ([8de239b](https://gitlab.com/Hedzer/snice/commit/8de239b3530af53636d4d707bf605679263f5a9f))
* css interpolation ([c5b41c1](https://gitlab.com/Hedzer/snice/commit/c5b41c1091ca92b8c8981e5184eacab025b23fda))
* drawer close button ([72da522](https://gitlab.com/Hedzer/snice/commit/72da5227ba49cab0d5c6805bf58f5aeb441ec8ed))
* element fixes ([a06e32c](https://gitlab.com/Hedzer/snice/commit/a06e32ccff7cb84ad99bfad2f6c22142afdd2893))
* engine interpolation ([cfd5677](https://gitlab.com/Hedzer/snice/commit/cfd5677f19d63095b1cc6b60f3300f23d978836e))
* form internals ([e118f04](https://gitlab.com/Hedzer/snice/commit/e118f0402e3cd1e55b7823da92343cf337a7c3dd))
* if/case styles & cosmetic tablre changes ([8e8f4ed](https://gitlab.com/Hedzer/snice/commit/8e8f4ed9534f09ebef68d86c5adb32a82b51fa59))
* initial props ([92170f8](https://gitlab.com/Hedzer/snice/commit/92170f86151a45b4e21364edc8d492516c7f35a4))
* missed toasts ([cb0e645](https://gitlab.com/Hedzer/snice/commit/cb0e6453258ba508d72bf9d2de795a1455855a08))
* nav placards ([cac5f29](https://gitlab.com/Hedzer/snice/commit/cac5f29f2534252dbeda4ada49dc9022452a4fad))
* on handler shadow dom calls ([1b10c95](https://gitlab.com/Hedzer/snice/commit/1b10c95d0bc3bbc1398795210d7880f731ba40ac))
* output types ([7c5b20b](https://gitlab.com/Hedzer/snice/commit/7c5b20b1823cd547340aa3b1af2b2e953397b5cb))
* placards & docs updates ([3b1329c](https://gitlab.com/Hedzer/snice/commit/3b1329c00dda49f1dc64d4003d8a891d49b6474b))
* property init ([303eecd](https://gitlab.com/Hedzer/snice/commit/303eecd354609f52a9e395cbbc0732c2115db0a4))
* property reactivity ([f1f79dd](https://gitlab.com/Hedzer/snice/commit/f1f79ddd1fad2413848e0f6baf73edec8811f518))
* radio button selection ([cb86008](https://gitlab.com/Hedzer/snice/commit/cb8600858095f5161fe7a1061a709646dd2efc34))
* tab scroll button height ([5695145](https://gitlab.com/Hedzer/snice/commit/56951454c63af33ca57f7b10a71cf0d16a55611c))
* table filter & search ([82edca5](https://gitlab.com/Hedzer/snice/commit/82edca5cdbaf854a68af4a058482ecd8853977a6))
* visual switch fixes ([f9c5d3c](https://gitlab.com/Hedzer/snice/commit/f9c5d3cc85910b4c9232bc7c77e7bd042b1d3745))


### Features

* added new table cell types ([d2ea4ad](https://gitlab.com/Hedzer/snice/commit/d2ea4adb92deaeeb3d6ec843450e8323c2da8e5d))
* additional docs and tests ([27dc7aa](https://gitlab.com/Hedzer/snice/commit/27dc7aa55bd0d7df3f9d16395d9dade5b797c3bb))
* AI docs & readme fixes ([4148f2a](https://gitlab.com/Hedzer/snice/commit/4148f2a7429be76c666931027352771f6d2c19ce))
* component tests ([ee9b55a](https://gitlab.com/Hedzer/snice/commit/ee9b55a13a415a4a5a5139b4c67d8bb46ed77567))
* improved nav ([7b91474](https://gitlab.com/Hedzer/snice/commit/7b91474892221021f0c003feb5dc570f822a6364))
* restored [@on](https://gitlab.com/on) to its full glory ([63bf439](https://gitlab.com/Hedzer/snice/commit/63bf439be25f77c2b3258d0caab3feec135208fa))

## [2.5.4](https://gitlab.com/Hedzer/snice/compare/v2.5.3...v2.5.4) (2025-10-05)


### Bug Fixes

* removed transitions ([049c1f1](https://gitlab.com/Hedzer/snice/commit/049c1f17ebb8ba5b4ba7bd651f7c3514e1f0728c))

## [2.5.3](https://gitlab.com/Hedzer/snice/compare/v2.5.2...v2.5.3) (2025-10-05)


### Bug Fixes

* slot and render fixes ([25244f8](https://gitlab.com/Hedzer/snice/commit/25244f83eeda37a2ddc77d54ec4670d140a954c9))

## [2.5.2](https://gitlab.com/Hedzer/snice/compare/v2.5.1...v2.5.2) (2025-10-05)


### Bug Fixes

* updated snice version for bin/template ([7b37b37](https://gitlab.com/Hedzer/snice/commit/7b37b371483c5a4fb0fe88dfc5f43ab1b341153a))

## [2.5.1](https://gitlab.com/Hedzer/snice/compare/v2.5.0...v2.5.1) (2025-10-05)


### Bug Fixes

* component export fixes ([b3a7a99](https://gitlab.com/Hedzer/snice/commit/b3a7a99c896b1b6b03cc0463659eb4a94af98feb))

# [2.5.0](https://gitlab.com/Hedzer/snice/compare/v2.4.0...v2.5.0) (2025-10-05)


### Features

* updated template project with a layout ([a2eb6da](https://gitlab.com/Hedzer/snice/commit/a2eb6da3f238b5403fec7e845b7c919bc88883d7))

# [2.4.0](https://gitlab.com/Hedzer/snice/compare/v2.3.0...v2.4.0) (2025-10-05)


### Bug Fixes

* drawer fade & scroll fixes ([8801dd7](https://gitlab.com/Hedzer/snice/commit/8801dd7e916ba7151914651ed4a304aa3e6bda01))
* event naming & fire frequency ([5862947](https://gitlab.com/Hedzer/snice/commit/5862947304331fe6b5e4c4c65203069968e29b0c))
* improved import DX ([c62ae74](https://gitlab.com/Hedzer/snice/commit/c62ae748147d5ac5068f6e1f256cc6ffab6e0ec7))
* style visibility touch ups for sidebar layout ([91ab2d7](https://gitlab.com/Hedzer/snice/commit/91ab2d7ce30c6ed432f8a66cd1810ad6c68057f4))


### Features

* added [@moved](https://gitlab.com/moved) & [@adopted](https://gitlab.com/adopted) ([cf84709](https://gitlab.com/Hedzer/snice/commit/cf84709e721f2fb64c2a5c288e12fbc66c70279c))
* added snice-nav & placard integration for layouts ([64976fb](https://gitlab.com/Hedzer/snice/commit/64976fb57fb19f4fc4d3e9ec664d29657d319b1f))
* contained drawers ([a74d27e](https://gitlab.com/Hedzer/snice/commit/a74d27e71d1f1ed28bf1c9317a86b909f7aca2be))
* placards, app context, and layout updates ([4566d80](https://gitlab.com/Hedzer/snice/commit/4566d80f2edcd415c1a55ec3e3993f6548984e2f))

# [2.3.0](https://gitlab.com/Hedzer/snice/compare/v2.2.3...v2.3.0) (2025-09-19)


### Features

* added testing against src/ and dist/ files ([e84bacc](https://gitlab.com/Hedzer/snice/commit/e84bacc993124f5fd4482986f832deb0e5f6121c))

## [2.2.3](https://gitlab.com/Hedzer/snice/compare/v2.2.2...v2.2.3) (2025-09-19)


### Bug Fixes

* moved types into their own dir ([33963af](https://gitlab.com/Hedzer/snice/commit/33963afd87c3934db222057dea5f2d979f072488))
* property values set properly from innerHTML ([72b208c](https://gitlab.com/Hedzer/snice/commit/72b208cd29a96c735c5cc68973402af6bde32caf))

## [2.2.2](https://gitlab.com/Hedzer/snice/compare/v2.2.1...v2.2.2) (2025-09-18)


### Bug Fixes

* reactive login classes ([fb4efca](https://gitlab.com/Hedzer/snice/commit/fb4efca37867bc0c69a7392d8143287677cab785))

## [2.2.1](https://gitlab.com/Hedzer/snice/compare/v2.2.0...v2.2.1) (2025-09-18)


### Bug Fixes

* inlined css in built components ([a3baa6b](https://gitlab.com/Hedzer/snice/commit/a3baa6beb2442cc8f4215b70c31237406d295037))

# [2.2.0](https://gitlab.com/Hedzer/snice/compare/v2.1.5...v2.2.0) (2025-09-18)


### Features

* built components ([10de429](https://gitlab.com/Hedzer/snice/commit/10de429e75c10da0c854fa376e18a0c5e339a7fb))

## [2.1.5](https://gitlab.com/Hedzer/snice/compare/v2.1.4...v2.1.5) (2025-09-18)


### Bug Fixes

* moved connecged callback order ([545386c](https://gitlab.com/Hedzer/snice/commit/545386c2da3646e33cd7be632d5e15cbe4a231a1))

## [2.1.4](https://gitlab.com/Hedzer/snice/compare/v2.1.3...v2.1.4) (2025-09-18)


### Bug Fixes

* context loss when multiple decorators are applied ([a6461c4](https://gitlab.com/Hedzer/snice/commit/a6461c4f777adce4fa48c77c6b0ed369839be170))

## [2.1.3](https://gitlab.com/Hedzer/snice/compare/v2.1.2...v2.1.3) (2025-09-17)


### Bug Fixes

* event handler context ([d917fc4](https://gitlab.com/Hedzer/snice/commit/d917fc42eb1d9b70a6b946cfd74987f3363f6c45))
* part debouncing ([b3d438b](https://gitlab.com/Hedzer/snice/commit/b3d438bce94a1cecb8ae90eb29a879ec553e9ba9))

## [2.1.2](https://gitlab.com/Hedzer/snice/compare/v2.1.1...v2.1.2) (2025-09-17)


### Bug Fixes

* removed debug logs ([30b4e66](https://gitlab.com/Hedzer/snice/commit/30b4e66eb9aafc457aac7fadbf25401c87f928b3))

## [2.1.1](https://gitlab.com/Hedzer/snice/compare/v2.1.0...v2.1.1) (2025-09-17)


### Bug Fixes

* generalized login result ([8ab257d](https://gitlab.com/Hedzer/snice/commit/8ab257d5ab257011bcb7052758b25947a16f1a98))

# [2.1.0](https://gitlab.com/Hedzer/snice/compare/v2.0.0...v2.1.0) (2025-09-16)


### Features

* added back components ([e4300f8](https://gitlab.com/Hedzer/snice/commit/e4300f8bfeee6af025b470dd6c2bda7bcccf87cb))
* re-added component publishing ([402e391](https://gitlab.com/Hedzer/snice/commit/402e39129e193751969a759c703fc87658469081))

## [1.14.3](https://gitlab.com/Hedzer/snice/compare/v1.14.2...v1.14.3) (2025-09-15)


### Bug Fixes

* removed components folder from publishing ([9bad7ac](https://gitlab.com/Hedzer/snice/commit/9bad7acd01a8ca7010fb31481b78fcf94e078664))

## [1.14.2](https://gitlab.com/Hedzer/snice/compare/v1.14.1...v1.14.2) (2025-09-15)


### Bug Fixes

* useDefineForClassFields: false ([554415a](https://gitlab.com/Hedzer/snice/commit/554415a48eadbd99c10e24758291a4775f95b509))

## [1.14.1](https://gitlab.com/Hedzer/snice/compare/v1.14.0...v1.14.1) (2025-09-15)


### Bug Fixes

* added components & removed src ([0f037a4](https://gitlab.com/Hedzer/snice/commit/0f037a4455cff6bed381006959374f2de48825c4))

# [1.14.0](https://gitlab.com/Hedzer/snice/compare/v1.13.11...v1.14.0) (2025-09-15)


### Bug Fixes

* pathing issues ([0936c1b](https://gitlab.com/Hedzer/snice/commit/0936c1b8c4b94e9fbb8be36a7df9684e1857b85d))


### Features

* added multiple output formats ([c84bce3](https://gitlab.com/Hedzer/snice/commit/c84bce3194d783b6406f50b2c6300e3ec5b138f9))

## [1.13.11](https://gitlab.com/Hedzer/snice/compare/v1.13.10...v1.13.11) (2025-09-15)


### Bug Fixes

* swapped route-parser with pica-route ([68fd4d9](https://gitlab.com/Hedzer/snice/commit/68fd4d9a83c6fd611cfec0802ea4535b0a779df0))

## [1.13.10](https://gitlab.com/Hedzer/snice/compare/v1.13.9...v1.13.10) (2025-09-15)


### Bug Fixes

* more pathing fixes ([eb69342](https://gitlab.com/Hedzer/snice/commit/eb69342a95c946cbdec7d9f197b57839942a0202))

## [1.13.9](https://gitlab.com/Hedzer/snice/compare/v1.13.8...v1.13.9) (2025-09-14)


### Bug Fixes

* component paths ([6c4ef03](https://gitlab.com/Hedzer/snice/commit/6c4ef0351ddffb344c1af436d159dfe89b274759))

## [1.13.8](https://gitlab.com/Hedzer/snice/compare/v1.13.7...v1.13.8) (2025-09-14)


### Bug Fixes

* add release/publish validation ([dc68feb](https://gitlab.com/Hedzer/snice/commit/dc68feb0a787cf23d88f5f754b16aba7efd38877))

## [1.13.7](https://gitlab.com/Hedzer/snice/compare/v1.13.6...v1.13.7) (2025-09-14)


### Bug Fixes

* build output ([15f58b5](https://gitlab.com/Hedzer/snice/commit/15f58b5c082f304a6fb1e5d0d25a21eb17976188))

## [1.13.6](https://gitlab.com/Hedzer/snice/compare/v1.13.5...v1.13.6) (2025-09-14)


### Bug Fixes

* build output ([8f14a52](https://gitlab.com/Hedzer/snice/commit/8f14a52bb23c9c032a0c4b3ca8bfc003543eebbb))

## [1.13.5](https://gitlab.com/Hedzer/snice/compare/v1.13.4...v1.13.5) (2025-09-14)


### Bug Fixes

* snice index ([6295797](https://gitlab.com/Hedzer/snice/commit/6295797b7afc4001a574b19d4f5824cb4fe1b570))

## [1.13.4](https://gitlab.com/Hedzer/snice/compare/v1.13.3...v1.13.4) (2025-09-14)


### Bug Fixes

* switched to built files ([91db67b](https://gitlab.com/Hedzer/snice/commit/91db67beb8e368ed8613491c921e707b40bb416e))

## [1.13.3](https://gitlab.com/Hedzer/snice/compare/v1.13.2...v1.13.3) (2025-09-14)


### Bug Fixes

* docs & [@part](https://gitlab.com/part) decorator ([e5f32f9](https://gitlab.com/Hedzer/snice/commit/e5f32f9338ed43f1181888c9615b74977ae1e0ab))

## [1.13.2](https://gitlab.com/Hedzer/snice/compare/v1.13.1...v1.13.2) (2025-09-11)


### Bug Fixes

* re-added readme ([9660721](https://gitlab.com/Hedzer/snice/commit/9660721e0b2347283ccc6859d0256a8e2f9d7419))

## [1.13.1](https://gitlab.com/Hedzer/snice/compare/v1.13.0...v1.13.1) (2025-09-11)


### Bug Fixes

* released files ([0e49320](https://gitlab.com/Hedzer/snice/commit/0e4932048c63e2a33701c666bf47da6c20d1c96c))

# [1.13.0](https://gitlab.com/Hedzer/snice/compare/v1.12.0...v1.13.0) (2025-09-11)


### Features

* added release for components ([9140964](https://gitlab.com/Hedzer/snice/commit/9140964c4400cd23a19b1c39e0dcee1ac1ea5b28))

# [1.12.0](https://gitlab.com/Hedzer/snice/compare/v1.11.0...v1.12.0) (2025-09-11)


### Features

* login component ([93b5fd7](https://gitlab.com/Hedzer/snice/commit/93b5fd7a54e950f4af8a65a14351648257707ed5))

# [1.11.0](https://gitlab.com/Hedzer/snice/compare/v1.10.1...v1.11.0) (2025-09-11)


### Bug Fixes

* broken template ([74eaab2](https://gitlab.com/Hedzer/snice/commit/74eaab20b50d8d0a1fb76c29d6f5d230ab794fca))
* doc inaccuracies ([4d0dda4](https://gitlab.com/Hedzer/snice/commit/4d0dda473d3538d2124dc0ed6b25472bec5eddf9))
* eliminated element references from router ([2e88c6a](https://gitlab.com/Hedzer/snice/commit/2e88c6aee7462c191bc0fcc5a2bba89cd6215b9c))
* layout sizing fixes ([83c555d](https://gitlab.com/Hedzer/snice/commit/83c555dc8bead90e2aad7e737ed27b8f559ea4ee))
* layout transition fixes ([d1c837a](https://gitlab.com/Hedzer/snice/commit/d1c837ace487336cdd3786b08b36656880bc818e))


### Features

* added date picker ([3c49285](https://gitlab.com/Hedzer/snice/commit/3c49285cdf9320f7ce33e9485b431355901bc795))
* added layouts ([b19d709](https://gitlab.com/Hedzer/snice/commit/b19d7096a1fae93c69114315205d30de8e128451))
* readme improvements ([fb83246](https://gitlab.com/Hedzer/snice/commit/fb83246e90774368c34d1ee7065b6606ee46e718))
* readme improvements ([5e87db6](https://gitlab.com/Hedzer/snice/commit/5e87db67d32d1655c9dc051817a6493ddbbc58db))

## [1.10.1](https://gitlab.com/Hedzer/snice/compare/v1.10.0...v1.10.1) (2025-09-09)


### Bug Fixes

* demo app clear all todos ([201baa3](https://gitlab.com/Hedzer/snice/commit/201baa341be87821791705770c1a124565614d7d))
* improved npm SEO ([f15c2d6](https://gitlab.com/Hedzer/snice/commit/f15c2d6d4e676871f4356ade862e110a12e53b4f))
* improved npm SEO ([da6b455](https://gitlab.com/Hedzer/snice/commit/da6b455c192239afc0dc6a22bb37eab3544fb09d))
* package details ([65fb6c4](https://gitlab.com/Hedzer/snice/commit/65fb6c4cf77e8bb9ae9261d830440edc9083b1e4))

# [1.10.0](https://gitlab.com/Hedzer/snice/compare/v1.9.0...v1.10.0) (2025-09-09)


### Bug Fixes

* added reflection to missing component properties ([9627359](https://gitlab.com/Hedzer/snice/commit/962735937bac14859d252a03780234c75753836e))
* breadcrum validations & imports ([150541d](https://gitlab.com/Hedzer/snice/commit/150541d55573fda001aed5d9aa37c12fc0d47010))
* tooltip ui speech bubble ([34bcb23](https://gitlab.com/Hedzer/snice/commit/34bcb23ae71fbb3f85ef12eb9860e6e8f77cba63))


### Features

* added [@part](https://gitlab.com/part) decorator ([80144e6](https://gitlab.com/Hedzer/snice/commit/80144e6a9d4292c18619eb14033e476d25128972))
* added alert, breadcrumbs, and card components ([d09024b](https://gitlab.com/Hedzer/snice/commit/d09024b7be9e0ae9e4957a8f3aec3817606d1416))
* added drawer ([806246d](https://gitlab.com/Hedzer/snice/commit/806246d6e2ff6b099feff0f2b566ac10eab243be))
* added SimpleArray ([28850c0](https://gitlab.com/Hedzer/snice/commit/28850c0ea0b4649d4a63bd920d00746623e2bc23))
* added support for Date and BigInt props ([1ed446d](https://gitlab.com/Hedzer/snice/commit/1ed446d132dbd9756c100724e4c45d529293de59))
* response improvements ([ac37dac](https://gitlab.com/Hedzer/snice/commit/ac37dac4ade20b911a2a02985d25e055f5da9a8b))
* test & type improvements ([749f42d](https://gitlab.com/Hedzer/snice/commit/749f42d6900c8526b5cefb09009dba6e22ebf91f))

# [1.9.0](https://gitlab.com/Hedzer/snice/compare/v1.8.0...v1.9.0) (2025-08-17)


### Bug Fixes

* element property init bug ([4072d33](https://gitlab.com/Hedzer/snice/commit/4072d33e3220dc41d56145875ef36d2bce406038))
* removed conditional renders ([02e844c](https://gitlab.com/Hedzer/snice/commit/02e844c9353f5476e435eab795325dfcec69de76))
* rendering issues in select ([94511d9](https://gitlab.com/Hedzer/snice/commit/94511d93e6fe368c049ce54e21dd921ad55aab9b))


### Features

* added [@observable](https://gitlab.com/observable) ([6fc643d](https://gitlab.com/Hedzer/snice/commit/6fc643d84e190d82663d76d81a1acc040a8c9fc7))
* added accordion component ([bc32c2d](https://gitlab.com/Hedzer/snice/commit/bc32c2d60907cb89a8eed9376b420be30befe26b))
* added avatar, badge, chip, divider, skeleton ([9c8a8d6](https://gitlab.com/Hedzer/snice/commit/9c8a8d6aa1f45f81272c5963382fa0c930b9599d))
* added checkbox, inputs, radio, select, switch components ([fef094a](https://gitlab.com/Hedzer/snice/commit/fef094a90fa55e6c402397bd9fe580ed67bc2e12))
* added debouncing & throttling for events ([2106ac7](https://gitlab.com/Hedzer/snice/commit/2106ac7d60af8da901908595d3a52cf0101c3a36))
* added event keyboard filters ([ecc1b78](https://gitlab.com/Hedzer/snice/commit/ecc1b786762056ffd3d78e4a0e8681a6c3a8998f))
* added select option icons ([ea656f9](https://gitlab.com/Hedzer/snice/commit/ea656f91cd1597a2b50d7a26a45ce491ff118efd))
* added toast component ([a2148e8](https://gitlab.com/Hedzer/snice/commit/a2148e85fc8f192f6d0810acb94ce11e7c0b5afb))
* added tooltips ([d1c317e](https://gitlab.com/Hedzer/snice/commit/d1c317eb9ea1d4ede6573bcfc8c5aa3b4601acd6))
* progress component ([30ec9e9](https://gitlab.com/Hedzer/snice/commit/30ec9e923b6e4e67225af45c7b3aeea5cc5772a8))
* same handler multiple events for [@on](https://gitlab.com/on) ([11c46f9](https://gitlab.com/Hedzer/snice/commit/11c46f955be6b327a564f68a1b4ddc0642d781d2))

# [1.8.0](https://gitlab.com/Hedzer/snice/compare/v1.7.0...v1.8.0) (2025-08-15)


### Bug Fixes

* boolean properties with =true/false ([799356d](https://gitlab.com/Hedzer/snice/commit/799356da40b379c5f9a9ec03e588d70c7dbb5235))


### Features

* added modal component ([102a11e](https://gitlab.com/Hedzer/snice/commit/102a11e6a0bb152ff65d75dc11feb14519b88b67))
* query/all options, tabs component ([3956cb3](https://gitlab.com/Hedzer/snice/commit/3956cb32c166fbaad228ff423bf9e52b206044c3))
* tab transitions ([a48baca](https://gitlab.com/Hedzer/snice/commit/a48baca3b0ef5e6d908bb6c190031fd8381e703a))

# [1.7.0](https://gitlab.com/Hedzer/snice/compare/v1.6.0...v1.7.0) (2025-08-14)


### Features

* added [@ready](https://gitlab.com/ready) & [@dispose](https://gitlab.com/dispose) lifecycle decorators ([46cb718](https://gitlab.com/Hedzer/snice/commit/46cb71825248d57d73be2b89aae46046c4d93dea))

# [1.6.0](https://gitlab.com/Hedzer/snice/compare/v1.5.0...v1.6.0) (2025-08-14)


### Bug Fixes

* button property ([4283e85](https://gitlab.com/Hedzer/snice/commit/4283e85eebbd0d999171bb9e277d0aff4f5c025b))


### Features

* added [@context](https://gitlab.com/context) for pages, elements, and controllers ([983e829](https://gitlab.com/Hedzer/snice/commit/983e829944cf85641c0214746ad75a3e1fcc9046))
* added route guards & app context ([1881b43](https://gitlab.com/Hedzer/snice/commit/1881b4327ce1f2b960730a925125a9c44606aae1))

# [1.5.0](https://gitlab.com/Hedzer/snice/compare/v1.4.0...v1.5.0) (2025-08-14)


### Bug Fixes

* docs terminology ([768679d](https://gitlab.com/Hedzer/snice/commit/768679de02f9616dbbbf08904de8068c5c26e06e))


### Features

* added css import support to templates ([89a5cbf](https://gitlab.com/Hedzer/snice/commit/89a5cbf6315be8067931bf899fc621605ad641da))

# [1.4.0](https://gitlab.com/Hedzer/snice/compare/v1.3.0...v1.4.0) (2025-08-13)


### Features

* added [@watch](https://gitlab.com/watch) ([147f402](https://gitlab.com/Hedzer/snice/commit/147f4029b92553382754cfac8239dbdfe6db1e18))
* added multiple and all* watchers ([85367b3](https://gitlab.com/Hedzer/snice/commit/85367b371c97ed20bb75e92deee8145a308185dd))

# [1.3.0](https://gitlab.com/Hedzer/snice/compare/v1.2.0...v1.3.0) (2025-08-13)


### Bug Fixes

* added route args ([66e55ea](https://gitlab.com/Hedzer/snice/commit/66e55ea932bd34374d5b7abb8bf0125807d548b6))


### Features

* added create-app command ([ba2535e](https://gitlab.com/Hedzer/snice/commit/ba2535ecda3dd3756ec859b844d9372f7af38b6b))

# [1.2.0](https://gitlab.com/Hedzer/snice/compare/v1.1.0...v1.2.0) (2025-08-12)


### Features

* added detailed docs ([3858e62](https://gitlab.com/Hedzer/snice/commit/3858e6264cf8fb490147402c558ac40572202215))

# [1.1.0](https://gitlab.com/Hedzer/snice/compare/v1.0.0...v1.1.0) (2025-08-12)


### Features

* added publishing ts files ([25bb5f6](https://gitlab.com/Hedzer/snice/commit/25bb5f67748c1b2756399b8c23999a3c87ff3523))

# 1.0.0 (2025-08-12)


### Bug Fixes

* composed event bugs & todo list completion ([ae441a2](https://gitlab.com/Hedzer/snice/commit/ae441a2518809e98496d75f629f9f71b37b9cbf5))
* example bugs ([521d562](https://gitlab.com/Hedzer/snice/commit/521d56277704a092f35bc8fa4729bbe64a8faafc))
* moved entirely to shadow dom ([7974ff6](https://gitlab.com/Hedzer/snice/commit/7974ff69fffcc81bef5a02d3a283cd3fe35dc5f7))
* readme formatting ([c360fda](https://gitlab.com/Hedzer/snice/commit/c360fdaf10985aecb68a6c324d567b96b0ae3a20))


### Features

* added channels ([9eb3455](https://gitlab.com/Hedzer/snice/commit/9eb3455846af50ea217ae7c279c2a6fb408fd4a2))
* added docs ([b029d93](https://gitlab.com/Hedzer/snice/commit/b029d930af1652d77e0c07f76c9158a6c0b0f3d2))
* added native element controllers ([966e3c7](https://gitlab.com/Hedzer/snice/commit/966e3c7e4f438f4d8e97793c8d25545053fde395))
* added tests ([a6d046a](https://gitlab.com/Hedzer/snice/commit/a6d046a998aa0c2f48655a321f8a5eb20d983141))
* controller instance isolation ([5d8336c](https://gitlab.com/Hedzer/snice/commit/5d8336c2a0cc54354a7cd9b1afe6aadeef5eab0d))
* improved readme ([2bc68a9](https://gitlab.com/Hedzer/snice/commit/2bc68a9c059dda3b220e703f92c334f0fb883390))
* moved to global registries ([06c3588](https://gitlab.com/Hedzer/snice/commit/06c35888d0b2850770d65767f0be5b469fa5e181))
