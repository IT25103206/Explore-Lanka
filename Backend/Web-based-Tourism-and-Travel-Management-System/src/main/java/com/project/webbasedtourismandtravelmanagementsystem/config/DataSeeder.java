package com.project.webbasedtourismandtravelmanagementsystem.config;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.CustomerRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.BookingRequest;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.BookingResponse;
import com.project.webbasedtourismandtravelmanagementsystem.booking.dto.BookingDtos.TravelerDto;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.BookingStatus;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.TravelerDetail;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.service.BookingService;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventRegistration;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventFestivalRepository;
import com.project.webbasedtourismandtravelmanagementsystem.event.repository.EventRegistrationRepository;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.model.Feedback;
import com.project.webbasedtourismandtravelmanagementsystem.feedback.repository.FeedbackRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.dto.PartnerDtos.ContractRequest;
import com.project.webbasedtourismandtravelmanagementsystem.partner.dto.PartnerDtos.RateRequest;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.ServiceRate;
import com.project.webbasedtourismandtravelmanagementsystem.partner.model.Supplier;
import com.project.webbasedtourismandtravelmanagementsystem.partner.repository.SupplierRepository;
import com.project.webbasedtourismandtravelmanagementsystem.partner.service.PartnerService;
import com.project.webbasedtourismandtravelmanagementsystem.payment.dto.PaymentDtos.PaymentRequest;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Invoice;
import com.project.webbasedtourismandtravelmanagementsystem.payment.model.Payment;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.InvoiceRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.repository.PaymentRepository;
import com.project.webbasedtourismandtravelmanagementsystem.payment.service.PaymentService;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.repository.PromotionRepository;
import com.project.webbasedtourismandtravelmanagementsystem.resource.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.*;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.*;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service.TourPackageFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.MonthDay;
import java.util.*;

/**
 * Creates demo data on the first start (when there are no users):
 * one account per role (password Password@123), suppliers with contracts and rates, hotels,
 * vehicles, guides, tour packages, festivals, promotions and bookings in every status.
 * Dates are relative to today so the demo always looks current.
 */
@Component
@Order(1)
public class DataSeeder implements ApplicationRunner {

    public static final String DEMO_PASSWORD = "Password@123";
    private static final String LOGISTICS_MANAGER_NAME = "Nimal Wijeratne";
    private static final String ADMIN_NAME = "Dilan Jayawardena";
    private static final String BUSINESS_MANAGER_NAME = "Sanjeewa Perera";
    private static final String EVENT_ORGANIZER_NAME = "Kasun Abeyratne";
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Value("${app.seed-demo-data:true}")
    private boolean enabled;

    private final TransactionTemplate tx;
    private final PasswordEncoder encoder;
    private final UserRepository users;
    private final CustomerRepository customers;
    private final SupplierRepository suppliers;
    private final HotelRepository hotels;
    private final VehicleRepository vehicles;
    private final TourGuideRepository guides;
    private final ResourceBlockedDateRepository blockedDates;
    private final ResourceAllocationRepository allocations;
    private final TourPackageRepository packages;
    private final TourPackageFactory packageFactory;
    private final EventFestivalRepository events;
    private final EventRegistrationRepository registrations;
    private final PromotionRepository promotions;
    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final InvoiceRepository invoices;
    private final FeedbackRepository feedback;
    private final PartnerService partnerService;
    private final BookingService bookingService;
    private final PaymentService paymentService;

    private final LocalDate today = LocalDate.now();
    private final Random random = new Random(42);

    public DataSeeder(TransactionTemplate tx, PasswordEncoder encoder, UserRepository users, CustomerRepository customers,
                      SupplierRepository suppliers, HotelRepository hotels, VehicleRepository vehicles,
                      TourGuideRepository guides, ResourceBlockedDateRepository blockedDates,
                      ResourceAllocationRepository allocations, TourPackageRepository packages,
                      TourPackageFactory packageFactory, EventFestivalRepository events,
                      EventRegistrationRepository registrations, PromotionRepository promotions,
                      BookingRepository bookings, PaymentRepository payments, InvoiceRepository invoices,
                      FeedbackRepository feedback, PartnerService partnerService, BookingService bookingService,
                      PaymentService paymentService) {
        this.tx = tx;
        this.encoder = encoder;
        this.users = users;
        this.customers = customers;
        this.suppliers = suppliers;
        this.hotels = hotels;
        this.vehicles = vehicles;
        this.guides = guides;
        this.blockedDates = blockedDates;
        this.allocations = allocations;
        this.packages = packages;
        this.packageFactory = packageFactory;
        this.events = events;
        this.registrations = registrations;
        this.promotions = promotions;
        this.bookings = bookings;
        this.payments = payments;
        this.invoices = invoices;
        this.feedback = feedback;
        this.partnerService = partnerService;
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        if (users.count() > 0) {
            tx.executeWithoutResult(status -> addMissingDemoAccounts());
            return;
        }
        tx.executeWithoutResult(status -> seed());
        log.info("Demo data created. Log in with any demo account (e.g. customer@explorelanka.lk) using password {}", DEMO_PASSWORD);
    }

    // =====================================================================================

    private void seed() {
        // ---------------------------------------------------------------- suppliers
        Supplier hillHotels = supplier("Hill Country Hotels Group", Supplier.Type.HOTEL, "Nuwan Bandara", "reservations@hillcountryhotels.lk", "0812234567", "12 Lake Road, Kandy");
        Supplier coastResorts = supplier("Southern Coast Resorts", Supplier.Type.HOTEL, "Malini Gunasekara", "bookings@southerncoast.lk", "0912245678", "45 Church Street, Galle Fort");
        Supplier islandStays = supplier("Island Stays Collective", Supplier.Type.HOTEL, "Rizwan Mohamed", "hello@islandstays.lk", "0262234455", "8 Dockyard Road, Trincomalee");
        Supplier islandWheels = supplier("Island Wheels Transport", Supplier.Type.TRANSPORT, "Sampath Kumara", "dispatch@islandwheels.lk", "0112345678", "220 Galle Road, Colombo 03");
        Supplier coachLines = supplier("Lanka Coach Lines", Supplier.Type.TRANSPORT, "Priyantha Silva", "ops@lankacoach.lk", "0114567890", "17 Station Road, Negombo");
        Supplier guildGuides = supplier("Ceylon Guides Association", Supplier.Type.TOUR_GUIDE, "Kumari Herath", "office@ceylonguides.lk", "0112678901", "5 Temple Road, Colombo 10");
        Supplier oldSupplier = supplier("Coastal Cabs (old partner)", Supplier.Type.TRANSPORT, "Ajith Peiris", "info@coastalcabs.lk", "0917788990", "Matara");
        oldSupplier.setStatus(Supplier.Status.INACTIVE);
        oldSupplier.setNotes("Removed in 2026 after repeated late pick-ups");

        // ---------------------------------------------------------------- users (one per role)
        User admin = user(ADMIN_NAME, "admin@explorelanka.lk", "0771000001", Role.SYSTEM_ADMIN, null);
        user("Ruwan Senanayake", "operations@explorelanka.lk", "0771000002", Role.TOUR_OPERATIONS_MANAGER, null);
        user(LOGISTICS_MANAGER_NAME, "logistics@explorelanka.lk", "0771000008", Role.LOGISTIC_SUPPLIER_MANAGER, null);
        User business = user(BUSINESS_MANAGER_NAME, "business@explorelanka.lk", "0771000010", Role.BUSINESS_MANAGER, null);
        user("Ishara Fernando", "finance@explorelanka.lk", "0771000003", Role.FINANCE_COORDINATOR, null);
        user("Tharushi Wickramasinghe", "marketing@explorelanka.lk", "0771000004", Role.MARKETING_EXECUTIVE, null);
        user(EVENT_ORGANIZER_NAME, "events@explorelanka.lk", "0771000009", Role.EVENT_ORGANIZER, null);
        user("Nuwan Bandara", "hotel@explorelanka.lk", "0771000005", Role.HOTEL_PARTNER, hillHotels);
        user("Sampath Kumara", "transport@explorelanka.lk", "0771000006", Role.TRANSPORT_PROVIDER, islandWheels);
        User guideUser = user("Chaminda Rathnayake", "guide@explorelanka.lk", "0771000007", Role.TOUR_GUIDE, null);
        User amila = customer("Amila Perera", "customer@explorelanka.lk", "0779876543", "Sri Lanka", "Sri Lankan", true, "Cultural sites, hill country, vegetarian meals");
        User emma = customer("Emma Wilson", "emma.wilson@example.com", "+447700900123", "United Kingdom", "British", true, "Wildlife and photography");
        User nadeesha = customer("Nadeesha Silva", "nadeesha@example.com", "0712233445", "Sri Lanka", "Sri Lankan", false, "Beaches, family friendly");
        User hans = customer("Hans Becker", "hans.becker@example.com", "+491701234567", "Germany", "German", true, "Hiking, tea estates");

        // ---------------------------------------------------------------- hotels
        Hotel kandyLake = hotel(hillHotels, "Kandy Lakeside Retreat", "Kandy", 4, 20, "18000", "Lake view, Pool, Free Wi-Fi, Ayurveda spa", "/images/destinations/kandy.png");
        Hotel nuwaraTea = hotel(hillHotels, "Nuwara Eliya Tea Bungalow", "Nuwara Eliya", 4, 12, "22000", "Colonial bungalow, Fireplace, Tea tasting", "/images/destinations/nuwara-eliya.png");
        Hotel ellaMist = hotel(hillHotels, "Ella Mist Eco Lodge", "Ella", 3, 10, "12500", "Mountain views, Organic breakfast, Hiking trails", "/images/destinations/ella.png");
        Hotel galleFort = hotel(coastResorts, "Galle Fort Heritage Villa", "Galle", 5, 8, "32000", "Heritage building, Rooftop dining, Pool", "/images/destinations/unawatuna.png");
        Hotel mirissa = hotel(coastResorts, "Mirissa Ocean Breeze", "Mirissa", 4, 16, "22000", "Beachfront, Whale-watching desk, Bar", "/images/destinations/mirissa.png");
        Hotel unawatuna = hotel(coastResorts, "Unawatuna Palm Cove", "Unawatuna", 3, 14, "14000", "Beach access, Snorkelling gear, Garden", "/images/destinations/unawatuna.png");
        Hotel yalaCamp = hotel(coastResorts, "Yala Safari Camp", "Yala", 3, 10, "16500", "Luxury tents, Bonfire, Early safari breakfast", "/images/destinations/yala.png");
        Hotel sigiriya = hotel(islandStays, "Sigiriya Rock View Resort", "Sigiriya", 4, 18, "19500", "Rock views, Infinity pool, Village tours", "/images/destinations/sigiriya.png");
        Hotel anuradhapura = hotel(islandStays, "Anuradhapura Heritage Lodge", "Anuradhapura", 3, 12, "11000", "Bicycle hire, Garden, Near sacred city", "/images/destinations/anuradhapura.png");
        Hotel trinco = hotel(islandStays, "Trinco Blue Beach Hotel", "Trincomalee", 4, 15, "17500", "Beachfront, Diving centre, Seafood restaurant", "/images/destinations/trincomalee.png");
        Hotel arugam = hotel(islandStays, "Arugam Surf Inn", "Arugam Bay", 3, 10, "11500", "Surfboard rental, Hammocks, Beach cafe", "/images/destinations/arugam-bay.png");
        Hotel dambulla = hotel(islandStays, "Dambulla Cave Garden Hotel", "Dambulla", 3, 10, "10500", "Garden rooms, Near cave temple", "/images/ancient-cities.jpg");

        // ---------------------------------------------------------------- vehicles
        Vehicle axio = vehicle(islandWheels, Vehicle.Type.CAR, "Toyota Axio", "CAB-4521", 3, "9500", "Lalith Perera");
        Vehicle prado = vehicle(islandWheels, Vehicle.Type.SUV, "Toyota Land Cruiser Prado", "CAR-7788", 6, "18500", "Saman Jayasuriya");
        Vehicle kdh = vehicle(islandWheels, Vehicle.Type.VAN, "Toyota KDH High Roof", "PH-2345", 9, "13000", "Rohan de Silva");
        Vehicle coaster = vehicle(islandWheels, Vehicle.Type.MINI_COACH, "Toyota Coaster", "ND-8812", 25, "26000", "Gamini Fonseka");
        Vehicle vanTwo = vehicle(coachLines, Vehicle.Type.VAN, "Nissan Caravan", "PE-6611", 12, "14000", "Kasun Madushanka");
        Vehicle bus = vehicle(coachLines, Vehicle.Type.COACH, "Ashok Leyland Viking", "NB-3344", 45, "38000", "Upali Ranasinghe");
        Vehicle oldCab = vehicle(oldSupplier, Vehicle.Type.CAR, "Suzuki Wagon R", "CAD-1199", 3, "7000", null);

        // ---------------------------------------------------------------- guides
        TourGuide chaminda = guide(guildGuides, guideUser, "Chaminda Rathnayake", "SLTDA-G-1042", "English, German", "Cultural Triangle, History", 12, "8500", "0771000007");
        TourGuide shanika = guide(guildGuides, null, "Shanika Dissanayake", "SLTDA-G-2210", "English, French", "Hill country, Tea heritage", 8, "8000", "0773344556");
        TourGuide farook = guide(guildGuides, null, "Mohamed Farook", "SLTDA-G-3305", "English, Tamil, Arabic", "East coast, Wildlife", 10, "7500", "0754455667");
        TourGuide kenji = guide(guildGuides, null, "Pradeep Kenji Wijesinghe", "SLTDA-G-4120", "English, Japanese", "Buddhist heritage, Photography", 6, "9000", "0765566778");
        guide(guildGuides, null, "Lakmini Abeysekera", "SLTDA-G-5011", "English, Sinhala, Chinese", "Southern coast, Food tours", 4, "7000", "0706677889");

        // ---------------------------------------------------------------- contracts and rates (UC-02)
        contract(hillHotels.getId(), today.minusMonths(14), today.plusDays(30), "12.00", "Monthly, 30 days", "Original 2025 agreement: 12% commission, cancellation free up to 14 days before arrival.", business);
        contract(hillHotels.getId(), today.minusMonths(2), today.plusMonths(22), "10.00", "Monthly, 30 days", "Renewed agreement: 10% commission, guaranteed allotment of rooms, free cancellation up to 7 days before arrival, breakfast included.", business);
        contract(coastResorts.getId(), today.minusMonths(6), today.plusMonths(18), "11.50", "Bi-weekly", "Beach resorts agreement: 11.5% commission, sea-view upgrade on availability for honeymoon guests.", business);
        contract(islandStays.getId(), today.minusMonths(4), today.plusMonths(20), "10.00", "Monthly", "Cultural triangle and east coast properties: 10% commission, early check-in for guests arriving before 10:00.", business);
        contract(islandWheels.getId(), today.minusMonths(8), today.plusMonths(16), "8.00", "Per trip, 14 days", "Vehicles with licensed drivers, fuel and highway tolls included, driver accommodation provided by the hotel.", business);
        contract(coachLines.getId(), today.minusMonths(3), today.plusMonths(21), "7.50", "Monthly", "Large-group coaches with A/C; replacement vehicle within 4 hours on breakdown.", business);
        contract(guildGuides.getId(), today.minusMonths(10), today.plusMonths(14), "5.00", "Weekly", "SLTDA licensed guides, daily rate covers 10 hours, guide meals provided by Explore Lanka.", business);

        rate(hillHotels, "Kandy Lakeside - Deluxe room", ServiceRate.Unit.PER_NIGHT, "17000", ResourceType.HOTEL, kandyLake.getId());
        rate(hillHotels, "Kandy Lakeside - Deluxe room", ServiceRate.Unit.PER_NIGHT, "18000", ResourceType.HOTEL, kandyLake.getId());   // +5.9% -> auto approved, v1 superseded
        rate(hillHotels, "Ella Mist - Eco room", ServiceRate.Unit.PER_NIGHT, "12500", ResourceType.HOTEL, ellaMist.getId());
        rate(coastResorts, "Mirissa Ocean Breeze - Sea view room", ServiceRate.Unit.PER_NIGHT, "22000", ResourceType.HOTEL, mirissa.getId());
        rate(coastResorts, "Mirissa Ocean Breeze - Sea view room", ServiceRate.Unit.PER_NIGHT, "30000", ResourceType.HOTEL, mirissa.getId()); // +36% -> needs admin approval
        rate(islandStays, "Sigiriya Rock View - Superior room", ServiceRate.Unit.PER_NIGHT, "19500", ResourceType.HOTEL, sigiriya.getId());
        rate(islandWheels, "KDH van with driver", ServiceRate.Unit.PER_DAY, "12000", ResourceType.VEHICLE, kdh.getId());
        rate(islandWheels, "KDH van with driver", ServiceRate.Unit.PER_DAY, "13000", ResourceType.VEHICLE, kdh.getId());
        rate(islandWheels, "Airport transfer (Colombo)", ServiceRate.Unit.PER_TRIP, "8500", null, null);
        rate(guildGuides, "National guide - English", ServiceRate.Unit.PER_DAY, "8500", ResourceType.GUIDE, chaminda.getId());

        // ---------------------------------------------------------------- tour packages (Factory)
        LocalDate from = today.minusMonths(3);
        LocalDate to = today.plusMonths(14);

        TourPackage cultural = pkg(PackageType.STANDARD, "EL-CUL-01", "Cultural Triangle Explorer", TourPackage.Category.CULTURAL, "North Central",
                "Sigiriya, Dambulla, Anuradhapura", 4, "45000", 20, "/images/destinations/sigiriya.png",
                "Climb the Lion Rock, walk among the ruins of the first capital and explore the painted caves of Dambulla on this classic journey through Sri Lanka's ancient kingdoms.",
                "Sigiriya Lion Rock; Dambulla cave temple; Sacred city of Anuradhapura; Village lunch",
                "Entrance tickets; Breakfast and dinner; Bottled water; Village tour",
                "Lunches; Camera permits; Personal expenses", from, to,
                day(1, "Arrival and Dambulla cave temple", "Visit the five painted caves of the Golden Temple.", "Dambulla", "Colombo -> Kurunegala -> Dambulla"),
                day(2, "Sigiriya Lion Rock", "Early climb of the 5th-century rock fortress, afternoon village tour with lunch.", "Sigiriya", "Dambulla -> Sigiriya -> Hiriwadunna village"),
                day(3, "Sacred city of Anuradhapura", "Ruwanwelisaya, Sri Maha Bodhi and the ancient reservoirs by bicycle.", "Anuradhapura", "Sigiriya -> Habarana -> Anuradhapura"),
                day(4, "Mihintale and departure", "Sunrise at Mihintale, the cradle of Buddhism, then return.", "Mihintale", "Anuradhapura -> Mihintale -> Colombo"));

        TourPackage ellaAdventure = pkg(PackageType.STANDARD, "EL-ELL-01", "Ella Adventure Tour", TourPackage.Category.ADVENTURE, "Uva",
                "Ella, Nuwara Eliya", 3, "24500", 15, "/images/destinations/ella.png",
                "Ride the famous blue train through tea country, hike Little Adam's Peak and Ella Rock, and watch the train cross the Nine Arch Bridge.",
                "Scenic train ride; Nine Arch Bridge; Little Adam's Peak; Ravana Falls",
                "Train tickets (reserved); Breakfast; Hiking guide on day 2",
                "Lunch and dinner; Zip-line activity", from, to,
                day(1, "Scenic train to Ella", "Board the train at Nanu Oya and travel through tea estates to Ella.", "Ella", "Nuwara Eliya -> Nanu Oya station -> Ella"),
                day(2, "Hikes and the Nine Arch Bridge", "Sunrise hike to Little Adam's Peak, Nine Arch Bridge, Ravana Falls.", "Ella", "Ella town -> Little Adam's Peak -> Nine Arch Bridge -> Ravana Falls"),
                day(3, "Ella Rock and departure", "Morning hike up Ella Rock before heading home.", "Ella", "Ella -> Ella Rock -> Colombo"));

        SeasonalPackage perahera = (SeasonalPackage) pkg(PackageType.SEASONAL, "EL-KAN-01", "Kandy Esala Perahera Special", TourPackage.Category.CULTURAL, "Central",
                "Kandy", 3, "32000", 12, "/images/destinations/kandy.png",
                "Experience Asia's grandest pageant - the Esala Perahera - with reserved seating, plus the Temple of the Tooth and the Royal Botanical Gardens.",
                "Reserved Perahera seats; Temple of the Tooth; Peradeniya gardens; Kandyan dance show",
                "Perahera seating; Breakfast; Cultural show tickets", "Lunch and dinner; Tips", from, to,
                day(1, "Arrival in Kandy", "Temple of the Tooth evening puja and Kandyan dance show.", "Kandy", "Colombo -> Pinnawala -> Kandy"),
                day(2, "Esala Perahera night", "Royal Botanical Gardens by day, reserved seats for the Perahera at night.", "Kandy", "Kandy -> Peradeniya -> Kandy city"),
                day(3, "Tea factory and departure", "Visit a working tea factory on the way back.", "Kandy", "Kandy -> Gampola -> Colombo"));
        perahera.setSeasonName("Esala festival season");
        perahera.setSeasonStart(next(MonthDay.of(7, 20)));
        perahera.setSeasonEnd(perahera.getSeasonStart().plusDays(25));
        perahera.setSeasonalAdjustmentPercent(new BigDecimal("20"));

        SeasonalPackage southern = (SeasonalPackage) pkg(PackageType.SEASONAL, "EL-SOU-01", "Southern Beach Escape", TourPackage.Category.BEACH, "Southern",
                "Galle, Mirissa, Unawatuna", 5, "38000", 16, "/images/destinations/mirissa.png",
                "Golden beaches, the Dutch fort of Galle, whale watching at Mirissa and lazy afternoons in Unawatuna.",
                "Galle Fort walk; Whale watching; Turtle hatchery; Stilt fishermen",
                "Whale-watching boat; Breakfast; Galle Fort guided walk", "Lunch and dinner; Water sports", from, to,
                day(1, "Galle Fort", "Guided walk on the ramparts and through the old Dutch streets.", "Galle", "Colombo -> Southern Expressway -> Galle"),
                day(2, "Unawatuna and the turtle hatchery", "Beach day with a visit to the Kosgoda turtle hatchery.", "Unawatuna", "Galle -> Kosgoda -> Unawatuna"),
                day(3, "Whale watching at Mirissa", "Early boat trip to see blue whales and dolphins.", "Mirissa", "Unawatuna -> Mirissa harbour"),
                day(4, "Stilt fishermen and Coconut Tree Hill", "Koggala stilt fishermen, sunset at Coconut Tree Hill.", "Mirissa", "Mirissa -> Koggala -> Mirissa"),
                day(5, "Departure", "Free morning on the beach, return to Colombo.", "Mirissa", "Mirissa -> Colombo"));
        LocalDate festive = next(MonthDay.of(12, 15));
        southern.setSeasonName("Festive peak");
        southern.setSeasonStart(festive);
        southern.setSeasonEnd(festive.plusDays(26));
        southern.setSeasonalAdjustmentPercent(new BigDecimal("15"));

        TourPackage yala = pkg(PackageType.STANDARD, "EL-YAL-01", "Yala Safari Escape", TourPackage.Category.WILDLIFE, "Southern",
                "Yala", 2, "18000", 12, "/images/destinations/yala.png",
                "Two jeep safaris in Yala National Park - home to the world's highest density of leopards - with a night in a luxury tented camp.",
                "Two jeep safaris; Leopards and elephants; Tented camp; Bonfire dinner",
                "Park entrance; Safari jeep and tracker; Full board at camp", "Drinks; Tips", from, to,
                day(1, "Afternoon safari", "Arrive at the camp and set out on an afternoon jeep safari.", "Yala", "Tissamaharama -> Yala Block 1"),
                day(2, "Dawn safari and departure", "Sunrise safari when the leopards are most active.", "Yala", "Yala camp -> Yala Block 1 -> Tissamaharama"));

        CustomPackage teaTrails = (CustomPackage) pkg(PackageType.CUSTOM, "EL-TEA-01", "Hill Country Tea Trails", TourPackage.Category.HILL_COUNTRY, "Central",
                "Kandy, Nuwara Eliya, Ella", 6, "52000", 10, "/images/why-is-the-pekoe-trail-so-thumbnail.jpg",
                "A customisable journey along the Pekoe Trail: tea factories, misty plantations and colonial Nuwara Eliya. Add extra days to slow down.",
                "Pekoe Trail walk; Tea plucking with estate workers; Horton Plains; Gregory Lake",
                "Breakfast and dinner; Tea factory visits; Horton Plains entry", "Lunch; Optional activities", from, to,
                day(1, "Kandy", "Temple of the Tooth and the lake.", "Kandy", "Colombo -> Kandy"),
                day(2, "Into the tea country", "Drive past waterfalls to a tea factory and plantation walk.", "Nuwara Eliya", "Kandy -> Ramboda Falls -> Nuwara Eliya"),
                day(3, "Horton Plains", "World's End and Baker's Falls walk.", "Nuwara Eliya", "Nuwara Eliya -> Horton Plains -> Nuwara Eliya"),
                day(4, "Pekoe Trail", "Guided walk on a section of the Pekoe Trail.", "Nuwara Eliya", "Nuwara Eliya -> Pekoe Trail stage 12 -> Haputale"),
                day(5, "Ella", "Lipton's Seat sunrise and Ella in the afternoon.", "Ella", "Haputale -> Lipton's Seat -> Ella"),
                day(6, "Departure", "Return to Colombo.", "Ella", "Ella -> Colombo"));
        teaTrails.setExtraDayPrice(new BigDecimal("9500"));
        teaTrails.setMaxExtraDaysAllowed(5);

        CustomPackage honeymoon = (CustomPackage) pkg(PackageType.CUSTOM, "EL-HON-01", "Romantic Honeymoon Retreat", TourPackage.Category.HONEYMOON, "Southern",
                "Galle, Mirissa", 5, "85000", 4, "/images/mirissa-sunset-wallpaper.png",
                "Candle-lit dinners in Galle Fort, a private sunset cruise and spa time by the ocean. Extend your stay as long as you like.",
                "Private sunset cruise; Couples spa; Candle-lit dinner; Room upgrade",
                "All meals; Sunset cruise; Spa session", "Alcoholic drinks", from, to,
                day(1, "Galle Fort welcome", "Check in and candle-lit dinner on the ramparts.", "Galle", "Colombo -> Galle"),
                day(2, "Couples spa", "Ayurvedic spa treatment and free afternoon.", "Galle", null),
                day(3, "Mirissa", "Move to the beach and enjoy a private sunset cruise.", "Mirissa", "Galle -> Mirissa"),
                day(4, "Beach day", "Free day, optional whale watching.", "Mirissa", null),
                day(5, "Departure", "Breakfast and transfer home.", "Mirissa", "Mirissa -> Colombo"));
        honeymoon.setExtraDayPrice(new BigDecimal("15000"));
        honeymoon.setMaxExtraDaysAllowed(7);

        TourPackage eastCoast = pkg(PackageType.STANDARD, "EL-EAS-01", "East Coast Surf & Sun", TourPackage.Category.BEACH, "Eastern",
                "Trincomalee, Arugam Bay", 4, "36000", 14, "/images/destinations/arugam-bay.png",
                "Snorkel at Pigeon Island, visit Koneswaram temple and catch the waves at Arugam Bay - best from April to October.",
                "Pigeon Island snorkelling; Koneswaram temple; Surf lesson; Lagoon safari",
                "Snorkelling trip; Surf lesson; Breakfast", "Lunch and dinner; Board rental after lesson", from, to,
                day(1, "Trincomalee", "Koneswaram temple and Marble Beach.", "Trincomalee", "Habarana -> Trincomalee"),
                day(2, "Pigeon Island", "Snorkelling with reef sharks and turtles.", "Trincomalee", "Trincomalee -> Nilaveli -> Pigeon Island"),
                day(3, "Arugam Bay", "Coastal drive and a surf lesson at Baby Point.", "Arugam Bay", "Trincomalee -> Batticaloa -> Arugam Bay"),
                day(4, "Lagoon safari and departure", "Kumana lagoon safari at dawn.", "Arugam Bay", "Arugam Bay -> Pottuvil lagoon -> Colombo"));

        TourPackage pilgrimage = pkg(PackageType.STANDARD, "EL-PIL-01", "Adam's Peak Pilgrimage", TourPackage.Category.RELIGIOUS, "Sabaragamuwa",
                "Nuwara Eliya, Adam's Peak", 2, "15500", 20, "/images/destinations/adams-peak.png",
                "Join pilgrims on the night climb of Sri Pada to see the sacred footprint and the sunrise shadow of the peak.",
                "Night climb; Sunrise at the summit; Sacred footprint", "Guide for the climb; Breakfast; Packed snacks",
                "Lunch; Donations", from, to,
                day(1, "To the base of Sri Pada", "Drive to Dalhousie, rest, and begin the climb at 2am.", "Nuwara Eliya", "Nuwara Eliya -> Hatton -> Dalhousie"),
                day(2, "Sunrise and return", "Sunrise at the summit, descend and return.", "Adam's Peak", "Dalhousie -> Sri Pada summit -> Colombo"));

        TourPackage colombo = pkg(PackageType.STANDARD, "EL-COL-01", "Colombo City Day Tour", TourPackage.Category.CULTURAL, "Western",
                "Colombo", 1, "7500", 25, "/images/nine-arch-bridge-about.jpg",
                "A day in the capital: Gangaramaya temple, Galle Face Green, the Pettah markets and the Independence Memorial Hall.",
                "Gangaramaya temple; Pettah market; Galle Face sunset", "Entrance tickets; Lunch; Tuk-tuk ride in Pettah",
                "Shopping; Dinner", from, to,
                day(1, "Colombo highlights", "Temples, markets and a sunset at Galle Face Green.", "Colombo", "Fort -> Pettah -> Gangaramaya -> Galle Face"));

        TourPackage trek = pkg(PackageType.STANDARD, "EL-SIN-01", "Sinharaja Rainforest Trek", TourPackage.Category.ADVENTURE, "Sabaragamuwa",
                "Ella", 3, "29000", 10, "/images/destinations/horton-plains.png",
                "Guided treks through the UNESCO-listed Sinharaja rainforest. (Temporarily unavailable while trails are repaired.)",
                "Endemic birds; Waterfalls; Rainforest lodge", "Forest guide; Meals", "Leech socks", from, to,
                day(1, "Into the forest", "Arrive and first trek.", "Sinharaja", null));
        trek.setStatus(TourPackage.Status.INACTIVE);
        packages.saveAll(List.of(cultural, ellaAdventure, perahera, southern, yala, teaTrails, honeymoon, eastCoast, pilgrimage, colombo, trek));

        // ---------------------------------------------------------------- events and festivals (UC-04)
        EventFestival esala = event("Kandy Esala Perahera", EventFestival.Category.CULTURAL_FESTIVAL, "Central", "Temple of the Tooth, Kandy",
                perahera.getSeasonStart().plusDays(10), perahera.getSeasonStart().plusDays(19), "19:00", "23:30",
                "Modest clothing - shoulders and knees covered", 500, "0", "/images/destinations/kandy.png",
                "Ten nights of torch-lit processions with dancers, drummers and over 100 decorated elephants honouring the Sacred Tooth Relic.", perahera);
        event("Nallur Festival", EventFestival.Category.RELIGIOUS, "Northern", "Nallur Kandaswamy Kovil, Jaffna",
                next(MonthDay.of(8, 1)), next(MonthDay.of(8, 1)).plusDays(24), "05:00", "20:00",
                "Men: veshti, no shirt inside the temple; women: saree or long skirt", 300, "0", "/images/ancient-cities.jpg",
                "A 25-day Hindu festival with chariot processions, music and devotion at Jaffna's most important temple.");
        event("Vesak Lantern Festival", EventFestival.Category.RELIGIOUS, "Western", "Gangaramaya Temple, Colombo",
                next(MonthDay.of(5, 12)), next(MonthDay.of(5, 13)), "18:00", "23:00", "White clothing is customary", 2000, "0",
                "/images/nine-arch-bridge-about.jpg", "Colombo glows with lanterns, pandals and free food stalls (dansal) for the Buddha's birth, enlightenment and passing.");
        event("Kataragama Esala Festival", EventFestival.Category.RELIGIOUS, "Uva", "Kataragama Devalaya",
                next(MonthDay.of(7, 5)), next(MonthDay.of(7, 5)).plusDays(14), "18:00", "22:00", "Modest clothing", 800, "0",
                "/images/destinations/yala.png", "Pilgrims of every faith gather for fire-walking and nightly processions in the jungle town of Kataragama.");
        EventFestival foodFest = event("Colombo Food & Culture Festival", EventFestival.Category.FOOD_AND_DRINK, "Western", "Viharamahadevi Park, Colombo",
                today.plusDays(20), today.plusDays(22), "11:00", "22:00", null, 1500, "1500", "/images/pexels-thilina-alagiyawanna-3266092-31001509.jpg",
                "Hoppers, kottu, lamprais and Jaffna crab curry from 60 stalls, with live baila music every evening.", colombo);
        event("Galle Music Night by the Fort", EventFestival.Category.MUSIC, "Southern", "Galle Fort Ramparts",
                today.plusDays(35), today.plusDays(35), "18:30", "22:30", "Smart casual", 800, "2500", "/images/destinations/unawatuna.png",
                "An open-air concert of Sri Lankan and international artists on the 17th-century ramparts at sunset.", southern, honeymoon);
        EventFestival ellaMusic = event("Ella Tea Country Music Festival", EventFestival.Category.MUSIC, "Uva", "Ella Town Grounds",
                today.plusDays(12), today.plusDays(13), "16:00", "23:00", null, 600, "3000", "/images/destinations/ella.png",
                "Two days of acoustic and electronic music in the hills, with local tea and street food.", ellaAdventure, teaTrails);
        event("Sigiriya Heritage Light Show", EventFestival.Category.EXHIBITION, "North Central", "Sigiriya Museum Grounds",
                today.plusDays(9), today.plusDays(16), "19:00", "21:00", null, 200, "1000", "/images/destinations/sigiriya.png",
                "A projection and storytelling show about King Kashyapa and the frescoes of the Lion Rock.", cultural);
        event("Arugam Bay Surf Cup", EventFestival.Category.SPORTS, "Eastern", "Main Point, Arugam Bay",
                today.plusDays(40), today.plusDays(41), "07:00", "17:00", "Beachwear", 400, "0", "/images/destinations/arugam-bay.png",
                "Local and international surfers compete at the famous right-hand point break.", eastCoast);
        EventFestival deepavali = event("Deepavali Festival of Lights", EventFestival.Category.CULTURAL_FESTIVAL, "Western", "Sea Street, Colombo",
                today.plusDays(28), today.plusDays(28), "17:00", "22:00", null, 1000, "0", "/images/nine-arch-bridge-about.jpg",
                "Oil lamps, sweets and kolam art in Colombo's Hindu quarter.");
        deepavali.setStatus(EventFestival.Status.DRAFT);
        EventFestival poson = event("Poson Poya Celebrations", EventFestival.Category.RELIGIOUS, "North Central", "Mihintale",
                today.minusDays(100), today.minusDays(99), "06:00", "22:00", "White clothing", 3000, "0", "/images/ancient-cities.jpg",
                "Commemorating the arrival of Buddhism in Sri Lanka at Mihintale.");
        poson.setStatus(EventFestival.Status.PUBLISHED);   // expired automatically by the nightly job

        // ---------------------------------------------------------------- promotions (UC-05)
        promotion("Early Bird 15% Off", Promotion.OfferType.EARLY_BIRD, Promotion.DiscountType.PERCENTAGE, "15", "20000", "50000", "EARLYBIRD15",
                today.minusDays(10), today.plusDays(90), 200, Promotion.Status.ACTIVE, "Book any tour early and save 15% (up to LKR 20,000).", Set.of(), Set.of(Promotion.Audience.ALL_CUSTOMERS), 14);
        promotion("Honeymoon Special", Promotion.OfferType.HONEYMOON, Promotion.DiscountType.FIXED_AMOUNT, "10000", null, "80000", "HONEYMOON10K",
                today.minusDays(5), today.plusDays(120), null, Promotion.Status.ACTIVE, "LKR 10,000 off our Romantic Honeymoon Retreat.", Set.of(honeymoon), Set.of(Promotion.Audience.ALL_CUSTOMERS), 3);
        promotion("Family Holiday 20%", Promotion.OfferType.FAMILY, Promotion.DiscountType.PERCENTAGE, "20", "25000", "40000", "FAMILY20",
                today.minusDays(20), today.plusDays(60), null, Promotion.Status.ACTIVE, "Travelling with children? Save 20% on any package.", Set.of(), Set.of(Promotion.Audience.FAMILIES), 6);
        promotion("Group Booking Discount", Promotion.OfferType.GROUP, Promotion.DiscountType.PERCENTAGE, "12", null, "100000", "GROUP12",
                today.minusDays(30), today.plusDays(150), null, Promotion.Status.ACTIVE, "Groups of 6 or more save 12%.", Set.of(), Set.of(Promotion.Audience.GROUPS), 2);
        promotion("Local Resident Saver", Promotion.OfferType.GENERAL, Promotion.DiscountType.FIXED_AMOUNT, "5000", null, "30000", "LOCAL5000",
                today.minusDays(15), today.plusDays(75), 500, Promotion.Status.ACTIVE, "LKR 5,000 off for Sri Lankan residents.", Set.of(), Set.of(Promotion.Audience.LOCAL_RESIDENTS), 9);
        promotion("Festival Season Promotion", Promotion.OfferType.FESTIVAL_SEASON, Promotion.DiscountType.PERCENTAGE, "10", "15000", null, "FESTIVE10",
                today.plusDays(30), today.plusDays(100), null, Promotion.Status.DRAFT, "10% off festival-season tours.", Set.of(perahera, southern), Set.of(Promotion.Audience.ALL_CUSTOMERS), 0);
        promotion("Summer Offer 2026", Promotion.OfferType.SUMMER, Promotion.DiscountType.PERCENTAGE, "8", null, null, "SUMMER8",
                today.minusDays(120), today.minusDays(20), null, Promotion.Status.ACTIVE, "Summer savings (ended).", Set.of(), Set.of(Promotion.Audience.ALL_CUSTOMERS), 11);

        // ---------------------------------------------------------------- completed bookings (history for reports and feedback)
        Booking b1 = pastBooking(emma, cultural, today.minusDays(40), 2, 0, sigiriya, 1, prado, chaminda, Payment.Method.CARD, "VISA **** 4242");
        review(b1, 5, 5, 5, 5, "Chaminda was an outstanding guide - his knowledge of the ancient kingdoms made the trip unforgettable. Sigiriya at sunrise was magical.", false, null);
        Booking b2 = pastBooking(amila, ellaAdventure, today.minusDays(25), 2, 1, ellaMist, 1, kdh, null, Payment.Method.EZ_CASH, "eZ Cash 077***6543");
        review(b2, 4, 4, 5, null, "Beautiful train ride and hikes. The lodge was cosy but hot water was limited in the mornings.", false,
                "Thank you Amila! We have shared your comment about hot water with Ella Mist Eco Lodge and they are installing new heaters.");
        Booking b3 = pastBooking(nadeesha, yala, today.minusDays(15), 4, 0, yalaCamp, 2, kdh, farook, Payment.Method.CARD, "MASTERCARD **** 4444");
        review(b3, 2, 3, 2, 4, "We saw elephants but the jeep broke down on the second safari and we waited an hour for a replacement.", true, null);
        pastBooking(amila, southern, today.minusDays(12), 2, 0, mirissa, 1, axio, null, Payment.Method.CARD, "VISA **** 4242");   // no review yet
        Booking hansTea = pastBooking(hans, teaTrails, today.minusDays(70), 2, 0, nuwaraTea, 1, axio, shanika, Payment.Method.CARD, "VISA **** 1881");
        pastBooking(emma, eastCoast, today.minusDays(100), 3, 0, trinco, 2, prado, farook, Payment.Method.BANK_TRANSFER, "BOC ref TRX88231");
        pastBooking(nadeesha, colombo, today.minusDays(130), 6, 2, null, 0, vanTwo, null, Payment.Method.EZ_CASH, "eZ Cash 071***3445");
        pastBooking(hans, cultural, today.minusDays(150), 2, 0, anuradhapura, 1, axio, kenji, Payment.Method.CARD, "VISA **** 1881");
        pastBooking(amila, pilgrimage, today.minusDays(160), 4, 0, nuwaraTea, 2, kdh, null, Payment.Method.EZ_CASH, "eZ Cash 077***6543");
        review(hansTea, 5, 4, 5, 5, "Wonderful walks through the tea estates. Shanika explained the whole history of Ceylon tea - highly recommended!", false, null);

        // ---------------------------------------------------------------- upcoming bookings through the real booking + payment flow
        // F1 confirmed (card) - custom package with an extra day
        BookingResponse f1 = bookingService.create(request(teaTrails, today.plusDays(20), 2, 0, 1, kandyLake, axio, true, "English", null,
                "Vegetarian meals please", travellers(amila, 2, 0)), amila);
        pay(f1, card("4242 4242 4242 4242"), amila);
        // F2 confirmed (card) - family with a child
        BookingResponse f2 = bookingService.create(request(cultural, today.plusDays(14), 2, 1, 0, sigiriya, prado, true, "German", null,
                null, travellers(emma, 2, 1)), emma);
        pay(f2, card("5555 5555 5555 4444"), emma);
        // F3 pending payment with a local-resident coupon
        bookingService.create(request(yala, today.plusDays(30), 2, 0, 0, yalaCamp, axio, false, null, "LOCAL5000",
                "Celebrating our anniversary", travellers(amila, 2, 0)), amila);
        // F4 bank transfer awaiting verification by Finance
        BookingResponse f4 = bookingService.create(request(eastCoast, today.plusDays(25), 3, 1, 0, trinco, kdh, false, null, null,
                null, travellers(nadeesha, 3, 1)), nadeesha);
        PaymentRequest bank = new PaymentRequest(Payment.Method.BANK_TRANSFER,
                null, null, null, null, "Bank of Ceylon", "BOC2026" + (1000 + random.nextInt(8999)), null, null);
        paymentService.pay(f4.id(), bank, nadeesha);
        // F5 paid then cancelled by the customer -> refund waiting for Finance
        BookingResponse f5 = bookingService.create(request(southern, today.plusDays(45), 2, 0, 0, galleFort, axio, false, null, null,
                null, travellers(emma, 2, 0)), emma);
        pay(f5, card("4242 4242 4242 4242"), emma);
        bookingService.cancelByCustomer(f5.id(), "Change of travel plans - flights were rescheduled", emma);
        // F6 day tour (no hotel) paid by eZ Cash
        BookingResponse f6 = bookingService.create(request(colombo, today.plusDays(10), 4, 0, 0, null, vanTwo, false, null, null,
                null, travellers(nadeesha, 4, 0)), nadeesha);
        PaymentRequest ez = new PaymentRequest(Payment.Method.EZ_CASH,
                null, null, null, null, null, null, "0712233445", "1234");
        paymentService.pay(f6.id(), ez, nadeesha);
        // F7 confirmed, then the guide fell ill -> needs re-allocation by the Tour Operations Manager (UC-01 demo)
        BookingResponse f7 = bookingService.create(request(ellaAdventure, today.plusDays(18), 2, 0, 0, ellaMist, prado, true, "French", null,
                "First time in Sri Lanka", travellers(hans, 2, 0)), hans);
        pay(f7, card("4242 4242 4242 4242"), hans);
        Booking f7b = bookings.findById(f7.id()).orElseThrow();
        allocations.findByBookingIdAndStatus(f7b.getId(), ResourceAllocation.Status.ALLOCATED).stream()
                .filter(a -> a.getResourceType() == ResourceType.GUIDE)
                .forEach(a -> {
                    a.setStatus(ResourceAllocation.Status.RELEASED);
                    for (LocalDate d = f7b.getStartDate(); !d.isAfter(f7b.getEndDate()); d = d.plusDays(1)) {
                        blockedDates.save(new ResourceBlockedDate(ResourceType.GUIDE, a.getResourceId(), d, "Sick leave"));
                    }
                });
        // F8 large group (coach) for the group discount
        BookingResponse f8 = bookingService.create(request(cultural, today.plusDays(60), 8, 2, 0, dambulla, coaster, true, "English", "GROUP12",
                "School reunion group", travellers(amila, 8, 2)), amila);
        pay(f8, card("4242 4242 4242 4242"), amila);

        // ---------------------------------------------------------------- event registrations
        register(foodFest, amila, 2);
        register(ellaMusic, hans, 2);
        register(esala, emma, 3);
        register(foodFest, nadeesha, 4);

        // keep unused references meaningful for readers
        Objects.requireNonNull(admin);
        Objects.requireNonNull(bus);
        Objects.requireNonNull(oldCab);
        Objects.requireNonNull(unawatuna);
        Objects.requireNonNull(arugam);
        Objects.requireNonNull(coachLines);
    }

    /** Databases seeded before the Logistic Supplier Management / Business Manager / Events logins existed get those accounts. */
    private void addMissingDemoAccounts() {
        if (users.countByRole(Role.LOGISTIC_SUPPLIER_MANAGER) == 0 && !users.existsByEmailIgnoreCase("logistics@explorelanka.lk")) {
            user(LOGISTICS_MANAGER_NAME, "logistics@explorelanka.lk", "0771000008", Role.LOGISTIC_SUPPLIER_MANAGER, null);
        User business = user(BUSINESS_MANAGER_NAME, "business@explorelanka.lk", "0771000010", Role.BUSINESS_MANAGER, null);
            log.info("Added demo account logistics@explorelanka.lk (Logistic Supplier Management)");
        }
        if (users.countByRole(Role.BUSINESS_MANAGER) == 0 && !users.existsByEmailIgnoreCase("business@explorelanka.lk")) {
            user(BUSINESS_MANAGER_NAME, "business@explorelanka.lk", "0771000010", Role.BUSINESS_MANAGER, null);
            log.info("Added demo account business@explorelanka.lk (Business Manager)");
        }
        if (!users.existsByEmailIgnoreCase("events@explorelanka.lk")) {
            user(EVENT_ORGANIZER_NAME, "events@explorelanka.lk", "0771000009", Role.EVENT_ORGANIZER, null);
            log.info("Added demo account events@explorelanka.lk (Marketing Executive - Events)");
        }
    }

    // =====================================================================================
    // builders

    private Supplier supplier(String name, Supplier.Type type, String contact, String email, String phone, String address) {
        return suppliers.save(new Supplier(name, type, contact, email, phone, address));
    }

    private User user(String name, String email, String phone, Role role, Supplier supplier) {
        User u = new User(name, email, encoder.encode(DEMO_PASSWORD), phone, role);
        u.setSupplier(supplier);
        return users.save(u);
    }

    private User customer(String name, String email, String phone, String country, String nationality, boolean consent, String prefs) {
        User u = user(name, email, phone, Role.CUSTOMER, null);
        Customer c = new Customer(u);
        c.setCountry(country);
        c.setNationality(nationality);
        c.setMarketingConsent(consent);
        c.setTravelPreferences(prefs);
        customers.save(c);
        return u;
    }

    private Hotel hotel(Supplier s, String name, String city, int stars, int rooms, String price, String amenities, String image) {
        Hotel h = new Hotel();
        h.setSupplier(s);
        h.setName(name);
        h.setCity(city);
        h.setAddress(city + ", Sri Lanka");
        h.setStarRating(stars);
        h.setTotalRooms(rooms);
        h.setPricePerNight(new BigDecimal(price));
        h.setAmenities(amenities);
        h.setDescription(name + " - a " + stars + "-star partner hotel in " + city + ".");
        h.setImageUrl(image);
        return hotels.save(h);
    }

    private Vehicle vehicle(Supplier s, Vehicle.Type type, String model, String reg, int seats, String price, String driver) {
        Vehicle v = new Vehicle();
        v.setSupplier(s);
        v.setType(type);
        v.setModel(model);
        v.setRegistrationNo(reg);
        v.setSeats(seats);
        v.setPricePerDay(new BigDecimal(price));
        v.setDriverName(driver);
        return vehicles.save(v);
    }

    private TourGuide guide(Supplier s, User u, String name, String licence, String languages, String spec, int years, String price, String phone) {
        TourGuide g = new TourGuide();
        g.setSupplier(s);
        g.setUser(u);
        g.setFullName(name);
        g.setLicenseNo(licence);
        g.setLanguages(languages);
        g.setSpecialization(spec);
        g.setExperienceYears(years);
        g.setPricePerDay(new BigDecimal(price));
        g.setPhone(phone);
        g.setEmail(u == null ? null : u.getEmail());
        return guides.save(g);
    }

    private void contract(Long supplierId, LocalDate start, LocalDate end, String commission, String paymentTerms, String terms, User by) {
        partnerService.newContractVersion(supplierId, new ContractRequest(start, end, new BigDecimal(commission), paymentTerms, terms), by.getFullName());
    }

    private void rate(Supplier s, String service, ServiceRate.Unit unit, String amount, ResourceType type, Long resourceId) {
        partnerService.proposeRate(s.getId(), new RateRequest(service, unit, new BigDecimal(amount), today, type, resourceId), BUSINESS_MANAGER_NAME);
    }

    private PackageItineraryDay day(int n, String title, String description, String location, String route) {
        return new PackageItineraryDay(n, title, description, location, route);
    }

    private TourPackage pkg(PackageType type, String code, String name, TourPackage.Category category, String region,
                            String destinations, int days, String price, int maxGroup, String image, String description,
                            String highlights, String inclusions, String exclusions, LocalDate from, LocalDate to,
                            PackageItineraryDay... itinerary) {
        TourPackage p = packageFactory.create(type);   // Factory pattern
        p.setCode(code);
        p.setName(name);
        p.setCategory(category);
        p.setRegion(region);
        p.setDestinations(destinations);
        p.setDurationDays(days);
        p.setBasePrice(new BigDecimal(price));
        p.setMaxGroupSize(maxGroup);
        p.setImageUrl(image);
        p.setDescription(description);
        p.setHighlights(highlights);
        p.setInclusions(inclusions);
        p.setExclusions(exclusions);
        p.setAvailableFrom(from);
        p.setAvailableTo(to);
        p.replaceItinerary(List.of(itinerary));
        return p;
    }

    private EventFestival event(String name, EventFestival.Category category, String region, String location, LocalDate start,
                                LocalDate end, String startTime, String endTime, String dressCode, int max, String price,
                                String image, String description, TourPackage... linked) {
        EventFestival e = new EventFestival();
        e.setName(name);
        e.setCategory(category);
        e.setRegion(region);
        e.setLocation(location);
        e.setStartDate(start);
        e.setEndDate(end);
        e.setStartTime(LocalTime.parse(startTime));
        e.setEndTime(LocalTime.parse(endTime));
        e.setDressCode(dressCode);
        e.setMaxParticipants(max);
        e.setTicketPrice(new BigDecimal(price));
        e.setImageUrl(image);
        e.setDescription(description);
        e.setStatus(EventFestival.Status.PUBLISHED);
        e.setCreatedBy(EVENT_ORGANIZER_NAME);
        e.getLinkedPackages().addAll(Arrays.asList(linked));
        return events.save(e);
    }

    private void promotion(String title, Promotion.OfferType offer, Promotion.DiscountType type, String value, String max, String minSpend,
                           String code, LocalDate start, LocalDate end, Integer limit, Promotion.Status status, String description,
                           Set<TourPackage> pkgs, Set<Promotion.Audience> audiences, int timesApplied) {
        Promotion p = new Promotion();
        p.setTitle(title);
        p.setOfferType(offer);
        p.setDiscountType(type);
        p.setDiscountValue(new BigDecimal(value));
        p.setMaxDiscount(max == null ? null : new BigDecimal(max));
        p.setMinSpend(minSpend == null ? null : new BigDecimal(minSpend));
        p.setCouponCode(code);
        p.setStartDate(start);
        p.setEndDate(end);
        p.setUsageLimit(limit);
        p.setStatus(status);
        p.setDescription(description);
        p.getPackages().addAll(pkgs);
        p.getAudiences().clear();
        p.getAudiences().addAll(audiences);
        p.setTimesApplied(timesApplied);
        p.setCreatedBy("Tharushi Wickramasinghe");
        promotions.save(p);
    }

    /** A finished tour, created directly because the booking rules only accept future dates. */
    private Booking pastBooking(User customer, TourPackage p, LocalDate start, int adults, int children, Hotel hotel, int rooms,
                                Vehicle vehicle, TourGuide guide, Payment.Method method, String masked) {
        int days = p.getDurationDays();
        LocalDate end = start.plusDays(days - 1L);
        int nights = days - 1;
        Booking b = new Booking();
        b.setReference("BK" + (start.getYear() % 100) + String.format("%05d", 10000 + random.nextInt(89999)));
        b.setCustomer(customer);
        b.setTourPackage(p);
        b.setStartDate(start);
        b.setEndDate(end);
        b.setAdults(adults);
        b.setChildren(children);
        b.setRooms(nights == 0 ? 0 : rooms);
        b.setPreferredHotel(nights == 0 ? null : hotel);
        b.setPreferredVehicle(vehicle);
        b.setGuideRequired(guide != null);
        b.setGuideLanguage(guide == null ? null : "English");
        BigDecimal pkgCost = p.packageCost(start, adults, children, 0);
        BigDecimal acc = hotel == null || nights == 0 ? BigDecimal.ZERO : hotel.getPricePerNight().multiply(BigDecimal.valueOf((long) rooms * nights));
        BigDecimal transport = vehicle.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal guideCost = guide == null ? BigDecimal.ZERO : guide.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal subtotal = pkgCost.add(acc).add(transport).add(guideCost);
        b.setPackageCost(pkgCost);
        b.setAccommodationCost(acc);
        b.setTransportCost(transport);
        b.setGuideCost(guideCost);
        b.setSubtotal(subtotal);
        b.setDiscountAmount(BigDecimal.ZERO);
        b.setTotalAmount(subtotal);
        b.setStatus(BookingStatus.COMPLETED);
        b.setConfirmedAt(start.minusDays(20).atTime(10, 30));
        b.replaceTravelers(travellerEntities(customer, adults, children));
        b.setCreatedAt(start.minusDays(21).atTime(9, 15));   // realistic history for monthly reports
        bookings.save(b);

        Payment pay = new Payment();
        pay.setBooking(b);
        pay.setAmount(subtotal);
        pay.setMethod(method);
        pay.setStatus(Payment.Status.SUCCESS);
        pay.setMaskedDetails(masked);
        pay.setTransactionRef("PAY-HIST-" + b.getReference());
        pay.setPaidAt(start.minusDays(20).atTime(10, 30));
        payments.save(pay);

        Invoice inv = new Invoice();
        inv.setBooking(b);
        inv.setPayment(pay);
        inv.setSubtotal(subtotal);
        inv.setDiscount(BigDecimal.ZERO);
        inv.setTotal(subtotal);
        inv.setInvoiceNo("INV-" + start.getYear() + "-" + b.getReference().substring(2));
        invoices.save(inv);

        if (hotel != null && nights > 0) {
            allocation(b, ResourceType.HOTEL, hotel.getId(), hotel.getName() + ", " + hotel.getCity(), rooms);
        }
        allocation(b, ResourceType.VEHICLE, vehicle.getId(), vehicle.label() + " " + vehicle.getRegistrationNo(), 1);
        if (guide != null) {
            allocation(b, ResourceType.GUIDE, guide.getId(), guide.getFullName(), 1);
        }
        bookingService.generateItinerary(b);
        return b;
    }

    private void allocation(Booking b, ResourceType type, Long id, String name, int qty) {
        ResourceAllocation a = new ResourceAllocation();
        a.setBooking(b);
        a.setResourceType(type);
        a.setResourceId(id);
        a.setResourceName(name);
        a.setStartDate(b.getStartDate());
        a.setEndDate(b.getEndDate());
        a.setQuantity(qty);
        a.setAllocatedBy("System (auto)");
        allocations.save(a);
    }

    private void review(Booking b, int overall, Integer hotel, Integer transport, Integer guide, String comment, boolean complaint, String response) {
        Feedback f = new Feedback();
        f.setBooking(b);
        f.setCustomer(b.getCustomer());
        f.setTourPackage(b.getTourPackage());
        f.setOverallRating(overall);
        f.setHotelRating(hotel);
        f.setTransportRating(transport);
        f.setGuideRating(guide);
        f.setComment(comment);
        f.setComplaint(complaint);
        if (response != null) {
            f.setResponse(response);
            f.setRespondedBy("Ishara Fernando");
            f.setRespondedAt(LocalDateTime.now().minusDays(3));
            f.setStatus(Feedback.Status.RESPONDED);
        }
        feedback.save(f);
    }

    private void register(EventFestival e, User customer, int participants) {
        EventRegistration r = new EventRegistration();
        r.setEvent(e);
        r.setCustomer(customer);
        r.setParticipants(participants);
        registrations.save(r);
    }

    private BookingRequest request(TourPackage p, LocalDate start, int adults, int children, int extraDays, Hotel hotel, Vehicle vehicle,
                                   boolean guide, String language, String promo, String requests, List<TravelerDto> travellers) {
        int rooms = hotel == null ? 0 : (adults + children + 1) / 2;
        return new BookingRequest(p.getId(), start, adults, children, extraDays, rooms, hotel == null ? null : hotel.getId(),
                vehicle.getId(), guide, language, promo, requests, travellers);
    }

    private void pay(BookingResponse booking, PaymentRequest req, User customer) {
        paymentService.pay(booking.id(), req, customer);
    }

    private PaymentRequest card(String number) {
        return new PaymentRequest(Payment.Method.CARD, "Card Holder", number, "12/29", "123", null, null, null, null);
    }

    private static final String[] COMPANION_FIRST = {"Kavindi", "Tharindu", "Sachini", "Dinuka", "Oliver", "Sophie", "Ravindu", "Mia", "Lucas", "Anjali"};
    private static final String[] CHILD_FIRST = {"Senuli", "Thenuka", "Lily", "Noah"};

    private List<TravelerDto> travellers(User lead, int adults, int children) {
        return travellerEntities(lead, adults, children).stream().map(TravelerDto::from).toList();
    }

    private List<TravelerDetail> travellerEntities(User lead, int adults, int children) {
        List<TravelerDetail> list = new ArrayList<>();
        String surname = lead.getFullName().substring(lead.getFullName().lastIndexOf(' ') + 1);
        String nationality = customers.findByUserId(lead.getId()).map(Customer::getNationality).orElse("Sri Lankan");
        list.add(new TravelerDetail(lead.getFullName(), TravelerDetail.Type.ADULT, 34, nationality, "N" + (1000000 + random.nextInt(8999999))));
        for (int i = 1; i < adults; i++) {
            list.add(new TravelerDetail(COMPANION_FIRST[(i - 1) % COMPANION_FIRST.length] + " " + surname, TravelerDetail.Type.ADULT,
                    25 + random.nextInt(30), nationality, "N" + (1000000 + random.nextInt(8999999))));
        }
        for (int i = 0; i < children; i++) {
            list.add(new TravelerDetail(CHILD_FIRST[i % CHILD_FIRST.length] + " " + surname, TravelerDetail.Type.CHILD,
                    4 + random.nextInt(7), nationality, null));
        }
        return list;
    }

    /** Next occurrence (today or later) of a month/day, e.g. the next Vesak full moon window. */
    private LocalDate next(MonthDay md) {
        LocalDate d = md.atYear(today.getYear());
        return d.isBefore(today) ? md.atYear(today.getYear() + 1) : d;
    }
}
