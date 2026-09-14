package com.project.webbasedtourismandtravelmanagementsystem.resource.service;


import com.project.webbasedtourismandtravelmanagementsystem.resource.model.Resource;
import com.project.webbasedtourismandtravelmanagementsystem.resource.repository.ResourceRepository;


import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class ResourceServiceImpl
        implements ResourceService {


    private final ResourceRepository resourceRepository;



    public ResourceServiceImpl(
            ResourceRepository resourceRepository) {

        this.resourceRepository = resourceRepository;
    }



    @Override
    public Resource createResource(Resource resource) {

        return resourceRepository.save(resource);
    }



    @Override
    public List<Resource> getAllResources() {

        return resourceRepository.findAll();
    }



    @Override
    public Resource getResourceById(Long id) {

        return resourceRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Resource not found"));
    }



    @Override
    public Resource updateResource(
            Long id,
            Resource resource) {


        Resource existing =
                getResourceById(id);


        existing.setResourceName(
                resource.getResourceName());


        existing.setResourceType(
                resource.getResourceType());


        existing.setAvailabilityStatus(
                resource.getAvailabilityStatus());


        existing.setCost(
                resource.getCost());


        return resourceRepository.save(existing);
    }



    @Override
    public void deleteResource(Long id) {

        resourceRepository.deleteById(id);

    }

}