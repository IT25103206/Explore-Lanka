// ====================================
// Explore Lanka Booking Management JS
// ====================================


const BOOKING_API = "/api/bookings";


document.addEventListener(
"DOMContentLoaded",
function(){

    loadBookings();

});






// ================================
// GET ALL BOOKINGS
// ================================


function loadBookings(){


fetch(BOOKING_API)


.then(response => response.json())


.then(data=>{


    displayBookings(data);


})


.catch(error=>{

console.log(error);

});


}







// ================================
// DISPLAY BOOKINGS
// ================================


function displayBookings(bookings){


let container =
document.getElementById(
"bookingList"
);



container.innerHTML="";



bookings.forEach(booking=>{


container.innerHTML += `


<div class="booking-card">


<h3>
Booking ID :
${booking.bookingId}
</h3>



<p class="booking-package">

Package ID :
${booking.packageId}

</p>



<p>

Booking Date:

${booking.bookingDate}

</p>



<p>

Travel Date:

${booking.travelDate}

</p>



<p>

People:

${booking.numberOfPeople}

</p>



<p>

Amount:

Rs.${booking.totalAmount}

</p>



<span class="booking-status">

${booking.status}

</span>



<br><br>



<button

class="edit-booking-btn"

onclick="editBooking(${booking.bookingId})">

Edit

</button>





<button

class="delete-booking-btn"

onclick="deleteBooking(${booking.bookingId})">

Delete

</button>



</div>


`;


});


}








// ================================
// CREATE BOOKING
// ================================


function saveBooking(){



let booking={


bookingDate:
document.getElementById(
"bookingDate"
).value,



travelDate:
document.getElementById(
"travelDate"
).value,



numberOfPeople:
document.getElementById(
"numberOfPeople"
).value,



totalAmount:
document.getElementById(
"totalAmount"
).value,



status:
document.getElementById(
"status"
).value


};





fetch(BOOKING_API,
{


method:"POST",


headers:{


"Content-Type":
"application/json"

},


body:
JSON.stringify(booking)


})


.then(response=>response.json())


.then(()=>{


alert(
"Booking Created Successfully"
);


loadBookings();


clearBookingForm();


});


}







// ================================
// DELETE BOOKING
// ================================


function deleteBooking(id){


if(confirm(
"Delete this booking?"
)){


fetch(
`${BOOKING_API}/${id}`,
{

method:"DELETE"

}

)



.then(()=>{


alert(
"Booking Deleted"
);


loadBookings();


});


}


}







// ================================
// EDIT BOOKING
// ================================


function editBooking(id){


fetch(
`${BOOKING_API}/${id}`
)



.then(response=>response.json())


.then(booking=>{


document.getElementById(
"bookingId"
).value =
booking.bookingId;




document.getElementById(
"bookingDate"
).value =
booking.bookingDate;




document.getElementById(
"travelDate"
).value =
booking.travelDate;




document.getElementById(
"numberOfPeople"
).value =
booking.numberOfPeople;




document.getElementById(
"totalAmount"
).value =
booking.totalAmount;




document.getElementById(
"status"
).value =
booking.status;



});


}







// ================================
// CLEAR FORM
// ================================


function clearBookingForm(){


document.getElementById(
"bookingForm"
).reset();


}