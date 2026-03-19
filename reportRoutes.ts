import { Router } from "express";
import { ReportController } from "../controllers/ReportController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// 📊 Q1: Total revenue for January 2025
router.get("/revenue/jan2025", asyncHandler(ReportController.getJan2025Revenue));

// 📊 Q2: City with highest tickets sold in Q1 2025
router.get("/top-city/q1", asyncHandler(ReportController.getTopCityQ1));

// 📊 Q3: Top 3 best-selling events of all time
router.get("/top-events", asyncHandler(ReportController.getTop3Events));

// 📊 Q4: "Tech Summit 2025" - Tickets per tier and revenue percentage
router.get("/tech-summit", asyncHandler(ReportController.getTechSummitStats));

// 📊 Q5: Events with fewer than 10 seats remaining
router.get("/almost-sold-out", asyncHandler(ReportController.getAlmostSoldOutEvents));

// 📊 Q6: Average ticket price grouped by city (Published events)
router.get("/average-price-by-city", asyncHandler(ReportController.getAvgPriceByCity));

// 📊 Q7: Unique attendees for a specific organizer (Pass ?organizerId=... in URL)
router.get("/unique-attendees", asyncHandler(ReportController.getUniqueAttendeesCount));

// 📊 Q8: Cancelled bookings & lost revenue per event
router.get("/lost-revenue", asyncHandler(ReportController.getLostRevenue));

// 📊 Q9: Tier type generating the most revenue
router.get("/top-tier-type", asyncHandler(ReportController.getTopTierType));

// 📊 Q10: Published events with zero bookings
router.get("/zero-bookings", asyncHandler(ReportController.getEventsWithZeroBookings));

// 📊 Q11: Month-over-Month revenue trend for 2025
router.get("/revenue/mom-2025", asyncHandler(ReportController.getMoMRevenue));

// 📊 Q12: User who spent the most money
router.get("/top-spender", asyncHandler(ReportController.getTopSpender));

// 📊 Q13: % of seats sold for events in the next 30 days
router.get("/fill-rate/next-30-days", asyncHandler(ReportController.getNext30DaysFillRate));

export default router;