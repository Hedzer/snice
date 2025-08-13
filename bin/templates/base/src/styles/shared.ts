export const containerStyles = `
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
    display: inline-block;
  }
  
  .btn-primary {
    background: var(--primary-color);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--secondary-color);
    transform: translateY(-2px);
  }
  
  .btn-secondary {
    background: transparent;
    color: var(--primary-color);
    border: 2px solid var(--primary-color);
  }
  
  .btn-secondary:hover {
    background: var(--primary-color);
    color: white;
  }
`;

export const navbarStyles = `
  .navbar {
    background: var(--white);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .nav-brand {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
  }
  
  .nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
  }
  
  .nav-link {
    color: var(--text-light);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s;
  }
  
  .nav-link:hover,
  .nav-link.active {
    color: var(--primary-color);
  }
`;