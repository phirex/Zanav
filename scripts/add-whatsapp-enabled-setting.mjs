import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if the setting already exists
    const existingSetting = await prisma.setting.findFirst({
      where: {
        key: "whatsappEnabled",
      },
    });

    if (existingSetting) {
      console.log("WhatsApp enabled setting already exists.");
    } else {
      // Create the setting with default value of false
      const setting = await prisma.setting.create({
        data: {
          key: "whatsappEnabled",
          value: "false",
          category: "whatsapp",
        },
      });
      console.log("WhatsApp enabled setting created:", setting);
    }
  } catch (error) {
    console.error("Error adding WhatsApp enabled setting:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
