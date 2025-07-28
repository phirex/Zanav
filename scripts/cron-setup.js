const cron = require("node-cron");
const path = require("path");
const { spawn } = require("child_process");
const { format } = require("date-fns");

console.log("Starting notification service...");

// Schedule task to run once per minute
cron.schedule("* * * * *", () => {
  const now = new Date();
  const formattedTime = format(now, "yyyy-MM-dd HH:mm:ss");
  console.log(`[${formattedTime}] Running notification check...`);

  // Get path to the send-notifications.js script
  const scriptPath = path.join(__dirname, "send-notifications.js");

  // Spawn the process
  const process = spawn("node", [scriptPath], {
    stdio: "inherit", // Show output in the same console
  });

  // Handle process events
  process.on("close", (code) => {
    console.log(
      `[${formattedTime}] Notification check completed with code ${code}`,
    );
  });

  process.on("error", (err) => {
    console.error(
      `[${formattedTime}] Failed to start notification process:`,
      err,
    );
  });
});

console.log("Notification service started. Press Ctrl+C to stop.");
