import { execSync } from "child_process";

export default async (): Promise<void> => {
  execSync("docker compose -f docker-compose.integration.yml up -d --wait", {
    stdio: "inherit",
  });
};
