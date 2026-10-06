package com.project.webbasedtourismandtravelmanagementsystem.event.repository;

import com.project.webbasedtourismandtravelmanagementsystem.event.model.EventFestival;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface EventFestivalRepository extends JpaRepository<EventFestival, Long> {

    List<EventFestival> findAllByOrderByStartDateAsc();

    List<EventFestival> findByStatusAndEndDateGreaterThanEqualOrderByStartDateAsc(EventFestival.Status status, LocalDate date);

    /** Events at the same venue whose dates overlap - candidates for a scheduling clash. */
    List<EventFestival> findByLocationIgnoreCaseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            String location, LocalDate endDate, LocalDate startDate);

    List<EventFestival> findByStatusInAndEndDateBefore(List<EventFestival.Status> statuses, LocalDate date);
}
