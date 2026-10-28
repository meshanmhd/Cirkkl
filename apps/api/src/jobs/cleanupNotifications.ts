import { createContainer } from "../container";

async function main() {
  const { services } = createContainer();
  const deletedCount = await services.notificationService.cleanupOldNotifications(30);
  process.stdout.write(`Cleaned up ${deletedCount} notifications older than 30 days.\n`);
  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`Error during notifications cleanup: ${err.message}\n`);
  process.exit(1);
});
