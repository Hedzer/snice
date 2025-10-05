import { initialize } from './router';
import './styles/global.css';

// Import a layout
import 'snice/components/layout/snice-layout';

// Import components
import './components/counter-button';

// Import controllers
import './controllers/counter-controller';

// Import pages
import './pages/home-page';
import './pages/about-page';
import './pages/not-found-page';

// Initialize router
initialize();