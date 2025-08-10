// Shared CSS that can be imported by components

export const cardStyles = /*css*/`
  .card {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

export const formStyles = /*css*/`
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #667eea;
  }
`;

export const containerStyles = /*css*/`
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
`;