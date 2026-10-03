package com.project.webbasedtourismandtravelmanagementsystem.Event.Service;


import com.project.webbasedtourismandtravelmanagementsystem.Event.Model.Event;

import java.util.List;



public interface EventService {


    Event createEvent(Event event);


    List<Event> getAllEvents();


    Event getEventById(Long id);


    Event updateEvent(Long id, Event event);


    void deleteEvent(Long id);

}