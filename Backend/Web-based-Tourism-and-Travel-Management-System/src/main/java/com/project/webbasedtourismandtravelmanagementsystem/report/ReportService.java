package com.project.webbasedtourismandtravelmanagementsystem.report;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventFestivalRepository;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.dto.PartnerDtos.SupplierResponse;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.ServiceRateRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.service.PartnerService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Refund;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.PaymentRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.RefundRepository;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.service.PromotionService;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.AllocationService;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Report Generation (IT25102242 Nethwin S.W.S): dashboard, financial & operational report (PBI-24)
 * and tour / logistic-supply records (PBI-22).
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    public record KeyValue(String label, long count, BigDecimal amount) {
    }

    public record RecentBooking(Long id, String reference, String customerName, String packageName, LocalDate startDate,
                                BookingStatus status, BigDecimal total) {
    }

    public record DashboardResponse(long totalBookings, long bookingsToday, long confirmedBookings, long pendingPayments,
                                    long awaitingVerification, long activePackages, BigDecimal revenueThisMonth,
                                    long pendingRefunds, long pendingRates, long pendingAllocations, long upcomingEvents,
                                    long activePromotions, long activeSuppliers, long customers,
                                    List<RecentBooking> recentBookings, List<KeyValue> monthlyRevenue,
                                    List<KeyValue> bookingsByCategory) {
    }

    public record ReportResponse(LocalDate from, LocalDate to, String category, long bookings, long confirmed,
                                 long cancelled, double cancellationRate, long travellers, BigDecimal grossRevenue,
                                 BigDecimal refunds, BigDecimal netRevenue, BigDecimal discounts,
                                 BigDecimal averageBookingValue, double averageRating, List<KeyValue> revenueByMonth,
                                 List<KeyValue> bookingsByStatus, List<KeyValue> bookingsByCategory,
                                 List<KeyValue> revenueByMethod, List<KeyValue> topPackages,
                                 List<KeyValue> topDestinations, List<SupplierResponse> partnerPerformance) {
    }

    public record TourRecord(Long id, String code, String name, String category, String type, String region,
                             String status, long totalBookings, long last90Days, long previous90Days, String trend,
                             BigDecimal revenue, double rating) {
    }

    public record RecordsResponse(List<TourRecord> tours, List<SupplierResponse> suppliers) {
    }

    private static final Set<BookingStatus> SOLD = EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMM yyyy");

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final TourPackageRepository packageRepository;
    private final FeedbackRepository feedbackRepository;
    private final EventFestivalRepository eventRepository;
    private final SupplierRepository supplierRepository;
    private final ServiceRateRepository rateRepository;
    private final UserRepository userRepository;
    private final PartnerService partnerService;
    private final PromotionService promotionService;
    private final AllocationService allocationService;

    public ReportService(BookingRepository bookingRepository, PaymentRepository paymentRepository,
                         RefundRepository refundRepository, TourPackageRepository packageRepository,
                         FeedbackRepository feedbackRepository, EventFestivalRepository eventRepository,
                         SupplierRepository supplierRepository, ServiceRateRepository rateRepository,
                         UserRepository userRepository, PartnerService partnerService,
                         PromotionService promotionService, AllocationService allocationService) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.packageRepository = packageRepository;
        this.feedbackRepository = feedbackRepository;
        this.eventRepository = eventRepository;
        this.supplierRepository = supplierRepository;
        this.rateRepository = rateRepository;
        this.userRepository = userRepository;
        this.partnerService = partnerService;
        this.promotionService = promotionService;
        this.allocationService = allocationService;
    }

    // ------------------------------------------------------------------ admin dashboard

    public DashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        List<Booking> all = bookingRepository.findAllByOrderByCreatedAtDesc();
        List<Payment> collected = collectedPayments();
        YearMonth thisMonth = YearMonth.now();
        BigDecimal monthRevenue = collected.stream()
                .filter(p -> YearMonth.from(p.getPaidAt()).equals(thisMonth))
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long pendingAllocations = allocationService.pending().stream().filter(p -> !p.missing().isEmpty()).count();
        long upcomingEvents = eventRepository.findByStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(EventFestival.Status.PUBLISHED, today).size();

        List<RecentBooking> recent = bookingRepository.findTop6ByOrderByCreatedAtDesc().stream()
                .map(b -> new RecentBooking(b.getId(), b.getReference(), b.getCustomer().getFullName(), b.getTourPackage().getName(),
                        b.getStartDate(), b.getStatus(), b.getTotalAmount()))
                .toList();
        return new DashboardResponse(all.size(),
                all.stream().filter(b -> b.getCreatedAt().toLocalDate().equals(today)).count(),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                bookingRepository.countByStatus(BookingStatus.PENDING_PAYMENT),
                bookingRepository.countByStatus(BookingStatus.AWAITING_VERIFICATION),
                packageRepository.countByStatus(TourPackage.Status.ACTIVE), monthRevenue,
                refundRepository.countByStatus(Refund.Status.PENDING),
                rateRepository.countByStatus(ServiceRate.Status.PENDING_APPROVAL), pendingAllocations, upcomingEvents,
                promotionService.activeOffers().size(), supplierRepository.countByStatus(Supplier.Status.ACTIVE),
                userRepository.countByRole(Role.CUSTOMER), recent,
                revenueByMonth(collected, today.minusMonths(5).withDayOfMonth(1), today),
                byCategory(all.stream().filter(b -> SOLD.contains(b.getStatus())).toList()));
    }

    // ------------------------------------------------------------------ financial & operational report (PBI-24)

    public ReportResponse report(LocalDate from, LocalDate to, TourPackage.Category category) {
        if (to.isBefore(from)) {
            throw new BusinessException("The report end date must be on or after the start date");
        }
        if (ChronoUnit.DAYS.between(from, to) > 731) {
            throw new BusinessException("Reports can cover at most 2 years");
        }
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(b -> inRange(b.getCreatedAt().toLocalDate(), from, to))
                .filter(b -> category == null || b.getTourPackage().getCategory() == category)
                .toList();
        List<Booking> sold = bookings.stream().filter(b -> SOLD.contains(b.getStatus())).toList();
        long cancelled = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

        List<Payment> payments = collectedPayments().stream()
                .filter(p -> inRange(p.getPaidAt().toLocalDate(), from, to))
                .filter(p -> category == null || p.getBooking().getTourPackage().getCategory() == category)
                .toList();
        BigDecimal gross = sum(payments.stream().map(Payment::getAmount));
        BigDecimal refunds = sum(refundRepository.findByStatus(Refund.Status.APPROVED).stream()
                .filter(r -> r.getProcessedAt() != null && inRange(r.getProcessedAt().toLocalDate(), from, to))
                .filter(r -> category == null || r.getBooking().getTourPackage().getCategory() == category)
                .map(Refund::getAmount));
        BigDecimal discounts = sum(sold.stream().map(Booking::getDiscountAmount));
        BigDecimal avgValue = sold.isEmpty() ? BigDecimal.ZERO
                : sum(sold.stream().map(Booking::getTotalAmount)).divide(BigDecimal.valueOf(sold.size()), 2, RoundingMode.HALF_UP);
        double avgRating = feedbackRepository.findAll().stream()
                .filter(f -> inRange(f.getCreatedAt().toLocalDate(), from, to))
                .filter(f -> category == null || f.getTourPackage().getCategory() == category)
                .mapToInt(Feedback::getOverallRating).average().orElse(0);

        List<KeyValue> byStatus = Arrays.stream(BookingStatus.values())
                .map(s -> new KeyValue(s.name(), bookings.stream().filter(b -> b.getStatus() == s).count(),
                        sum(bookings.stream().filter(b -> b.getStatus() == s).map(Booking::getTotalAmount))))
                .toList();
        List<KeyValue> byMethod = Arrays.stream(Payment.Method.values())
                .map(m -> new KeyValue(m.name(), payments.stream().filter(p -> p.getMethod() == m).count(),
                        sum(payments.stream().filter(p -> p.getMethod() == m).map(Payment::getAmount))))
                .toList();
        List<KeyValue> topPackages = sold.stream()
                .collect(Collectors.groupingBy(b -> b.getTourPackage().getName()))
                .entrySet().stream()
                .map(e -> new KeyValue(e.getKey(), e.getValue().size(), sum(e.getValue().stream().map(Booking::getTotalAmount))))
                .sorted(Comparator.comparing(KeyValue::amount).reversed())
                .limit(8).toList();
        Map<String, List<Booking>> byTown = new HashMap<>();
        sold.forEach(b -> b.getTourPackage().destinationList().forEach(d -> byTown.computeIfAbsent(d, k -> new ArrayList<>()).add(b)));
        List<KeyValue> topDestinations = byTown.entrySet().stream()
                .map(e -> new KeyValue(e.getKey(), e.getValue().size(), BigDecimal.valueOf(e.getValue().stream().mapToInt(Booking::travellerCount).sum())))
                .sorted(Comparator.comparingLong(KeyValue::count).reversed())
                .limit(8).toList();

        return new ReportResponse(from, to, category == null ? null : category.name(), bookings.size(), sold.size(), cancelled,
                bookings.isEmpty() ? 0 : Math.round(cancelled * 1000.0 / bookings.size()) / 10.0,
                sold.stream().mapToInt(Booking::travellerCount).sum(), gross, refunds, gross.subtract(refunds), discounts,
                avgValue, Math.round(avgRating * 10) / 10.0, revenueByMonth(payments, from, to), byStatus, byCategory(sold),
                byMethod, topPackages, topDestinations, partnerService.list());
    }

    // ------------------------------------------------------------------ tour & logistic supply records (PBI-22)

    public RecordsResponse records(TourPackage.Category category, Supplier.Type supplierType) {
        LocalDate today = LocalDate.now();
        List<Booking> sold = bookingRepository.findByStatusIn(SOLD);
        Map<Long, List<Booking>> byPackage = sold.stream().collect(Collectors.groupingBy(b -> b.getTourPackage().getId()));
        Map<Long, Double> ratings = feedbackRepository.findAll().stream()
                .collect(Collectors.groupingBy(f -> f.getTourPackage().getId(), Collectors.averagingInt(Feedback::getOverallRating)));
        List<TourRecord> tours = packageRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(p -> category == null || p.getCategory() == category)
                .map(p -> {
                    List<Booking> list = byPackage.getOrDefault(p.getId(), List.of());
                    long last90 = list.stream().filter(b -> !b.getCreatedAt().toLocalDate().isBefore(today.minusDays(90))).count();
                    long prev90 = list.stream().filter(b -> {
                        LocalDate d = b.getCreatedAt().toLocalDate();
                        return d.isBefore(today.minusDays(90)) && !d.isBefore(today.minusDays(180));
                    }).count();
                    String trend = last90 > prev90 ? "UP" : last90 < prev90 ? "DOWN" : "STEADY";
                    return new TourRecord(p.getId(), p.getCode(), p.getName(), p.getCategory().name(), p.getPackageType().name(),
                            p.getRegion(), p.getStatus().name(), list.size(), last90, prev90, trend,
                            sum(list.stream().map(Booking::getTotalAmount)),
                            Math.round(ratings.getOrDefault(p.getId(), 0.0) * 10) / 10.0);
                })
                .sorted(Comparator.comparingLong(TourRecord::last90Days).reversed().thenComparing(TourRecord::name))
                .toList();
        List<SupplierResponse> suppliers = partnerService.list().stream()
                .filter(s -> supplierType == null || s.type() == supplierType)
                .toList();
        return new RecordsResponse(tours, suppliers);
    }

    // ------------------------------------------------------------------ helpers

    private List<Payment> collectedPayments() {
        List<Payment> list = new ArrayList<>(paymentRepository.findByStatus(Payment.Status.SUCCESS));
        list.addAll(paymentRepository.findByStatus(Payment.Status.REFUNDED));
        return list.stream().filter(p -> p.getPaidAt() != null).toList();
    }

    private List<KeyValue> revenueByMonth(List<Payment> payments, LocalDate from, LocalDate to) {
        List<KeyValue> out = new ArrayList<>();
        for (YearMonth m = YearMonth.from(from); !m.isAfter(YearMonth.from(to)); m = m.plusMonths(1)) {
            final YearMonth month = m;
            List<Payment> inMonth = payments.stream().filter(p -> YearMonth.from(p.getPaidAt()).equals(month)).toList();
            out.add(new KeyValue(MONTH.format(month), inMonth.size(), sum(inMonth.stream().map(Payment::getAmount))));
            if (out.size() > 24) {
                break;
            }
        }
        return out;
    }

    private List<KeyValue> byCategory(List<Booking> bookings) {
        return Arrays.stream(TourPackage.Category.values())
                .map(c -> {
                    List<Booking> list = bookings.stream().filter(b -> b.getTourPackage().getCategory() == c).toList();
                    return new KeyValue(c.name(), list.size(), sum(list.stream().map(Booking::getTotalAmount)));
                })
                .filter(k -> k.count() > 0)
                .toList();
    }

    private static boolean inRange(LocalDate d, LocalDate from, LocalDate to) {
        return !d.isBefore(from) && !d.isAfter(to);
    }

    private static BigDecimal sum(java.util.stream.Stream<BigDecimal> s) {
        return s.filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
