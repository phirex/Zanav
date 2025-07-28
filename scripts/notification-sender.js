#!/usr/bin/env node
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");

// Configuration
const API_URL = "http://localhost:3000/api/notifications/process-public";
const CHECK_INTERVAL = 30_000; // 30 seconds
const TOKEN = process.env.API_TOKEN || "";

console.log("Starting notification sender...");
console.log(
  `Will check for notifications every ${CHECK_INTERVAL / 1000} seconds`,
);
console.log(`API URL: ${API_URL}`);

// Function to process notifications by calling the API
async function processNotifications() {
  return new Promise((resolve, reject) => {
    console.log(
      `[${new Date().toISOString()}] Checking for pending notifications...`,
    );

    // Determine if we're using http or https
    const client = API_URL.startsWith("https") ? https : http;

    // Set up the request options
    const options = {
      headers: {
        "Content-Type": "application/json",
        Authorization: TOKEN ? `Bearer ${TOKEN}` : "",
      },
    };

    // Make the request
    const req = client.get(API_URL, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            console.log(
              `Processed ${result.processed || 0} notifications, sent ${result.sent || 0} successfully`,
            );
            resolve(result);
          } catch (error) {
            console.error("Error parsing API response:", error);
            reject(error);
          }
        } else {
          console.error(`API returned status ${res.statusCode}: ${data}`);
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error making API request:", error);
      reject(error);
    });

    req.end();
  });
}

// Run the sender in a loop
async function runSender() {
  while (true) {
    try {
      await processNotifications();
    } catch (error) {
      console.error("Error in notification sender:", error);
    }

    // Wait for the next interval
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }
}

// Start the sender
runSender();
