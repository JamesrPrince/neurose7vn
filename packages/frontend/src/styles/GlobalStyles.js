import React from "react";
import { Global, css } from "@emotion/react";

// Define colors as variables for easy reference and consistency
export const colors = {
  primary: {
    main: "#4caefd",
    light: "#7cc4ff",
    dark: "#2a8fd0",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#ff6b6b",
    light: "#ff9e9e",
    dark: "#c54040",
    contrastText: "#ffffff",
  },
  neutral: {
    darkest: "#2a3b4c",
    dark: "#3e5c76",
    medium: "#748cab",
    light: "#f0f4f8",
    lightest: "#ffffff",
  },
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  text: {
    primary: "#333333",
    secondary: "#5a5a5a",
    disabled: "#9e9e9e",
  },
  background: {
    default: "#ffffff",
    paper: "#f5f5f5",
  },
  divider: "#e0e0e0",
};

// Define font families
export const fonts = {
  primary:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  secondary:
    '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  code: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
};

// Define spacing system
export const spacing = (multiplier = 1) => `${0.25 * multiplier}rem`;

// Define typographic scale
export const typography = {
  h1: {
    fontFamily: fonts.secondary,
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
    "@media (max-width: 768px)": {
      fontSize: "2rem",
    },
  },
  h2: {
    fontFamily: fonts.secondary,
    fontSize: "2rem",
    fontWeight: 700,
    lineHeight: 1.2,
    "@media (max-width: 768px)": {
      fontSize: "1.75rem",
    },
  },
  h3: {
    fontFamily: fonts.secondary,
    fontSize: "1.75rem",
    fontWeight: 600,
    lineHeight: 1.3,
    "@media (max-width: 768px)": {
      fontSize: "1.5rem",
    },
  },
  h4: {
    fontFamily: fonts.secondary,
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.3,
    "@media (max-width: 768px)": {
      fontSize: "1.25rem",
    },
  },
  h5: {
    fontFamily: fonts.secondary,
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.4,
    "@media (max-width: 768px)": {
      fontSize: "1.1rem",
    },
  },
  h6: {
    fontFamily: fonts.secondary,
    fontSize: "1rem",
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body1: {
    fontFamily: fonts.primary,
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  body2: {
    fontFamily: fonts.primary,
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  caption: {
    fontFamily: fonts.primary,
    fontSize: "0.75rem",
    lineHeight: 1.5,
  },
  button: {
    fontFamily: fonts.primary,
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.5,
    textTransform: "none",
  },
};

const globalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --primary: #0070f3;
    --primary-dark: #0051cc;
    --secondary: #666;
    --error: #dc3545;
    --success: #28a745;
    --warning: #ffc107;
    --border: #eaeaea;
    --background: #f8f9fa;
  }

  html,
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background-color: #fff;
    color: #333;
    line-height: 1.6;
    font-size: 16px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 2.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.75rem;
  }

  h4 {
    font-size: 1.5rem;
  }

  h5 {
    font-size: 1.25rem;
  }

  h6 {
    font-size: 1rem;
  }

  p {
    margin-bottom: 1rem;
  }

  a {
    color: var(--primary);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--primary-dark);
      text-decoration: underline;
    }
  }

  button {
    font-family: inherit;
  }

  input,
  textarea,
  select {
    font-family: inherit;
    font-size: inherit;
  }

  /* Form styles */
  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }

    .error {
      color: var(--error);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  }

  /* Alert styles */
  .alert {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;

    &.alert-success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    &.alert-error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    &.alert-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
    }

    &.alert-info {
      background-color: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
    }
  }

  /* Card styles */
  .card {
    background-color: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  }

  /* Grid system */
  .grid {
    display: grid;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 768px) {
    .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .grid-cols-4 {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Utility classes */
  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .text-primary {
    color: var(--primary);
  }

  .text-secondary {
    color: var(--secondary);
  }

  .text-success {
    color: var(--success);
  }

  .text-error {
    color: var(--error);
  }

  .text-warning {
    color: var(--warning);
  }

  .mb-1 {
    margin-bottom: 0.25rem;
  }

  .mb-2 {
    margin-bottom: 0.5rem;
  }

  .mb-3 {
    margin-bottom: 1rem;
  }

  .mb-4 {
    margin-bottom: 1.5rem;
  }

  .mb-5 {
    margin-bottom: 2rem;
  }
`;

const GlobalStyles = () => <Global styles={globalStyles} />;

export default GlobalStyles;
