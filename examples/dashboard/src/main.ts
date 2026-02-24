import { initialize } from './router';
import './styles/global.css';

// Layout
import './components/dashboard-shell';

// Elements
import './components/metric-card';
import './components/bar-chart';
import './components/donut-chart';
import './components/activity-feed';
import './components/data-table';

// Controllers
import './controllers/data-controller';

// Pages
import './pages/overview';
import './pages/reports';
import './pages/settings';

// Initialize router
initialize();
