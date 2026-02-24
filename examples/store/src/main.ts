import { initialize } from './router';
import './styles/global.css';

// Import layout
import './components/store-layout';

// Import components
import './components/product-card';
import './components/cart-item';
import './components/store-modal';

// Import pages
import './pages/home';
import './pages/products';
import './pages/product-detail';
import './pages/cart';
import './pages/login';
import './pages/checkout';

// Initialize router
initialize();
