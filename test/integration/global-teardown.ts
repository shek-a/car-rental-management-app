import { execSync } from "child_process";

export default async (): Promise<void> => {
  if (process.env.CI) {
    execSync("docker compose -f docker-compose.integration.yml down", {
      stdio: "inherit",
    });
  }
  // Locally: leave containers running for faster re-runs.
};
