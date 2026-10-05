package com.project.webbasedtourismandtravelmanagementsystem.config;

import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.event.service.EventService;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.service.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs every night at 00:05 (Sri Lanka time) and once at start-up:
 *  - past events are expired (UC-04 decision)
 *  - promotions past their end date are deactivated (UC-05 decision)
 *  - finished tours become COMPLETED so tourists can leave feedback
 *  - unpaid bookings whose travel date arrived are cancelled
 */
@Component
public class NightlyMaintenanceJob {

    private static final Logger log = LoggerFactory.getLogger(NightlyMaintenanceJob.class);

    private final EventService eventService;
    private final PromotionService promotionService;
    private final BookingService bookingService;

    public NightlyMaintenanceJob(EventService eventService, PromotionService promotionService, BookingService bookingService) {
        this.eventService = eventService;
        this.promotionService = promotionService;
        this.bookingService = bookingService;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Colombo")
    public void runNightly() {
        int events = eventService.expirePast();
        int promotions = promotionService.expireFinished();
        int completed = bookingService.completeFinishedTours();
        int cancelled = bookingService.cancelUnpaidPastDeadline();
        log.info("Nightly maintenance: {} event(s) expired, {} promotion(s) expired, {} booking(s) completed, {} unpaid booking(s) cancelled",
                events, promotions, completed, cancelled);
    }

    /** Runs after the demo data seeder so the data is consistent on every start. */
    @EventListener(ApplicationReadyEvent.class)
    @Order(10)
    public void runAtStartup() {
        runNightly();
    }
}
