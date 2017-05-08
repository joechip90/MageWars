// *******************************************************************
// *  DAMCALC - Series of functions to calculate expected damage in  *
// *  the game Mage Wars.                                            *
// *******************************************************************

// Test to ensure ndArray library is loaded
if(!ndArrayLibVers)
{
	throw "ndArray library not loaded";
}

// Function to check to ensure that all the inputs are correctly entered
function checkInputs(
	basicAttack,		// Basic attack strength
	meleeBonus,			// Bonus to the melee attack
	numAttacks,			// Number of attacks being made
	piercing,			// Piercing of the attacks
	ethereal,			// Is the attack ethereal?
	armour,				// Armour of the defender
	resilient,			// Is the defender resilient?
	incorporeal,		// Is the defender incorporeal?
	veteransBelt		// Does the defender have Veteran's belt?
) {
	// Function to test to ensure that only valid inputs are given
	function checkIntText(inVal)
	{
		return /^[-+]?[0-9]*$/.test(String(inVal));
	}
	var outBools = new Array(9);
	// Test all the input values
	outBools[0] = checkIntText(basicAttack) && basicAttack > 0;
	outBools[1] = checkIntText(meleeBonus);
	outBools[2] = checkIntText(numAttacks) && numAttacks > 0;
	outBools[3] = checkIntText(piercing) && piercing >= 0;
	outBools[4] = checkIntText(ethereal) && (ethereal == 0 || ethereal == 1);
	outBools[5] = checkIntText(armour) && armour >= 0;
	outBools[6] = checkIntText(resilient) && (resilient == 0 || resilient == 1);
	outBools[7] = checkIntText(incorporeal) && (incorporeal == 0 || incorporeal == 1);
	outBools[8] = checkIntText(veteransBelt) && (veteransBelt == 0 || veteransBelt == 1);
	return outBools;
}

// Function to help debug the damage probabilities matrix
//function damMatDebug(
//	inMat				// Input damage matrix
//) {
//	var outString = "<table>\n" + "\t<tr>\n" + "\t\t<td></td>\n";
//	for(var colIter = 0; colIter < inMat.getDimensionLength(1); ++colIter)
//	{
//		outString += "\t\t<td>" + colIter + "</td>\n";
//	}
//	outString += "\t</tr>";
//	for(var rowIter = 0; rowIter < inMat.getDimensionLength(0); ++rowIter)
//	{
//		outString += "\t<tr>\n" + "\t\t<td>" + rowIter + "</td>\n";
//		for(var colIter = 0; colIter < inMat.getDimensionLength(1); ++colIter)
//		{
//			outString += "\t\t<td>" + inMat.getElement([rowIter, colIter]) + "</td>\n";
//		}
//		outString += "\t</tr>\n";
//	}
//	outString += "</table>\n";
//	document.getElementById("damResults_div").innerHTML = outString;
//}

// Function to calculate the damage probabilities
function damCalculate(
	basicAttack,		// Basic attack strength
	meleeBonus,			// Bonus to the melee attack
	numAttacks,			// Number of attacks being made
	piercing,			// Piercing of the attacks
	ethereal,			// Is the attack ethereal?
	armour,				// Armour of the defender
	resilient,			// Is the defender resilient?
	incorporeal,		// Is the defender incorporeal?
	veteranBelt			// Does the defender have Veteran's belt?
) {	// Set whether damage will be adjusted for incorporeal defences
	var incDef = incorporeal && !ethereal;
	// Set up the damage probabilities with one dice roll
	var damDiceMP = new ndArray([3, 3]);
	if(resilient && incDef)
	{
		damDiceMP.setElement([0, 0], 5.0 / 6.0);	// Probability of no damage
	}
	else if(resilient || incDef)
	{
		damDiceMP.setElement([0, 0], 4.0 / 6.0);	// Probability of no damage
	}
	else
	{
		damDiceMP.setElement([0, 0], 2.0 / 6.0);	// Probability of no damage
	}
	if(resilient)
	{
		damDiceMP.setElement([0, 1], 0.0);			// Probability of 1 normal damage
	}
	else
	{
		damDiceMP.setElement([0, 1], 1.0 / 6.0);	// Probability of 1 normal damage
	}
	if(resilient || incDef)
	{
		damDiceMP.setElement([0, 2], 0.0);			// Probability of 2 normal damage
	}
	else
	{
		damDiceMP.setElement([0, 2], 1.0 / 6.0);	// Probability of 2 normal damage
	}
	damDiceMP.setElement([1, 0], 1.0 / 6.0);		// Probability of 1 critical damage
	damDiceMP.setElement([1, 1], 0.0);				// Probability of 1 critical damage and 1 normal damage
	damDiceMP.setElement([1, 2], 0.0);				// Probability of 1 critical damage and 2 normal damage
	if(incDef)
	{
		damDiceMP.setElement([2, 0], 0.0);			// Probability of 2 critical damage
	}
	else
	{
		damDiceMP.setElement([2, 0], 1.0 / 6.0);	// Probability of 2 critical damage
	}
	damDiceMP.setElement([2, 1], 0.0);				// Probability of 2 critical damage and 1 normal damage
	damDiceMP.setElement([2, 2], 0.0);				// Probability of 2 critical damage and 2 normal damage
	// Function to reduce the calculated damage according to armour
	function armourReduc(
		fullDam,		// The full damage matrix
		netArmour,		// The net armour (after piercing)
		critConv		// Amount of critical damage to convert to normal damage
	) {	// Copy the damage matrix to an output matrix
		var outDam = fullDam;
		// Do any critical hit conversion that needs to be performed
		if(critConv > 0)
		{
			for(var damRow = 1; damRow < fullDam.getDimensionLength(0); ++damRow)
			{
				var numCritConv = Math.min(critConv, damRow);
				for(var damCol = 0; damCol < fullDam.getDimensionLength(1) - numCritConv; ++damCol)
				{	// Set the relevant elements of the damage matrix
					outDam.setElement([damRow - numCritConv, damCol + numCritConv],
						outDam.getElement([damRow - numCritConv, damCol + numCritConv]) + outDam.getElement([damRow, damCol]));
					outDam.setElement([damRow, damCol], 0.0);
				}
			}
		}
		// Do any reduction of damage as a result of armour
		if(netArmour > 0)
		{
			for(var damRow = 0; damRow < fullDam.getDimensionLength(0); ++damRow)
			{
				for(var damCol = 1; damCol < fullDam.getDimensionLength(1); ++damCol)
				{
					var armourConv = Math.min(netArmour, damCol);
					// Set the relevant elements of the damage matrix
					outDam.setElement([damRow, damCol - armourConv],
						outDam.getElement([damRow, damCol]) + outDam.getElement([damRow, damCol - armourConv]));
					outDam.setElement([damRow, damCol], 0.0);
				}
			}
		}
		return outDam;
	}
	// Function to convert the damage matrix to damage values
	function damMatrixToVal(
		inDamMat		// Input damage matrix
	) {
		// Initialise a damage vector
		var damVec = new Array(Math.max(inDamMat.getDimensionLength(0), inDamMat.getDimensionLength(1)));
		for(var damVecIter = 0; damVecIter < Math.max(inDamMat.getDimensionLength(0), inDamMat.getDimensionLength(1)); ++damVecIter)
		{
			damVec[damVecIter] = 0.0;
		}
		// Iterate over the rows
		for(var damRow = 0; damRow < Math.max(inDamMat.getDimensionLength(0), inDamMat.getDimensionLength(1)); ++damRow)
		{	// Iterate over the columns
			for(var damCol = 0; damCol < Math.max(inDamMat.getDimensionLength(0), inDamMat.getDimensionLength(1)) - damRow; ++damCol)
			{
				damVec[damRow + damCol] = damVec[damRow + damCol] + inDamMat.getElement([damRow, damCol]);
			}
		}
		return damVec;
	}
	// Function to convolute two sets of damage probabilities
	function damProbsConv(
		firstProbs,		// First set of probabilities
		secondProbs		// Second set of probabilities
	) {
		// Initialise the output damage vector
		var damVec = new Array(firstProbs.length + secondProbs.length - 1);
		for(var damVecIter = 0; damVecIter < firstProbs.length + secondProbs.length - 1; ++damVecIter)
		{
			damVec[damVecIter] = 0.0;
		}
		// Iterate over all combinations of damage
		for(var damIterFirst = 0; damIterFirst < firstProbs.length; ++damIterFirst)
		{
			for(var damIterSecond = 0; damIterSecond < secondProbs.length; ++damIterSecond)
			{
				damVec[damIterFirst + damIterSecond] += firstProbs[damIterFirst] * secondProbs[damIterSecond];
			}
		}
		return damVec;
	}
	// Critical damage to change to normal damage
	var incCrit = 0;
	if(veteranBelt)
	{
		incCrit = 2;
	}
	// Calculate the damage probability of one attack with melee bonuses
	var returnMat = multipolynomial(damDiceMP, Math.max(meleeBonus + basicAttack, 1));
	returnMat = armourReduc(returnMat, Math.max(0, armour - piercing), incCrit);
	var returnDam = damMatrixToVal(returnMat);
	if(numAttacks > 1)
	{	// Calculate the damage coming from any extra attacks
		var extraDam = damMatrixToVal(armourReduc(multipolynomial(damDiceMP, basicAttack), Math.max(0, armour - piercing), incCrit));
		for(var attackIter = 2; attackIter <= numAttacks; ++attackIter)
		{
			returnDam = damProbsConv(returnDam, extraDam);
		}
	}
	return returnDam;
}

// Function to run when the 'Calculate' button is pressed
function runCalculation()
{	// Retrieve the calculation information from the web form
	var basicAttack = document.getElementById("basicAttack_frm").value;		// Set the basic attack
	var meleeBonus = document.getElementById("meleeBonus_frm").value;		// Set the melee bonus
	var numAttacks = document.getElementById("numAttacks_frm").value;		// Set the number of attacks
	var piercing = document.getElementById("piercing_frm").value;			// Set the piercing
	var ethereal = 0;														// Is the attack ethereal?
	if(document.getElementById("ethereal_frm").checked)
	{
		ethereal = 1;
	}
	var armour = document.getElementById("armour_frm").value;				// Set the armour
	var resilient = 0;														// Is the defender resilient?
	if(document.getElementById("resilient_frm").checked)
	{
		resilient = 1;
	}
	var incorporeal = 0;													// Is the defender incorporeal?
	if(document.getElementById("incorporeal_frm").checked)
	{
		incorporeal = 1;
	}
	var veteranBelt = 0;													// Does the defender have a veteran's belt?
	if(document.getElementById("veterans_frm").checked)
	{
		veteranBelt = 1;
	}
	// Check the inputs for their validity
	var testOut = checkInputs(basicAttack, meleeBonus, numAttacks, piercing, ethereal, armour, resilient, incorporeal, veteranBelt);
	var testRes = testOut[0] && testOut[1] && testOut[2] && testOut[3] && testOut[4] && testOut[5] && testOut[6] && testOut[7] && testOut[8];
	// Reset the damage results section
	document.getElementById("damResults_div").innerHTML = "";
	if(testRes)
	{	// Reset any previous error messages
		document.getElementById("basicAttackWarn_span").innerHTML = "";
		document.getElementById("meleeBonusWarn_span").innerHTML = "";
		document.getElementById("numAttacksWarn_span").innerHTML = "";
		document.getElementById("piercingWarn_span").innerHTML = "";
		document.getElementById("armourWarn_span").innerHTML = "";
		// Disable calculate button whilst processing occurs
		document.getElementById("calculate_button").disabled = true;
		// Put calculating text in the relevant section
		document.getElementById("damResults_div").innerHTML = "<span class=\"loadingText_span\">Calculating damage probabilities... please wait</span>";
		// Calculate the damage probability vector
		var damVec = damCalculate(parseInt(basicAttack), parseInt(meleeBonus), parseInt(numAttacks), parseInt(piercing), ethereal, armour, resilient, incorporeal, veteranBelt);
		// Calculate the expected amount of damage and the variance
		var damExp = 0;
		var damVar = 0;
		for(var damIter = 0; damIter < damVec.length; ++damIter)
		{
			damExp += damVec[damIter] * damIter;
		}
		for(var damIter = 0; damIter < damVec.length; ++damIter)
		{
			damVar += damVec[damIter] * (damIter - damExp) * (damIter - damExp);
		}
		// Create a table for the damage probabilities
		var damTableText =
			"<h2>Damage Results</h2>" +
			"<div class=\"keyResult_div\"><span class=\"keyResultTitle_span\">Expected damage</span><span class=\"keyResult_span\">" + parseFloat(damExp).toFixed(3) + "</span><a href=\"http://en.wikipedia.org/wiki/Expected_value\">(what's this?)</a></div>\n" +
			"<div class=\"keyResult_div\"><span class=\"keyResultTitle_span\">Damage variance</span><span class=\"keyResult_span\">" + parseFloat(damVar).toFixed(3) + "</span><a href=\"http://en.wikipedia.org/wiki/Variance\">(what's this?)</a></div>\n" +
			"<table class=\"damTable_table\">\n" +
			"\t<tr class=\"damTableHead_tr\">\n" +
			"\t\t<td>Damage</td>\n" +
			"\t\t<td>Probability of Damage (\%)</td>\n" +
			"\t\t<td>Probability of Damage or Greater (\%)</td>\n" +
			"\t</tr>\n";
		var damCum = 0.0;
		for(var damIter = 0; damIter < damVec.length; ++damIter)
		{
			damTableText += "\t<tr class=\"damTableBody_tr\">\n" +
				"\t\t<td class=\"damTableDam_td\">" + damIter + "</td>\n" +
				"\t\t<td>" + parseFloat(damVec[damIter] * 100.0).toFixed(3) + "</td>\n" +
				"\t\t<td>" + parseFloat((1.0 - damCum) * 100.0).toFixed(3) + "</td>\n" +
				"\t</tr>\n";
			damCum += damVec[damIter];
		}
		damTableText += "</table>\n";
		document.getElementById("damResults_div").innerHTML = damTableText;
		// Enable calculate button after processing
		document.getElementById("calculate_button").disabled = false;
	}
	else
	{	// Print warning messages if one or more of the inputs are not valid
		if(!testOut[0])
		{
			document.getElementById("basicAttackWarn_span").innerHTML = "Value must be an integer greater than zero";
		}
		if(!testOut[1])
		{
			document.getElementById("meleeBonusWarn_span").innerHTML = "Value must be an integer";
		}
		if(!testOut[2])
		{
			document.getElementById("numAttacksWarn_span").innerHTML = "Value must be an integer greater than zero";
		}
		if(!testOut[3])
		{
			document.getElementById("piercingWarn_span").innerHTML = "Value must be an integer greater than or equal to zero";
		}
		if(!testOut[5])
		{
			document.getElementById("armourWarn_span").innerHTML = "Value must be an integer greater than or equal to zero";
		}
	}
}