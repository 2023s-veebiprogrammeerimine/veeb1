//console.log("Töötab!");
let fileSizeLimit = 1.5 * 1024 * 1024;

window.onload = function(){
	//document.getElementById("photoSubmit")
	document.querySelector("#photoSubmit").disabled = true;
	document.querySelector("#checkInfo").innerHTML = "Pilti pole valitud!";
	document.querySelector("#photoInput").addEventListener("change", checkFileSize);
}

function checkFileSize(){
	//console.log(document.querySelector("#photoInput").files[0].size);
	if(document.querySelector("#photoInput").files[0].size <= fileSizeLimit){
		document.querySelector("#photoSubmit").disabled = false;
		document.querySelector("#checkInfo").innerHTML = "";
	} else {
		document.querySelector("#photoSubmit").disabled = true;
		document.querySelector("#checkInfo").innerHTML = "Pildi failimaht on liiga suur!";
	}
}
