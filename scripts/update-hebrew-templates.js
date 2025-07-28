const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateHebrewTemplates() {
  try {
    // Update the אישור template
    const confirmationTemplate = await prisma.notificationTemplate.findFirst({
      where: { name: "אישור" },
    });

    if (confirmationTemplate) {
      console.log(
        "Found template:",
        confirmationTemplate.name,
        "active:",
        confirmationTemplate.active,
      );

      // Update the template content
      const updated = await prisma.notificationTemplate.update({
        where: { id: confirmationTemplate.id },
        data: {
          active: true,
          body: "היי {firstName},\n\nההזמנה שלך עבור {petName} אושרה לתאריכים {checkInDate} עד {checkOutDate}.\n\nזמן הגעה: {checkInTime}\n\nאנחנו מצפים לראות אתכם!\n\nאם יש שאלות, אל תהססו להתקשר.\n\nתודה ולהתראות!",
        },
      });

      console.log("Updated template:", updated.name, "active:", updated.active);
    } else {
      console.log("Template אישור not found");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateHebrewTemplates();
