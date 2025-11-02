import { initialize } from './router';
import './styles/global.css';

// Import snice layout and components
import 'snice/components/layout/snice-layout';
import 'snice/components/button/snice-button';
import 'snice/components/card/snice-card';
import 'snice/components/input/snice-input';
import 'snice/components/alert/snice-alert';
import 'snice/components/avatar/snice-avatar';
import 'snice/components/empty-state/snice-empty-state';
import 'snice/components/spinner/snice-spinner';

// Import pages
import './pages/login';
import './pages/dashboard';
import './pages/profile';
import './pages/notifications';

// Import and start daemons
import { getNotificationsDaemon } from './daemons/notifications';

// Start notifications daemon
const notificationsDaemon = getNotificationsDaemon();
notificationsDaemon.start();

// Initialize router
initialize();

// Register service worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('Service Worker registered:', registration);
      },
      (error) => {
        console.error('Service Worker registration failed:', error);
      }
    );
  });
}
