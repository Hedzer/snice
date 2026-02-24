import { initialize } from './router';
import './styles/global.css';

// Layout
import './components/app-shell';

// Components
import './components/task-card';
import './components/board-column';
import './components/task-modal';
import './components/stats-bar';

// Controllers
import './controllers/task-controller';

// Pages
import './pages/login';
import './pages/board';
import './pages/settings';

// Initialize router
initialize();
