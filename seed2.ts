import { AppDataSource } from "./data-source";
import { User } from "./models/User";
import { Event, EventStatus } from "./models/Event";
import { TicketTier } from "./models/TicketTier";
import { Booking, BookingStatus } from "./models/Booking";

async function seedDatabase() {
    console.log("🌱 Connecting to the database...");
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true); 

    console.log("🧹 Database wiped clean. Generating seed data...");

    // 1. Create Users (Safely bypassing TypeScript strictness)
    const organizer = new User();
    Object.assign(organizer, { name: "Event Corp", email: "org@test.com", password: "hash", role: "organizer" });

    const user1 = new User();
    Object.assign(user1, { name: "Alice", email: "alice@test.com", password: "hash", role: "user" });

    const user2 = new User();
    Object.assign(user2, { name: "Bob", email: "bob@test.com", password: "hash", role: "user" });

    await AppDataSource.getRepository(User).save([organizer, user1, user2]);

    // 2. Create Events
    const event1 = new Event();
    Object.assign(event1, {
        title: "Tech Summit 2025",
        description: "Biggest tech event of the year.",
        venue_name: "Convention Center",
        city: "Mumbai",
        start_date: new Date("2025-01-15T09:00:00Z"),
        end_date: new Date("2025-01-17T17:00:00Z"),
        status: EventStatus.PUBLISHED, // Assumes your enum is PUBLISHED
        organizer: organizer
    });

    const event2 = new Event();
    Object.assign(event2, {
        title: "Winter Music Fest",
        description: "Live music.",
        venue_name: "Central Park",
        city: "Bangalore",
        start_date: new Date("2025-02-20T18:00:00Z"),
        end_date: new Date("2025-02-20T23:00:00Z"),
        status: EventStatus.PUBLISHED,
        organizer: organizer
    });

    await AppDataSource.getRepository(Event).save([event1, event2]);

    // 3. Create Ticket Tiers
    const tier1 = new TicketTier();
    Object.assign(tier1, { name: "VIP", price: 5000, total_capacity: 50, sold_count: 10, event: event1 });

    const tier2 = new TicketTier();
    Object.assign(tier2, { name: "General Admission", price: 1000, total_capacity: 500, sold_count: 50, event: event1 });

    const tier3 = new TicketTier();
    Object.assign(tier3, { name: "General Admission", price: 1500, total_capacity: 200, sold_count: 5, event: event2 });

    await AppDataSource.getRepository(TicketTier).save([tier1, tier2, tier3]);

    // 4. Create Bookings
    const booking1 = new Booking();
    Object.assign(booking1, {
        user: user1,
        tier: tier1,
        quantity: 2,
        total_amount: 10000,
        status: BookingStatus.Booked // Matching your exact enum casing!
    });

    const booking2 = new Booking();
    Object.assign(booking2, {
        user: user2,
        tier: tier2,
        quantity: 5,
        total_amount: 5000,
        status: BookingStatus.Booked
    });

    await AppDataSource.getRepository(Booking).save([booking1, booking2]);

    console.log("✅ Database seeded successfully with targeted test data!");
    process.exit(0);
}

seedDatabase().catch((error) => console.log("❌ Error seeding database:", error));