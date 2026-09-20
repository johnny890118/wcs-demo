import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    files: [
      "pages/legacy/index.js",
      "components/map.js",
      "components/mapPerfect.js",
    ],
    rules: {
      // The legacy React-effect state machine is scheduled for replacement in
      // M7. Keep React 19 diagnostics visible on the explicitly isolated
      // migration reference until its remaining behavior is characterized.
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
];

export default config;
