package com.project.webbasedtourismandtravelmanagementsystem.Event.Service;



import com.project.webbasedtourismandtravelmanagementsystem.Event.Model.Event;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Repository.EventRepository;


import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class EventServiceImpl
        implements EventService {



    private final EventRepository eventRepository;



    public EventServiceImpl(
            EventRepository eventRepository) {

        this.eventRepository = eventRepository;
    }



    @Override
    public Event createEvent(Event event) {

        return eventRepository.save(event);
    }



    @Override
    public List<Event> getAllEvents() {

        return eventRepository.findAll();
    }



    @Override
    public Event getEventById(Long id) {


        return eventRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Event not found"));
    }



    @Override
    public Event updateEvent(
            Long id,
            Event event) {


        Event existing =
                getEventById(id);


        existing.setEventName(
                event.getEventName());


        existing.setDescription(
                event.getDescription());


        existing.setEventDate(
                event.getEventDate());


        existing.setLocation(
                event.getLocation());


        existing.setStatus(
                event.getStatus());


        return eventRepository.save(existing);
    }



    @Override
    public void deleteEvent(Long id) {

        eventRepository.deleteById(id);
    }

}