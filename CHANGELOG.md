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
