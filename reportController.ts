import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking } from "../models/Booking";
import { Event } from "../models/Event";

export class ReportController {
    
    // 📊 Question 1: Total revenue for January 2025
    static async getJan2025Revenue(req: Request, res: Response): Promise<void> {
        const result = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.start_date >= :start", { start: "2025-01-01" })
            .andWhere("event.start_date <= :end", { end: "2025-01-31" })
            .andWhere("booking.status = :status", { status: "booked" }) // Ignore cancelled ones
            .select("SUM(booking.total_amount)", "totalRevenue")
            .getRawOne();

        res.json({
            month: "January 2025",
            totalRevenue: result ? Number(result.totalRevenue) : 0
        });
    }

    // 📊 Question 2: City with highest tickets sold in Q1 2025
    static async getTopCityQ1(req: Request, res: Response): Promise<void> {
        const result = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.start_date >= :start", { start: "2025-01-01" })
            .andWhere("event.start_date <= :end", { end: "2025-03-31" })
            .andWhere("booking.status = :status", { status: "booked" })
            .select("event.city", "city")
            .addSelect("SUM(booking.quantity)", "totalTicketsSold")
            .groupBy("event.city")
            .orderBy("totalTicketsSold", "DESC")
            .limit(1) // Only get the #1 top city
            .getRawOne();

        res.json({
            topCity: result ? result.city : null,
            ticketsSold: result ? Number(result.totalTicketsSold) : 0
        });
    }

    // 📊 Question 3: Top 3 best-selling events of all time
    static async getTop3Events(req: Request, res: Response): Promise<void> {
        // Here we query the Event table directly and join the Tiers to sum up the sold_count!
        const results = await AppDataSource.getRepository(Event)
            .createQueryBuilder("event")
            .innerJoin("event.tiers", "tier") // Requires @OneToMany("tiers") in your Event model
            .select("event.id", "id")
            .addSelect("event.title", "title")
            .addSelect("SUM(tier.sold_count)", "totalSold")
            .groupBy("event.id")
            .orderBy("totalSold", "DESC")
            .limit(3) // Top 3
            .getRawMany();

        res.json({
            topEvents: results.map(row => ({
                id: row.id,
                title: row.title,
                totalTicketsSold: Number(row.totalSold)
            }))
        });
    }
}
// 📊 Question 4: "Tech Summit 2025" - Tickets per tier and revenue percentage
    static async getTechSummitStats(req: Request, res: Response): Promise<void> {
        // First, get the total revenue for the event to calculate percentages
        const totalRevResult = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.title = :title", { title: "Tech Summit 2025" })
            .andWhere("booking.status = :status", { status: "booked" })
            .select("SUM(booking.total_amount)", "totalRevenue")
            .getRawOne();

        const totalRevenue = totalRevResult ? Number(totalRevResult.totalRevenue) : 0;

        // Next, group by tier
        const tierStats = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.title = :title", { title: "Tech Summit 2025" })
            .andWhere("booking.status = :status", { status: "booked" })
            .select("tier.name", "tierName")
            .addSelect("SUM(booking.quantity)", "ticketsSold")
            .addSelect("SUM(booking.total_amount)", "tierRevenue")
            .groupBy("tier.id")
            .getRawMany();

        const report = tierStats.map(stat => {
            const rev = Number(stat.tierRevenue);
            return {
                tier: stat.tierName,
                ticketsSold: Number(stat.ticketsSold),
                revenue: rev,
                percentageOfTotal: totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(2) + "%" : "0%"
            };
        });

        res.json({ event: "Tech Summit 2025", totalRevenue, tierBreakdown: report });
    }

    // 📊 Question 5: Events with fewer than 10 seats remaining
    static async getAlmostSoldOutEvents(req: Request, res: Response): Promise<void> {
        const results = await AppDataSource.getRepository(Event)
            .createQueryBuilder("event")
            .innerJoin("event.tiers", "tier")
            .select("event.id", "id")
            .addSelect("event.title", "title")
            .addSelect("SUM(tier.total_capacity) - SUM(tier.sold_count)", "remainingSeats")
            .groupBy("event.id")
            .having("SUM(tier.total_capacity) - SUM(tier.sold_count) < 10")
            .getRawMany();

        res.json(results);
    }

    // 📊 Question 6: Average ticket price grouped by city (Published events)
    static async getAvgPriceByCity(req: Request, res: Response): Promise<void> {
        const results = await AppDataSource.getRepository(TicketTier)
            .createQueryBuilder("tier")
            .innerJoin("tier.event", "event")
            .where("event.status = :status", { status: "PUBLISHED" })
            .select("event.city", "city")
            .addSelect("AVG(tier.price)", "averagePrice")
            .groupBy("event.city")
            .getRawMany();

        res.json(results);
    }

    // 📊 Question 7: Unique attendees for a specific organizer
    static async getUniqueAttendeesCount(req: Request, res: Response): Promise<void> {
        const organizerId = req.query.organizerId; // Pass this in the URL query string

        const result = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.organizer_id = :organizerId", { organizerId })
            .select("COUNT(DISTINCT booking.user_id)", "uniqueAttendees")
            .getRawOne();

        res.json({ organizerId, uniqueAttendees: Number(result.uniqueAttendees) });
    }

    // 📊 Question 8: Cancelled bookings & lost revenue per event
    static async getLostRevenue(req: Request, res: Response): Promise<void> {
        const results = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("booking.status = :status", { status: "cancelled" })
            .select("event.title", "eventTitle")
            .addSelect("COUNT(booking.id)", "cancelledBookingsCount")
            .addSelect("SUM(booking.total_amount)", "lostRevenue")
            .groupBy("event.id")
            .getRawMany();

        res.json(results);
    }

    // 📊 Question 9: Tier type generating the most revenue
    static async getTopTierType(req: Request, res: Response): Promise<void> {
        const result = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .where("booking.status = :status", { status: "booked" })
            .select("tier.name", "tierName")
            .addSelect("SUM(booking.total_amount)", "totalRevenue")
            .groupBy("tier.name") // Group by name, not ID, so "VIP" stacks across all events!
            .orderBy("totalRevenue", "DESC")
            .limit(1)
            .getRawOne();

        res.json(result);
    }

    // 📊 Question 10: Published events with zero bookings
    static async getEventsWithZeroBookings(req: Request, res: Response): Promise<void> {
        const results = await AppDataSource.getRepository(Event)
            .createQueryBuilder("event")
            .leftJoin("event.tiers", "tier")
            .leftJoin("tier.bookings", "booking")
            .where("event.status = :status", { status: "PUBLISHED" })
            .groupBy("event.id")
            .having("COUNT(booking.id) = 0")
            .orderBy("event.start_date", "ASC")
            .getRawMany();

        res.json(results);
    }

    // 📊 Question 11: Month-over-Month revenue trend for 2025 (Assuming SQLite)
    static async getMoMRevenue(req: Request, res: Response): Promise<void> {
        const results = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.tier", "tier")
            .innerJoin("tier.event", "event")
            .where("event.start_date LIKE :year", { year: "2025%" })
            .andWhere("booking.status = :status", { status: "booked" })
            .select("strftime('%m', event.start_date)", "month") // SQLite specific month extraction
            .addSelect("SUM(booking.total_amount)", "monthlyRevenue")
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany();

        res.json(results);
    }

    // 📊 Question 12: User who spent the most money
    static async getTopSpender(req: Request, res: Response): Promise<void> {
        const result = await AppDataSource.getRepository(Booking)
            .createQueryBuilder("booking")
            .innerJoin("booking.user", "user")
            .where("booking.status = :status", { status: "booked" }) // Non-cancelled
            .select("user.name", "userName")
            .addSelect("user.email", "userEmail")
            .addSelect("SUM(booking.total_amount)", "totalSpent")
            .groupBy("user.id")
            .orderBy("totalSpent", "DESC")
            .limit(1)
            .getRawOne();

        res.json(result);
    }

    // 📊 Question 13: % of seats sold for events in the next 30 days
    static async getNext30DaysFillRate(req: Request, res: Response): Promise<void> {
        // SQLite date logic for NOW and NOW + 30 days
        const results = await AppDataSource.getRepository(Event)
            .createQueryBuilder("event")
            .innerJoin("event.tiers", "tier")
            .where("event.start_date >= date('now')")
            .andWhere("event.start_date <= date('now', '+30 days')")
            .select("event.title", "title")
            .addSelect("SUM(tier.sold_count)", "totalSold")
            .addSelect("SUM(tier.total_capacity)", "totalCapacity")
            .groupBy("event.id")
            .getRawMany();

        const report = results.map(row => {
            const sold = Number(row.totalSold);
            const capacity = Number(row.totalCapacity);
            return {
                event: row.title,
                sold,
                capacity,
                fillPercentage: capacity > 0 ? ((sold / capacity) * 100).toFixed(2) + "%" : "0%"
            };
        });

        res.json(report);
    }
