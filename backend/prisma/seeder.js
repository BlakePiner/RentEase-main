import prisma from "../src/libs/prismaClient.js";

async function main() {
  // ---------------------------
  // Cities in Cebu Province
  // ---------------------------
  const cities = [
    "Cebu City",
    "Mandaue City",
    "Lapu-Lapu City",
    "Bogo City",
    "Carcar City",
    "Danao City",
    "Naga City",
    "Talisay City",
    "Toledo City"
  ];

  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------
  // Municipalities in Cebu Province
  // ---------------------------
  const municipalities = [
    "Alcantara",
    "Alcoy",
    "Alegria",
    "Aloguinsan",
    "Argao",
    "Asturias",
    "Badian",
    "Balamban",
    "Bantayan",
    "Barili",
    "Boljoon",
    "Borbon",
    "Carmen",
    "Catmon",
    "Compostela",
    "Consolacion",
    "Cordova",
    "Daan Bantayan",
    "Dalaguete",
    "Dumanjug",
    "Ginatilan",
    "Liloan",
    "Madridejos",
    "Malabuyoc",
    "Medellin",
    "Minglanilla",
    "Moalboal",
    "Oslob",
    "Pilar",
    "Pinamungajan",
    "Poro",
    "Ronda",
    "Samboan",
    "San Fernando",
    "San Francisco",
    "San Remigio",
    "Santa Fe",
    "Santander",
    "Sibonga",
    "Sogod",
    "Tabogon",
    "Tabuelan",
    "Tuburan",
    "Tudela"
  ];

  for (const name of municipalities) {
    await prisma.municipality.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ---------------------------
  // Amenities
  // ---------------------------
  const amenities = [
    { name: "Wifi", category: "Utility" },
    { name: "Aircon", category: "Utility" },
    { name: "Electric Fan", category: "Utility" },
    { name: "Power Backup / Generator", category: "Utility" },
    { name: "Water Heater", category: "Utility" },

    { name: "Swimming Pool", category: "Facility" },
    { name: "Gym / Fitness Center", category: "Facility" },
    { name: "Parking Space", category: "Facility" },
    { name: "Balcony", category: "Facility" },
    { name: "Garden / Outdoor Space", category: "Facility" },

    { name: "Refrigerator", category: "Kitchen" },
    { name: "Stove / Cooktop", category: "Kitchen" },
    { name: "Microwave", category: "Kitchen" },
    { name: "Dining Table", category: "Kitchen" },
    { name: "Shared Kitchen", category: "Kitchen" },

    { name: "Bedframe & Mattress", category: "Room Feature" },
    { name: "Closet / Wardrobe", category: "Room Feature" },
    { name: "Study Table / Desk", category: "Room Feature" },
    { name: "Private Bathroom", category: "Room Feature" },
    { name: "Shared Bathroom", category: "Room Feature" },

    { name: "24/7 Security", category: "Security" },
    { name: "CCTV", category: "Security" },
    { name: "Fire Alarm System", category: "Security" },

    { name: "Laundry Area", category: "Service" },
    { name: "Housekeeping Service", category: "Service" },
  ];

  for (const a of amenities) {
    await prisma.amenity.upsert({
      where: { name: a.name },
      update: {},
      create: { name: a.name, category: a.category },
    });
  }

  console.log("✅ Cities, Municipalities, and Amenities seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
