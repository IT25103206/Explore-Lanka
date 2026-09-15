// ====================================
// Explore Lanka Resource Management JS
// ====================================


const RESOURCE_API = "/api/resources";




// Load resources

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadResources();

    });





// ================================
// GET ALL RESOURCES
// ================================


function loadResources(){


    fetch(RESOURCE_API)


        .then(response => response.json())


        .then(data => {


            displayResources(data);


        })


        .catch(error=>{

            console.log(error);

        });


}







// ================================
// DISPLAY RESOURCES
// ================================


function displayResources(resources){


    let container =
        document.getElementById(
            "resourceList"
        );



    container.innerHTML="";



    resources.forEach(resource=>{


        container.innerHTML += `


<div class="resource-card">


<h3>
${resource.resourceName}
</h3>



<p>

Type:

<span class="resource-type">

${resource.resourceType}

</span>

</p>



<p>

Availability:

<span class="resource-status">

${resource.availabilityStatus}

</span>

</p>



<p class="resource-cost">

Rs. ${resource.cost}

</p>



<button

class="edit-resource-btn"

onclick="editResource(${resource.resourceId})">

Edit

</button>




<button

class="delete-resource-btn"

onclick="deleteResource(${resource.resourceId})">

Delete

</button>


</div>


`;



    });


}







// ================================
// CREATE RESOURCE
// ================================


function saveResource(){



    let resource = {


        resourceName:
        document.getElementById(
            "resourceName"
        ).value,



        resourceType:
        document.getElementById(
            "resourceType"
        ).value,



        availabilityStatus:
        document.getElementById(
            "availabilityStatus"
        ).value,



        cost:
        document.getElementById(
            "cost"
        ).value



    };





    fetch(RESOURCE_API,
        {


            method:"POST",


            headers:{


                "Content-Type":
                    "application/json"


            },


            body:
                JSON.stringify(resource)


        })



        .then(response=>response.json())


        .then(()=>{


            alert(
                "Resource Added Successfully"
            );


            loadResources();


            clearResourceForm();


        });



}







// ================================
// DELETE RESOURCE
// ================================


function deleteResource(id){



    if(confirm(
        "Delete this resource?"
    )){



        fetch(
            `${RESOURCE_API}/${id}`,
            {

                method:"DELETE"

            }

        )


            .then(()=>{


                alert(
                    "Resource Deleted Successfully"
                );


                loadResources();


            });


    }


}







// ================================
// EDIT RESOURCE
// ================================


function editResource(id){



    fetch(
        `${RESOURCE_API}/${id}`
    )



        .then(response=>response.json())


        .then(resource=>{


            document.getElementById(
                "resourceId"
            ).value =
                resource.resourceId;




            document.getElementById(
                "resourceName"
            ).value =
                resource.resourceName;




            document.getElementById(
                "resourceType"
            ).value =
                resource.resourceType;




            document.getElementById(
                "availabilityStatus"
            ).value =
                resource.availabilityStatus;




            document.getElementById(
                "cost"
            ).value =
                resource.cost;



        });


}







// ================================
// CLEAR FORM
// ================================


function clearResourceForm(){


    document.getElementById(
        "resourceForm"
    ).reset();


}