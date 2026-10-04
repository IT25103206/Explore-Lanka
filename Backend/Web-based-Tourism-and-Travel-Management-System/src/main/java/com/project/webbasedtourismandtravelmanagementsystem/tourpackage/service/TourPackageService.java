package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;

import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventFestivalRepository;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.repository.PromotionRepository;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.PackageOption;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.TourPackageRequest;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.dto.TourPackageDtos.TourPackageResponse;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.PackageType;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import com.project.webbasedtourismandtravelmanagementsystem.wishlist.WishlistRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/** Tour Package & Experience Management (IT25101444 Meheramba E.N.). */
@Service
@Transactional
public class TourPackageService {

    /** Filters used by the public catalogue (search by destination / theme). */
    public record PackageFilter(String q, TourPackage.Category category, String region, PackageType type,
                                BigDecimal minPrice, BigDecimal maxPrice, Integer maxDays, String sort) {
    }

    private static final Set<BookingStatus> SOLD = EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

    private final TourPackageRepository packageRepository;
    private final TourPackageFactory factory;
    private final BookingRepository bookingRepository;
    private final FeedbackRepository feedbackRepository;
    private final WishlistRepository wishlistRepository;
    private final EventFestivalRepository eventRepository;
    private final PromotionRepository promotionRepository;

    public TourPackageService(TourPackageRepository packageRepository, TourPackageFactory factory,
                              BookingRepository bookingRepository, FeedbackRepository feedbackRepository,
                              WishlistRepository wishlistRepository, EventFestivalRepository eventRepository,
                              PromotionRepository promotionRepository) {
        this.packageRepository = packageRepository;
        this.factory = factory;
        this.bookingRepository = bookingRepository;
        this.feedbackRepository = feedbackRepository;
        this.wishlistRepository = wishlistRepository;
        this.eventRepository = eventRepository;
        this.promotionRepository = promotionRepository;
    }

    // ------------------------------------------------------------------ public catalogue

    @Transactional(readOnly = true)
    public List<TourPackageResponse> search(PackageFilter f) {
        Stats stats = stats();
        String q = f.q() == null ? "" : f.q().trim().toLowerCase(Locale.ROOT);
        LocalDate today = LocalDate.now();
        Comparator<TourPackageResponse> order = switch (f.sort() == null ? "" : f.sort()) {
            case "price_asc" -> Comparator.comparing(TourPackageResponse::currentPrice);
            case "price_desc" -> Comparator.comparing(TourPackageResponse::currentPrice).reversed();
            case "rating" -> Comparator.comparingDouble(TourPackageResponse::averageRating).reversed();
            case "duration" -> Comparator.comparingInt(TourPackageResponse::durationDays);
            default -> Comparator.comparingLong(TourPackageResponse::bookingCount).reversed()
                    .thenComparing(TourPackageResponse::name);
        };
        return packageRepository.findByStatusOrderByNameAsc(TourPackage.Status.ACTIVE).stream()
                .filter(p -> !p.getAvailableTo().isBefore(today))
                .filter(p -> q.isEmpty() || (p.getName() + " " + p.getDestinations() + " " + p.getRegion() + " "
                        + Objects.toString(p.getDescription(), "")).toLowerCase(Locale.ROOT).contains(q))
                .filter(p -> f.category() == null || p.getCategory() == f.category())
                .filter(p -> f.region() == null || f.region().isBlank() || p.getRegion().equalsIgnoreCase(f.region()))
                .filter(p -> f.type() == null || p.getPackageType() == f.type())
                .filter(p -> f.maxDays() == null || p.getDurationDays() <= f.maxDays())
                .map(p -> toResponse(p, stats))
                .filter(r -> f.minPrice() == null || r.currentPrice().compareTo(f.minPrice()) >= 0)
                .filter(r -> f.maxPrice() == null || r.currentPrice().compareTo(f.maxPrice()) <= 0)
                .sorted(order)
                .toList();
    }

    @Transactional(readOnly = true)
    public TourPackageResponse getPublic(Long id) {
        TourPackage p = find(id);
        if (p.getStatus() != TourPackage.Status.ACTIVE) {
            throw new NotFoundException("Tour package", id);
        }
        return toResponse(p, stats());
    }

    // ------------------------------------------------------------------ management

    @Transactional(readOnly = true)
    public List<TourPackageResponse> listAll() {
        Stats stats = stats();
        return packageRepository.findAllByOrderByCreatedAtDesc().stream().map(p -> toResponse(p, stats)).toList();
    }

    @Transactional(readOnly = true)
    public TourPackageResponse get(Long id) {
        return toResponse(find(id), stats());
    }

    @Transactional(readOnly = true)
    public List<PackageOption> options() {
        return packageRepository.findAllByOrderByCreatedAtDesc().stream().map(PackageOption::from).toList();
    }

    public TourPackageResponse create(TourPackageRequest request) {
        if (packageRepository.existsByCodeIgnoreCase(request.code().trim())) {
            throw BusinessException.conflict("Package code " + request.code() + " is already used");
        }
        if (request.availableTo().isBefore(LocalDate.now())) {
            throw new BusinessException("The schedule window has already ended - choose a future end date");
        }
        TourPackage p = factory.create(request);
        return toResponse(packageRepository.save(p), stats());
    }

    public TourPackageResponse update(Long id, TourPackageRequest request) {
        TourPackage p = find(id);
        if (p.getPackageType() != request.type()) {
            throw new BusinessException("The package type cannot be changed after creation. Create a new package instead.");
        }
        if (!p.getCode().equalsIgnoreCase(request.code().trim()) && packageRepository.existsByCodeIgnoreCase(request.code().trim())) {
            throw BusinessException.conflict("Package code " + request.code() + " is already used");
        }
        factory.apply(p, request);
        return toResponse(p, stats());
    }

    public TourPackageResponse changeStatus(Long id, TourPackage.Status status) {
        TourPackage p = find(id);
        p.setStatus(status);
        return toResponse(p, stats());
    }

    /** Packages with booking history are kept for records - they must be deactivated instead. */
    public void delete(Long id) {
        TourPackage p = find(id);
        if (bookingRepository.existsByTourPackageId(id)) {
            throw BusinessException.conflict("This package has bookings and cannot be deleted. Set it to INACTIVE to hide it from customers.");
        }
        wishlistRepository.findAll().stream()
                .filter(w -> w.getTourPackage().getId().equals(id))
                .forEach(wishlistRepository::delete);
        eventRepository.findAll().forEach(e -> e.getLinkedPackages().removeIf(x -> x.getId().equals(id)));
        promotionRepository.findAll().forEach(pr -> pr.getPackages().removeIf(x -> x.getId().equals(id)));
        packageRepository.delete(p);
    }

    public TourPackage find(Long id) {
        return packageRepository.findById(id).orElseThrow(() -> new NotFoundException("Tour package", id));
    }

    // ------------------------------------------------------------------ ratings, popularity, trending

    private record Stats(Map<Long, Double> avgRating, Map<Long, Long> reviewCount,
                         Map<Long, Long> bookingCount, Set<Long> trending) {
    }

    private Stats stats() {
        List<Feedback> feedback = feedbackRepository.findAll().stream()
                .filter(fb -> fb.getStatus() != Feedback.Status.HIDDEN).toList();
        Map<Long, Double> avg = feedback.stream().collect(Collectors.groupingBy(
                fb -> fb.getTourPackage().getId(), Collectors.averagingInt(Feedback::getOverallRating)));
        Map<Long, Long> reviews = feedback.stream().collect(Collectors.groupingBy(
                fb -> fb.getTourPackage().getId(), Collectors.counting()));

        List<Booking> sold = bookingRepository.findByStatusIn(SOLD);
        Map<Long, Long> bookings = sold.stream().collect(Collectors.groupingBy(
                b -> b.getTourPackage().getId(), Collectors.counting()));

        // trending = most booked packages in the last 60 days (at least 2 bookings), top 3
        LocalDate since = LocalDate.now().minusDays(60);
        Set<Long> trending = sold.stream()
                .filter(b -> !b.getCreatedAt().toLocalDate().isBefore(since))
                .collect(Collectors.groupingBy(b -> b.getTourPackage().getId(), Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() >= 2)
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
        return new Stats(avg, reviews, bookings, trending);
    }

    private TourPackageResponse toResponse(TourPackage p, Stats s) {
        double avg = Math.round(s.avgRating().getOrDefault(p.getId(), 0.0) * 10) / 10.0;
        return TourPackageResponse.from(p, avg, s.reviewCount().getOrDefault(p.getId(), 0L),
                s.bookingCount().getOrDefault(p.getId(), 0L), s.trending().contains(p.getId()));
    }
}
