export function loadLocalEnvironment(): void {
  if (process.env.NODE_ENV === "production") return;

  try {
    process.loadEnvFile?.();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}
