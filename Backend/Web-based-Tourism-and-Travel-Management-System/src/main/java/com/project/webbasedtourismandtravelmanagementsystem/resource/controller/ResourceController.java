package com.project.webbasedtourismandtravelmanagementsystem.resource.controller;


import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Resource;
import com.project.webbasedtourismandtravelmanagementsystem.resource.service.ResourceService;


import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/resources")
@CrossOrigin
public class ResourceController {



    private final ResourceService resourceService;



    public ResourceController(
            ResourceService resourceService) {

        this.resourceService = resourceService;
    }





    @PostMapping
    public Resource createResource(
            @RequestBody Resource resource) {


        return resourceService
                .createResource(resource);
    }





    @GetMapping
    public List<Resource> getAllResources() {


        return resourceService
                .getAllResources();
    }





    @GetMapping("/{id}")
    public Resource getResourceById(
            @PathVariable Long id) {


        return resourceService
                .getResourceById(id);
    }





    @PutMapping("/{id}")
    public Resource updateResource(
            @PathVariable Long id,
            @RequestBody Resource resource) {


        return resourceService
                .updateResource(id, resource);
    }





    @DeleteMapping("/{id}")
    public String deleteResource(
            @PathVariable Long id) {


        resourceService.deleteResource(id);


        return "Resource deleted successfully";
    }

}
