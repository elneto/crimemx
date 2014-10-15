
function putMonitos(state, num){
	var i=0;
	//$( "#monitos" ).empty();
	//$( "#monitoState" ).empty();	
	while(i++ < num)
	{
		$("#monoContainer").append('<img src="svg/human.svg" class="human">');
	}
	$("#monoContainer").append('<h3 class="monitoState">'+state + ' '+GYEAR+'</h3>');
	//$('#monitos').append('<div class="monitoInline">'+state+' '+GYEAR +'</div>')
		
}
