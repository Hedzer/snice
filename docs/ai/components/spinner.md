# snice-spinner

Animated loading spinner.

## Properties

```typescript
size: 'small'|'medium'|'large'|'xl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info' = 'primary';
label: string = '';
thickness: number = 4;
```

## Usage

```html
<!-- Basic -->
<snice-spinner></snice-spinner>

<!-- Sizes -->
<snice-spinner size="small"></snice-spinner>
<snice-spinner size="medium"></snice-spinner>
<snice-spinner size="large"></snice-spinner>
<snice-spinner size="xl"></snice-spinner>

<!-- Colors -->
<snice-spinner color="primary"></snice-spinner>
<snice-spinner color="success"></snice-spinner>
<snice-spinner color="warning"></snice-spinner>
<snice-spinner color="error"></snice-spinner>
<snice-spinner color="info"></snice-spinner>

<!-- With label -->
<snice-spinner label="Loading..."></snice-spinner>

<!-- Custom thickness -->
<snice-spinner thickness="6"></snice-spinner>
```

## Features

- Smooth circular animation
- 4 sizes
- 5 color variants
- Optional label
- Accessible (role=status, aria-label)
- Lightweight SVG-based
