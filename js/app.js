var db;
var db_id = 0;

$(document).ready(function() {

	if(!("indexedDB" in window)) {
		alert("IndexedDB support required for this demo!");
		return;
	}          
	

	var $slojDetail = $("#slojDetail");
	var $slojForm = $("#slojForm");
	
	var openRequest = window.indexedDB.open("slojevi_3",2);
	
	openRequest.onerror = function(e) {
        console.log("Error opening db");
        console.dir(e);
  };

  openRequest.onupgradeneeded = function(e) {

      var thisDb = e.target.result;
		  var objectStore;
		
        //Create "sloj" Object Store
      if(!thisDb.objectStoreNames.contains("slojevi")) {
        console.log("Moram da napravim novu bazu!");
        objectStore = thisDb.createObjectStore("slojevi", { keyPath: "id", autoIncrement:true });  
      }

      //Create "zgrada" Object Store
      if(!thisDb.objectStoreNames.contains("zgrada")) {
        console.log("Moram da napravim novu bazu!");
        var zgrada = thisDb.createObjectStore("zgrada", { keyPath: "id", autoIncrement:true });  
        zgrada.put({parameter: "TemperatureInternal", value: 20});
        zgrada.put({parameter: "TemperatureExternal", value: -12.1});
      }

  };

  openRequest.onsuccess = function(e) {
        db = e.target.result;

        db.onerror = function(event) {
          // Generic error handler for all errors targeted at this database's
          // requests!
          alert("Database error: " + event.target.errorCode);
          console.dir(event.target);
        };
		
      prikaziSlojeve();
      $slojDetail.show();
      $("#izracunata-U-vrednost").html(vratiU()); //automatski preracunaj U-val
      
  };

		
    //dodaj sloj funkcija
    $("#dodajSlojButton").on("click", function(e) {
			$("#select").val("");
			$("#range").val("");
			$("#debljina").val("");
			$("#rho").val("");
			$("#c").val("");
			$("#lambda").val("");
			$("#mi").val("");
			$slojDetail.hide();
			$slojForm.show();	
	 	  $("#dodajSlojButton").hide();
		  //$("#izracunajU").hide();
      $("#izracunata-U-vrednost").hide();
      animirajFokus($("#slojForm"));
		});

    //sacuvaj sloj funkcija
    $("#sacuvajSlojButton").on("click",function() {
              
            var  debljina=$("#debljina").val();
            var  tip=$("#naziv").val();
            var  rho=$("#rho").val();
            var  c=$("#c").val();
            var  lambda=$("#lambda").val();
            var  mi=$("#mi").val();            
       
     	  	var key = $("#key").val();

			var transaction = db.transaction(["slojevi"], "readwrite");
      
        	if(key === "") {
          	 	transaction.objectStore("slojevi")
                           .add({debljina:debljina,tip:tip,rho:rho,c:c,lambda:lambda,mi:mi, date:new Date()});
        	} else {
            	transaction.objectStore("slojevi")
                           .put({debljina:debljina,tip:tip,rho:rho,c:c,lambda:lambda,mi:mi, date:new Date(),id:Number(key)});
        	}
   
			t.oncomplete = function(event) {
            $("#key").val("");
            $("#naziv").val("");
      			$("#range").val("");
      			$("#debljina").val("");
      			$("#rho").val("");
      			$("#c").val("");
      			$("#lambda").val("");
      			$("#mi").val("");
      			$slojForm.hide();	
      			prikaziSlojeve();
            $slojDetail.show();
      			$("#dodajSlojButton").show();	
            $("#izracunata-U-vrednost").show();
            $("#izracunata-U-vrednost").html(vratiU()); //automatski preracunaj U-val
				};		
        return false;
    });


   //Otkazi sloj funkcija
    $("#odustaniSlojButton").on("click",function() {
        $("#key").val("");
        $("#naziv").val("");
        $("#range").val("");
        $("#debljina").val("");
        $("#rho").val("");
        $("#c").val("");
        $("#lambda").val("");
        $("#mi").val("");
				$slojForm.hide();	
				prikaziSlojeve();
        $slojDetail.show();
				$("#dodajSlojButton").show();	
        $("#izracunata-U-vrednost").show();
        $("#izracunata-U-vrednost").html(vratiU()); //automatski preracunaj U-val
    });


    //prikazi sve slojeve funkcija
    function prikaziSlojeve() {
        var transaction = db.transaction(["slojevi"], "readonly");  
        var content="<table class='table table-bordered table-striped'><thead><tr><th>Naziv sloja</th><th>d[m]</th><th title='Gustina'>ρ[kg/m<sup>3</sup>]</th><th title='Specifična toplota'>c[J/(kg*K)]</th><th title='Toplotna provodljivost'>λ[W/(m*K)]</th><th title='Relativni koeficijent difuzije vodene pare'>μ[-]</th><th title='Toplotna rezistivnost'>R[K*m<sup>2</sup>/W]</th><th>&nbsp;</td></thead><tbody>";
		    var sumaD = 0;
        var r_val_sloj;

      	transaction.oncomplete = function(event) {
                $("#slojList").html(content);
        };

        var handleResult = function(event) {  
          var cursor = event.target.result;  
          
  			if (cursor) {  
            content += "<tr data-key=\""+cursor.key+"\"><td class=\"clickSloj\">"+cursor.value.tip+"</td>";
          	content += "<td>"+cursor.value.debljina+"</td>";
        		content += "<td>"+cursor.value.rho+"</td>";
        		content += "<td>"+cursor.value.c+"</td>";
        		content += "<td>"+cursor.value.lambda+"</td>";
        		content += "<td>"+cursor.value.mi+"</td>"; 
            r_val_sloj = (cursor.value.debljina / cursor.value.lambda).toFixed(3) // (d/lambda)_za_sloj     
		        content += "<td>"+r_val_sloj+"</td>";			
          	content += "<td><a class=\"btn btn-primary promeni\">Promeni</a> <a class=\"btn btn-danger obrisi\">Obriši</a></td>";
          	content +="</tr>";

            sumaD=+sumaD+ +cursor.value.debljina; // suma debljina slojeva
            
            cursor.continue();   
          }  
          else {  
         	  content += "<tr>  <td> <b>&#931</b> </td> <td><b>"+sumaD.toFixed(3)+"</b></td> </tr>"; //poslednji red sa sumom debljina itd.
            content += "</tbody></table>";
          }  
        }; 

        var objectStore = transaction.objectStore("slojevi");

		    objectStore.openCursor().onsuccess = handleResult;    

    } //prikaziSlojeve End
	
	/*
	 * funkcija koja vraća U vrednost slojeva zida
	 * Znaci za svaki sloj nadjes d/lambda, i sumiras sve,  tome dodas otpor prelazu toplote i svemu tome nadjes reciprocnu vrednost.
	 */
	
	function vratiU(){
		var sumaU=0; 
		var transaction = db.transaction(["slojevi"], "readonly"); 
		var objectStore = transaction.objectStore("slojevi");
		var request = objectStore.openCursor();
		
		transaction.oncomplete = function(event) {
		  document.getElementById("izracunata-U-vrednost").innerHTML= "Koeficijent toplotne transmisivnosti za omotač: <b>U = " + db.sumaU + " W/(m<sup>2</sup>*K)</b>";
    };
		
		request.onsuccess = function(evt) {
	 
    	var cursor = evt.target.result;  
	 		if (cursor) {  //dok god postoji sloj
       	sumaU = sumaU + parseFloat(parseFloat(cursor.value.debljina)/parseFloat(cursor.value.lambda));
				cursor.continue();//idi na sledeci sloj
   		} else { //kad nema vise slojeva
        sumaU = (sumaU+0.17); //Otpor prelazu toplote za spoljasnji neventilisani zid 0.13+0.04
				sumaU=(1/sumaU).toFixed(3);//zaokruzuje na 3 decimale reciprocnu vrednost
				db.sumaU=sumaU;
    	}  

		}
	return db.sumaU;
	};


    //obrisi(delete) funkcionalnost na klik dugmeta
  $("#slojList").on("click", "a.obrisi", function(e) {
        var thisId = $(this).parent().parent().data("key");

		var t = db.transaction(["slojevi"], "readwrite");
		var request = t.objectStore("slojevi").delete(thisId);
		t.oncomplete = function(event) {
			prikaziSlojeve();
      $("#izracunata-U-vrednost").html(vratiU()); //automatski preracunaj U-val
			$slojDetail.show();
			$slojForm.hide();
		};
    return false;
  });

    //promena(edit) funkcionalnost na klik dugmeta
  $("#slojList").on("click", "a.promeni", function(e) {
    var thisId = $(this).parent().parent().data("key");

    var request = db.transaction(["slojevi"], "readwrite")  
                    .objectStore("slojevi")  
                    .get(thisId);  
    request.onsuccess = function(event) {  
      var note = request.result;
      $("#key").val(note.id);
      $("#naziv").val(note.tip);
			$("#range").val(note.debljina);
			$("#debljina").val(note.debljina);
			$("#rho").val(note.rho);
			$("#c").val(note.c);
			$("#lambda").val(note.lambda);
			$("#mi").val(note.mi);
			$slojDetail.hide();
			$slojForm.show();
			$("#dodajSlojButton").hide();
      $("#izracunata-U-vrednost").hide();
      animirajFokus($("#sacuvajSlojButton"));
    };  

        return false;
  });

}); //end: $(document).ready


//prosta zamena
function zameniVrednost(uzmi,stavi) {
    var x = document.getElementById(stavi);
    var y = document.getElementById(uzmi);
    x.value = y.value;
}
//funkcija koja postavlja tip, punim njome expandable menu
function postaviSloj(ρ,ce,λ,μ,nazivSloja) {
  var rho = document.getElementById('rho');
  var c = document.getElementById('c');
  var lambda = document.getElementById('lambda');
  var mi = document.getElementById('mi');
  var naziv = document.getElementById('naziv');
	rho.value=ρ;
  c.value=ce;
  lambda.value=λ;
  mi.value=μ;
  naziv.value=nazivSloja;
    
  animirajFokus($("#sacuvajSlojButton"));
}

function IsEmpty(){
  if(document.forms['slojInputForm'].debljina.value == "")
  {
    alert("Niste uneli debljinu sloja! U tabeli kliknite dugme 'Promeni' i unestite debljinu sloja u metrima.");
    return false;
  }
    return true;
}

//funkcija za upravljanje drvetom
$(function () {
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Skupi');
    $('.tree li.parent_li > span').on('click', function (e) {
        var children = $(this).parent('li.parent_li').find(' > ul > li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Raširi').find(' > i').addClass('glyphicon-plus-sign').removeClass('glyphicon-minus-sign');
        } else {
            children.show('fast');
            $(this).attr('title', 'Skupi').find(' > i').addClass('glyphicon-minus-sign').removeClass('glyphicon-plus-sign');
        }
        e.stopPropagation();
    });
});

//animirani fokus
function animirajFokus(el) { 
    $('html, body').animate({ 
        scrollTop: $(el).offset().top - 1 }, 
    'fast', function() {
        $("#txtName").focus();
    });           
} 

$('#tipOmotaca-1').click(function(e){
    $('#tipOmotacaSelected').html("Rsi=0.04, Rse=0.13");
    e.preventDefault();

    // Dodaj element u DB, ObjectStore 'zgrada'
    add_data_element_to_zgrada("resistanceSurfaceIntern", 0.13);
    add_data_element_to_zgrada("resistanceSurfaceExtern", 0.04);

});


$("#tipOmotaca-2").click(function(e){
      $('#tipOmotacaSelected').html("Rsi=0.1, Rse=0.1");
      e.preventDefault();
});

$("#tipOmotaca-3").click(function(e){
      $('#tipOmotacaSelected').html("Rsi=0.13, Rse=0.13");
      e.preventDefault();
});

$("#tipOmotaca-4").click(function(e){
      $('#tipOmotacaSelected').html("Rsi=0.10, Rse=0.10");
      e.preventDefault();
});


function add_data_element_to_zgrada(dataName, dataValue) {
        var request = db.transaction(["zgrada"], "readwrite")
                .objectStore("zgrada")
                .add({ parameter: dataName, value: dataValue });
                                 
        request.onsuccess = function(event) {
                console.log("Added data to your database.");
        };
         
        request.onerror = function(event) {
                console.log("Unable to add data to your database! ");       
        };        
}


/*

Pravljenje niza objekata i i priprema podataka za D3 plotovanje

var journal = [];

function addEntry(events, didITurnIntoASquirrel) {
  journal.push({
    events: events,
    squirrel: didITurnIntoASquirrel
  });
}

addEntry(["work", "touched tree", "pizza", "running",
          "television"], false);
addEntry(["work", "ice cream", "cauliflower", "lasagna",
          "touched tree", "brushed teeth"], false);
addEntry(["weekend", "cycling", "break", "peanuts",
          "beer"], true);


ili u mojoj interpretaciji:
var data = [];

function addEntry(xDatum, yDatum) {
  data.push({
    x: xDatum,
    y: yDatum
  });
}

addEntry(1.3, 4.5);
addEntry(1.4, 4.6);

*/