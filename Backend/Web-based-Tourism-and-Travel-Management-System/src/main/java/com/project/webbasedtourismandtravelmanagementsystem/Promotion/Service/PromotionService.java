package com.project.webbasedtourismandtravelmanagementsystem.promotion.service;

import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Customer;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.Role;
import com.project.webbasedtourismandtravelmanagementsystem.auth.model.User;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.CustomerRepository;
import com.project.webbasedtourismandtravelmanagementsystem.auth.repository.UserRepository;
import com.project.webbasedtourismandtravelmanagementsystem.booking.model.Booking;
import com.project.webbasedtourismandtravelmanagementsystem.booking.repository.BookingRepository;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.NotFoundException;
import com.project.webbasedtourismandtravelmanagementsystem.notification.model.Notification;
import com.project.webbasedtourismandtravelmanagementsystem.notification.service.NotificationService;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.dto.PromotionDtos.*;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.model.Promotion;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.repository.PromotionRepository;
import com.project.webbasedtourismandtravelmanagementsystem.promotion.strategy.DiscountCalculator;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.model.TourPackage;
import com.project.webbasedtourismandtravelmanagementsystem.tourpackage.repository.TourPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@Transactional
public class PromotionService {

    }


    private final PromotionRepository promotionRepository;
    private final TourPackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DiscountCalculator discountCalculator;
    private final NotificationService notificationService;

                            NotificationService notificationService) {
        this.promotionRepository = promotionRepository;
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.discountCalculator = discountCalculator;
        this.notificationService = notificationService;
    }


    @Transactional(readOnly = true)
    public List<PromotionResponse> listAll() {
    }

    @Transactional(readOnly = true)
    public PromotionResponse get(Long id) {
    }

    @Transactional(readOnly = true)
    public List<PromotionResponse> activeOffers() {
        LocalDate today = LocalDate.now();
    }


        if (promotionRepository.existsByCouponCodeIgnoreCase(code)) {
        }
        }
        }
    }

        }
        }
            }
        }
        }
    }

    public PromotionResponse publish(Long id) {
        }
        }
    }

    public PromotionResponse deactivate(Long id) {
    }

    public void delete(Long id) {
        }
    }


        if (countEngagement) {
        }
        }
        }
        }
        }
        }
    }

        }
    }


    @Transactional(readOnly = true)
    public List<PromotionPerformance> performance() {
        }
    }


    public int expireFinished() {
        return finished.size();
    }


        }
            }
        } else {

            }
    }

            return true;
        }
            };
                return true;
            }
        }
        return false;
    }

            if (consent) {
            }
        }
    }

        }
    }

    }

    private Promotion find(Long id) {
    }
}