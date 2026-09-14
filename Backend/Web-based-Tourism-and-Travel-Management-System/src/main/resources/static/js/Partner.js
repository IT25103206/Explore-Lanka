


const PARTNER_API = "/api/partners";





document.addEventListener(
"DOMContentLoaded",
function(){

    loadPartners();

});







// ================================
// GET ALL PARTNERS
// ================================


function loadPartners(){


fetch(PARTNER_API)


.then(response => response.json())


.then(data=>{


    displayPartners(data);


})


.catch(error=>{


console.log(error);


});


}







// ================================
// DISPLAY PARTNERS
// ================================


function displayPartners(partners){


let container =
document.getElementById(
"partnerList"
);



container.innerHTML="";



partners.forEach(partner=>{


container.innerHTML += `


<div class="partner-card">


<h3>

${partner.partnerName}

</h3>



<p>

<span class="partner-type">

${partner.partnerType}

</span>

</p>



<div class="partner-contact">


<p>

Email:
${partner.email}

</p>


<p>

Phone:
${partner.phone}

</p>


<p>

Address:
${partner.address}

</p>


</div>




<p class="partner-status">

Status:
${partner.status}

</p>



<button

class="edit-partner-btn"

onclick="editPartner(${partner.partnerId})">

Edit

</button>




<button

class="delete-partner-btn"

onclick="deletePartner(${partner.partnerId})">

Delete

</button>



</div>


`;


});


}







// ================================
// CREATE PARTNER
// ================================


function savePartner(){



let partner={



partnerName:
document.getElementById(
"partnerName"
).value,



partnerType:
document.getElementById(
"partnerType"
).value,



email:
document.getElementById(
"email"
).value,



phone:
document.getElementById(
"phone"
).value,



address:
document.getElementById(
"address"
).value,



status:
document.getElementById(
"status"
).value


};






fetch(PARTNER_API,
{


method:"POST",


headers:{


"Content-Type":
"application/json"


},


body:
JSON.stringify(partner)


})



.then(response=>response.json())


.then(()=>{


alert(
"Partner Added Successfully"
);



loadPartners();



clearPartnerForm();



});


}








// ================================
// DELETE PARTNER
// ================================


function deletePartner(id){



if(confirm(
"Delete this partner?"
)){



fetch(
`${PARTNER_API}/${id}`,
{

method:"DELETE"

}

)



.then(()=>{


alert(
"Partner Deleted Successfully"
);


loadPartners();


});



}


}







// ================================
// EDIT PARTNER
// ================================


function editPartner(id){


fetch(
`${PARTNER_API}/${id}`
)



.then(response=>response.json())


.then(partner=>{


document.getElementById(
"partnerId"
).value =
partner.partnerId;




document.getElementById(
"partnerName"
).value =
partner.partnerName;




document.getElementById(
"partnerType"
).value =
partner.partnerType;




document.getElementById(
"email"
).value =
partner.email;




document.getElementById(
"phone"
).value =
partner.phone;




document.getElementById(
"address"
).value =
partner.address;




document.getElementById(
"status"
).value =
partner.status;



});


}







// ================================
// CLEAR FORM
// ================================


function clearPartnerForm(){


document.getElementById(
"partnerForm"
).reset();


}