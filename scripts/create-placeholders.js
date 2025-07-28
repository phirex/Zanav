const fs = require("fs");
const path = require("path");

// Create the images directory if it doesn't exist
const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to create an SVG placeholder image
function createPlaceholderSVG(
  filename,
  width,
  height,
  text,
  bgColor = "#f3f4f6",
  textColor = "#374151",
) {
  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="${textColor}">
    ${text}
  </text>
</svg>
  `.trim();

  fs.writeFileSync(path.join(imagesDir, filename), svg);
  console.log(`Created ${filename}`);
}

// Create placeholders for the landing page
const placeholders = [
  {
    filename: "logo.svg",
    width: 180,
    height: 50,
    text: "Zanav.io Logo",
    bgColor: "#ffffff",
    textColor: "#1F2937",
  },
  {
    filename: "dashboard-screenshot.png",
    width: 800,
    height: 600,
    text: "Dashboard Screenshot",
    bgColor: "#e6f2ff",
    textColor: "#1e40af",
  },
  {
    filename: "calendar-screenshot.png",
    width: 600,
    height: 400,
    text: "Calendar View",
    bgColor: "#e6f7ff",
    textColor: "#0369a1",
  },
  {
    filename: "clients-screenshot.png",
    width: 600,
    height: 400,
    text: "Client Management",
    bgColor: "#f5e6ff",
    textColor: "#6b21a8",
  },
  {
    filename: "payments-screenshot.png",
    width: 600,
    height: 400,
    text: "Payments Management",
    bgColor: "#ffe6eb",
    textColor: "#9d174d",
  },
  {
    filename: "financial-screenshot.png",
    width: 600,
    height: 400,
    text: "Financial Reports",
    bgColor: "#fff7e6",
    textColor: "#92400e",
  },
  {
    filename: "dashboard-full.png",
    width: 1200,
    height: 800,
    text: "Dashboard Full View",
    bgColor: "#e6f2ff",
    textColor: "#1e40af",
  },
];

// Create each placeholder
placeholders.forEach(
  ({ filename, width, height, text, bgColor, textColor }) => {
    createPlaceholderSVG(filename, width, height, text, bgColor, textColor);
  },
);

console.log("All placeholders created successfully!");
