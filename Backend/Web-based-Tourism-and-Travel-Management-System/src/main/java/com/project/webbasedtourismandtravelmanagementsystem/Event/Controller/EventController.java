package com.project.webbasedtourismandtravelmanagementsystem.Event.Controller;



import com.project.webbasedtourismandtravelmanagementsystem.Event.Controller.EventController;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Model.Event;
import com.project.webbasedtourismandtravelmanagementsystem.Event.Service.EventService;


import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/events")
@CrossOrigin
public class EventController {



    private final EventService eventService;



    public EventController(
            EventService eventService) {

        this.eventService = eventService;
    }




    // CREATE EVENT

    @PostMapping
    public Event createEvent(
            @RequestBody Event event) {


        return eventService.createEvent(event);
    }




    // GET ALL EVENTS

    @GetMapping
    public List<Event> getAllEvents() {


        return eventService.getAllEvents();
    }




    // GET EVENT BY ID

    @GetMapping("/{id}")
    public Event getEventById(
            @PathVariable Long id) {


        return eventService.getEventById(id);
    }





    // UPDATE EVENT

    @PutMapping("/{id}")
    public Event updateEvent(
            @PathVariable Long id,
            @RequestBody Event event) {


        return eventService.updateEvent(id,event);
    }





    // DELETE EVENT

    @DeleteMapping("/{id}")
    public String deleteEvent(
            @PathVariable Long id) {


        eventService.deleteEvent(id);

        return "Event deleted successfully";
    }

}