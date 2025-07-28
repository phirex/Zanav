const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function activateTemplate() {
  try {
    // Get the inactive template
    const template = await prisma.notificationTemplate.findUnique({
      where: { name: "booking_confirmation" },
    });

    if (template) {
      console.log("Found template:", template.name, "active:", template.active);

      // Update to make it active with Hebrew text
      const updated = await prisma.notificationTemplate.update({
        where: { id: template.id },
        data: {
          active: true,
          body: "היי {firstName},\n\nההזמנה שלך עבור {petName} אושרה לתאריכים {checkInDate} עד {checkOutDate}.\n\nאם יש אישורי בעיה נא להתקשר!\n\nתודה!",
        },
      });

      console.log("Updated template:", updated.name, "active:", updated.active);
    } else {
      console.log("Template not found");
    }

    // Update the check-in reminder templates
    const checkInTemplate = await prisma.notificationTemplate.findFirst({
      where: { name: "תזכורת 24 שעות" },
    });

    if (checkInTemplate) {
      console.log(
        "Found template:",
        checkInTemplate.name,
        "active:",
        checkInTemplate.active,
      );

      // Update the template content
      const updated = await prisma.notificationTemplate.update({
        where: { id: checkInTemplate.id },
        data: {
          active: true,
          body: "היי {firstName}!\n\nמקווה שאת/ה שלא שכחת שמחר אתה מביא את {petName} אלינו!\n\nאם יש איזשהי בעיה נא להתקשר.\n\nתודה!",
        },
      });

      console.log("Updated template:", updated.name, "active:", updated.active);
    }

    // Update the 1-hour check-in reminder template
    const hourTemplate = await prisma.notificationTemplate.findFirst({
      where: { name: "תזכורת שעה" },
    });

    if (hourTemplate) {
      console.log(
        "Found template:",
        hourTemplate.name,
        "active:",
        hourTemplate.active,
      );

      // Update the template content
      const updated = await prisma.notificationTemplate.update({
        where: { id: hourTemplate.id },
        data: {
          active: true,
          body: "היי {firstName}!\n\nתזכורת אחרונה - אנו מחכים ל{petName} היום בשעה {checkInTime}.\n\nאם יש עיכוב, נא להודיע!\n\nיוליה",
        },
      });

      console.log("Updated template:", updated.name, "active:", updated.active);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

activateTemplate();
