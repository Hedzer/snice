import { initialize } from './router';
import './styles/global.css';

// Import theme
import 'snice/components/theme/theme.css';

// Import layout
import 'snice/components/layout/snice-layout-sidebar';

// Import snice components
import 'snice/components/card/snice-card';
import 'snice/components/avatar/snice-avatar';
import 'snice/components/button/snice-button';
import 'snice/components/badge/snice-badge';
import 'snice/components/input/snice-input';
import 'snice/components/textarea/snice-textarea';
import 'snice/components/switch/snice-switch';
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/tabs/snice-tab-panel';
import 'snice/components/stat/snice-stat';
import 'snice/components/list/snice-list';
import 'snice/components/nav/snice-nav';

// Import pages
import './pages/feed-page';
import './pages/profile-page';
import './pages/messages-page';
import './pages/settings-page';
import './pages/not-found-page';

// Initialize router
initialize();
