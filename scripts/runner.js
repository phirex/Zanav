#!/usr/bin/env node
const path = require("path");
const { execSync } = require("child_process");

/**
 * Simple runner script to execute scripts via cron
 * Can be used like: node runner.js send-notifications
 */

// Get the script name from command line args
const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Please provide a script name to run");
  process.exit(1);
}

// Construct the full path to the script
const scriptPath = path.join(__dirname, `${scriptName}.js`);

try {
  console.log(`Running script: ${scriptPath}`);
  console.log("------------------------------");
  console.log(`Start time: ${new Date().toISOString()}`);
  console.log("------------------------------");

  // Execute the script
  execSync(`node ${scriptPath}`, { stdio: "inherit" });

  console.log("------------------------------");
  console.log(`End time: ${new Date().toISOString()}`);
  console.log("Script execution completed successfully");
} catch (error) {
  console.error("Script execution failed:", error.message);
  process.exit(1);
}
