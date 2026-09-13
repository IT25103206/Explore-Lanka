// ====================================
// Explore Lanka Tour Package JS
// ====================================


const PACKAGE_API = "/api/packages";





document.addEventListener(
"DOMContentLoaded",
function(){

    loadPackages();

});






// ================================
// GET ALL PACKAGES
// ================================


function loadPackages(){


fetch(PACKAGE_API)


.then(response => response.json())


.then(data=>{


    displayPackages(data);


})


.catch(error=>{


console.log(error);


});


}







// ================================
// DISPLAY PACKAGES
// ================================


function displayPackages(packages){


let container =
document.getElementById(
"packageList"
);



container.innerHTML="";



packages.forEach(pkg=>{


container.innerHTML += `



<div class="package-card">


<h3>

${pkg.packageName}

</h3>



<p class="package-description">

${pkg.description}

</p>




<p class="package-price">

Rs. ${pkg.price}

</p>




<p class="package-duration">

Duration:
${pkg.durationDays} Days

</p>




<span class="package-category">

${pkg.category}

</span>



<br><br>



<p>

Status:
${pkg.status}

</p>




<button

class="edit-package-btn"

onclick="editPackage(${pkg.packageId})">

Edit

</button>





<button

class="delete-package-btn"

onclick="deletePackage(${pkg.packageId})">

Delete

</button>



</div>


`;


});


}








// ================================
// CREATE PACKAGE
// ================================


function savePackage(){



let pkg={


packageName:
document.getElementById(
"packageName"
).value,



description:
document.getElementById(
"description"
).value,



price:
document.getElementById(
"price"
).value,



durationDays:
document.getElementById(
"durationDays"
).value,



category:
document.getElementById(
"category"
).value,



status:
document.getElementById(
"status"
).value



};




fetch(PACKAGE_API,
{


method:"POST",


headers:{


"Content-Type":
"application/json"


},


body:
JSON.stringify(pkg)


})



.then(response=>response.json())



.then(()=>{


alert(
"Package Added Successfully"
);


loadPackages();


clearPackageForm();


});


}








// ================================
// DELETE PACKAGE
// ================================


function deletePackage(id){



if(confirm(
"Delete this package?"
)){



fetch(
`${PACKAGE_API}/${id}`,
{

method:"DELETE"

}

)



.then(()=>{


alert(
"Package Deleted Successfully"
);



loadPackages();



});



}


}








// ================================
// EDIT PACKAGE
// ================================


function editPackage(id){



fetch(
`${PACKAGE_API}/${id}`
)



.then(response=>response.json())



.then(pkg=>{


document.getElementById(
"packageId"
).value =
pkg.packageId;




document.getElementById(
"packageName"
).value =
pkg.packageName;





document.getElementById(
"description"
).value =
pkg.description;





document.getElementById(
"price"
).value =
pkg.price;





document.getElementById(
"durationDays"
).value =
pkg.durationDays;





document.getElementById(
"category"
).value =
pkg.category;





document.getElementById(
"status"
).value =
pkg.status;



});



}







// ================================
// CLEAR FORM
// ================================


function clearPackageForm(){


document.getElementById(
"packageForm"
).reset();


}