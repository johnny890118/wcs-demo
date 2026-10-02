import { defineConfig, devices } from "@playwright/test";

const webPort = 3100;
const apiPort = 3101;
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results/playwright",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: `MOCK_WCS_PORT=${apiPort} API_SERVICE_TOKEN=e2e-service-token node tests/e2e/support/mock-wcs-api.mjs`,
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: false,
    },
    {
      command: `NEXTAUTH_URL=${baseURL} PUBLIC_SITE_URL=${baseURL} NEXTAUTH_SECRET=e2e-nextauth-secret-with-at-least-32-characters DEMO_ADMIN_USERNAME=e2e-operator DEMO_ADMIN_PASSWORD=e2e-password API_SERVICE_TOKEN=e2e-service-token INTERNAL_API_BASE_URL=http://127.0.0.1:${apiPort} SWP_LIFECYCLE_ENVIRONMENT=test SWP_DEPLOYMENT_PROFILE=private_demo SWP_EQUIPMENT_SOURCE=simulation npm run start -- --hostname 127.0.0.1 --port ${webPort}`,
      url: `${baseURL}/`,
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
