import { AppDataSource } from "./data-source";
import { User, UserRole } from "./models/User"; // Assuming you have roles, adjust if not!
import { Event, EventStatus } from "./models/Event";
import { TicketTier } from "./models/TicketTier";
import { Booking, BookingStatus } from "./models/Booking";

async function seedDatabase() {
    console.log("🌱 Connecting to the database...");
    await AppDataSource.initialize();

    // WARNING: This will drop your existing tables and recreate them to ensure a clean slate!
    await AppDataSource.synchronize(true); 

    console.log("🧹 Database wiped clean. Generating seed data...");

    const userRepository = AppDataSource.getRepository(User);
    const eventRepository = AppDataSource.getRepository(Event);
    const tierRepository = AppDataSource.getRepository(TicketTier);
    const bookingRepository = AppDataSource.getRepository(Booking);

    // 1. Create Organizer & Attendees
    const organizer = userRepository.create({ name: "Event Corp", email: "org@test.com", password: "hash", role: "organizer" });
    const user1 = userRepository.create({ name: "Alice", email: "alice@test.com", password: "hash", role: "user" });
    const user2 = userRepository.create({ name: "Bob", email: "bob@test.com", password: "hash", role: "user" });
    await userRepository.save([organizer, user1, user2]);

    // 2. Create Events (Targeting the specific assignment questions!)
    const event1 = eventRepository.create({
        title: "Tech Summit 2025", // For Question 4
        description: "Biggest tech event of the year.",
        venue_name: "Convention Center",
        city: "Mumbai", // For Question 2 (Q1 top city)
        start_date: new Date("2025-01-15T09:00:00Z"), // January 2025 for Q1
        end_date: new Date("2025-01-17T17:00:00Z"),
        status: EventStatus.PUBLISHED,
        organizer: organizer
    });

    const event2 = eventRepository.create({
        title: "Winter Music Fest",
        description: "Live music.",
        venue_name: "Central Park",
        city: "Bangalore",
        start_date: new Date("2025-02-20T18:00:00Z"), // Feb 2025 (Still Q1)
        end_date: new Date("2025-02-20T23:00:00Z"),
        status: EventStatus.PUBLISHED,
        organizer: organizer
    });

    await eventRepository.save([event1, event2]);

    // 3. Create Ticket Tiers
    const tier1 = tierRepository.create({ name: "VIP", price: 5000, total_capacity: 50, sold_count: 10, event: event1 });
    const tier2 = tierRepository.create({ name: "General Admission", price: 1000, total_capacity: 500, sold_count: 50, event: event1 });
    const tier3 = tierRepository.create({ name: "General Admission", price: 1500, total_capacity: 200, sold_count: 5, event: event2 });

    await tierRepository.save([tier1, tier2, tier3]);

    // 4. Create Bookings (To generate Revenue!)
    const booking1 = bookingRepository.create({
        user: user1,
        tier: tier1,
        quantity: 2,
        total_amount: 10000, // 2 * 5000
        status: BookingStatus.BOOKED
    });

    const booking2 = bookingRepository.create({
        user: user2,
        tier: tier2,
        quantity: 5,
        total_amount: 5000, // 5 * 1000
        status: BookingStatus.BOOKED
    });

    await bookingRepository.save([booking1, booking2]);

    console.log("✅ Database seeded successfully with targeted test data!");
    process.exit(0);
}

seedDatabase().catch((error) => console.log("❌ Error seeding database:", error));