const EVENT_API = "/api/events";


// Load events when page opens

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadEvents();

    });



// GET ALL EVENTS


function loadEvents(){


    fetch(EVENT_API)


        .then(response => response.json())


        .then(data=>{


            displayEvents(data);


        })


        .catch(error=>{

            console.log(error);

        });


}




// DISPLAY EVENTS


function displayEvents(events){


    let container =
        document.getElementById(
            "eventList"
        );



    container.innerHTML="";



    events.forEach(event=>{


        container.innerHTML += `


<div class="event-card">


<h3>
${event.eventName}
</h3>



<p class="event-description">

${event.description}

</p>



<p class="event-location">

Location:
${event.location}

</p>



<p class="event-date">

Date:
${event.eventDate}

</p>



<p>

Status:
<span class="status-active">

${event.status}

</span>

</p>



<button 
class="edit-event-btn"
onclick="editEvent(${event.eventId})">

Edit

</button>



<button 
class="delete-event-btn"
onclick="deleteEvent(${event.eventId})">

Delete

</button>



</div>

`;

    });

}




// CREATE EVENT


function saveEvent(){



    let event={


        eventName:
        document.getElementById(
            "eventName"
        ).value,



        description:
        document.getElementById(
            "description"
        ).value,



        eventDate:
        document.getElementById(
            "eventDate"
        ).value,



        location:
        document.getElementById(
            "location"
        ).value,



        status:
        document.getElementById(
            "status"
        ).value


    };




    fetch(EVENT_API,
        {


            method:"POST",


            headers:{


                "Content-Type":
                    "application/json"


            },


            body:
                JSON.stringify(event)


        })



        .then(response=>response.json())



        .then(()=>{


            alert(
                "Event Added Successfully"
            );


            loadEvents();


            clearEventForm();


        });



}



// DELETE EVENT


function deleteEvent(id){



    if(confirm(
        "Delete this event?"
    )){


        fetch(
            `${EVENT_API}/${id}`,
            {

                method:"DELETE"

            }

        )


            .then(()=>{


                alert(
                    "Event Deleted Successfully"
                );


                loadEvents();


            });


    }


}








// EDIT EVENT

function editEvent(id){


    fetch(
        `${EVENT_API}/${id}`
    )



        .then(response=>response.json())



        .then(event=>{


            document.getElementById(
                "eventId"
            ).value =
                event.eventId;



            document.getElementById(
                "eventName"
            ).value =
                event.eventName;



            document.getElementById(
                "description"
            ).value =
                event.description;



            document.getElementById(
                "eventDate"
            ).value =
                event.eventDate;



            document.getElementById(
                "location"
            ).value =
                event.location;



            document.getElementById(
                "status"
            ).value =
                event.status;



        });



}



// CLEAR FORM


function clearEventForm(){


    document.getElementById(
        "eventForm"
    ).reset();


}