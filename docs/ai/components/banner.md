# snice-banner

Fixed position notification banner.

## Properties

```typescript
variant: 'info'|'success'|'warning'|'error' = 'info';
position: 'top'|'bottom' = 'top';
message: string = '';
dismissible: boolean = true;
icon: string = '';
actionText: string = '';
open: boolean = false;
```

## Methods

- `show()` - Show banner
- `hide()` - Hide banner
- `toggle()` - Toggle banner

## Events

- `open` - {banner}
- `close` - {banner}
- `action` - {banner}

## Usage

```html
<!-- Basic -->
<snice-banner message="This is an info message" open></snice-banner>

<!-- Variants -->
<snice-banner variant="info" message="Info"></snice-banner>
<snice-banner variant="success" message="Success"></snice-banner>
<snice-banner variant="warning" message="Warning"></snice-banner>
<snice-banner variant="error" message="Error"></snice-banner>

<!-- Position -->
<snice-banner position="top" message="Top banner" open></snice-banner>
<snice-banner position="bottom" message="Bottom banner" open></snice-banner>

<!-- With action -->
<snice-banner
  message="Update available"
  action-text="Update Now"
  open
></snice-banner>

<!-- Not dismissible -->
<snice-banner
  message="Important notice"
  dismissible="false"
  open
></snice-banner>

<!-- Custom icon -->
<snice-banner
  icon="🎉"
  message="Celebration!"
  open
></snice-banner>

<!-- API -->
<snice-banner id="banner" message="Hello"></snice-banner>
<script>
const banner = document.querySelector('#banner');
banner.show();
banner.hide();
banner.toggle();
</script>
```

## Features

- 4 variants (info, success, warning, error)
- Top or bottom positioning
- Dismissible with close button
- Optional action button
- Smooth slide animation
- Fixed positioning
- Accessible (role=alert)
