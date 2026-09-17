import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    files: ["pages/index.js", "components/map.js", "components/mapPerfect.js"],
    rules: {
      // The legacy React-effect state machine is scheduled for replacement in
      // M1. Keep new React 19 diagnostics visible without blocking the safety
      // and dependency upgrade that makes that migration possible.
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
];

export default config;
