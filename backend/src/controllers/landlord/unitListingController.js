// file: unitListingController.js
import prisma from "../../libs/prismaClient.js";

// ---------------------------------------------- GET ALL CITIES & MUNICIPALITIES ---------------------------------------------- comment it like this in each method

// POST /properties/:propertyId/units/:unitId/listings
export const requestListing = async (req, res) => {
  const { propertyId, unitId } = req.params;
  const landlordId = req.user.id; // from auth middleware

  try {
    // 1. Validate Unit
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { property: true }
    });
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    if (unit.propertyId !== propertyId) {
      return res.status(400).json({ error: "Unit does not belong to this property" });
    }
    if (unit.property.landlordId !== landlordId) {
      return res.status(403).json({ error: "You do not own this property" });
    }
    if (unit.status !== "AVAILABLE") {
      return res.status(400).json({ error: "Unit is not available for listing" });
    }

    // 2. Check for an existing latest listing
    const lastListing = await prisma.listing.findFirst({
      where: { unitId },
      orderBy: { createdAt: "desc" }
    });

    if (lastListing) {
      if (["PENDING", "APPROVED", "ACTIVE"].includes(lastListing.status)) {
        return res.status(400).json({
          error: `Unit already has a ${lastListing.status} listing in progress`
        });
      }

      if (lastListing.status === "BLOCKED") {
        return res.status(400).json({ error: "Unit is blocked from being listed" });
      }
      // REJECTED or EXPIRED → allow resubmission
    }

    // 3. Create a new listing request
    const listing = await prisma.listing.create({
      data: {
        unitId,
        landlordId,
        status: "PENDING",
        attemptCount: lastListing ? lastListing.attemptCount + 1 : 1,
        amount: 1000, // you can calculate/listing fee logic here
        paymentStatus: "UNPAID"
      }
    });

    res.json({
      message: "Listing request submitted successfully",
      listing
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit listing request" });
  }
};


// ---------------------------------------------- GET UNITS LISTING STATUS ----------------------------------------------
// GET /properties/:propertyId/units/listing-status
// Retrieves all units of a property owned by the landlord and groups them by:
//   - ELIGIBLE (no listing yet, unit available)
//   - PENDING
//   - APPROVED
//   - ACTIVE
//   - EXPIRED
//   - REJECTED
//   - BLOCKED
export const getUnitsListingStatus = async (req, res) => {
  const { propertyId } = req.params;
  const landlordId = req.user?.id;

  try {
    // 1. Fetch all units of this property that belong to the landlord
    const units = await prisma.unit.findMany({
      where: {
        propertyId,
        property: { landlordId }
      },
      include: {
        listings: {
          orderBy: { createdAt: "desc" },
          take: 1 // only latest listing per unit
        }
      }
    });

    if (!units || units.length === 0) {
      return res.status(404).json({ error: "No units found for this property" });
    }

    // 2. Initialize categories by status
    const categories = {
      ELIGIBLE: [],
      PENDING: [],
      APPROVED: [],
      ACTIVE: [],
      EXPIRED: [],
      REJECTED: [],
      BLOCKED: []
    };

    // 3. Map units into categories
    units.forEach((unit) => {
      const latestListing = unit.listings[0];

      if (latestListing) {
        const status = latestListing.status;
        if (categories[status]) {
          categories[status].push({ unit, listing: latestListing });
        }
      } else {
        // ELIGIBLE = no listing and unit is available
        if (unit.status === "AVAILABLE") {
          categories.ELIGIBLE.push({ unit });
        }
      }
    });

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch units listing status" });
  }
};
