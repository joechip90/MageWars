// Variable storing version number of the ndArry library
var ndArrayLibVers = "0.0.1";

// *******************************************************************************
// *  NDARRAY - Class to hold multidimensional array information.  Information   *
// *  is stored in row order and accessed using the getter and setter functions  *
// *  provided.                                                                  *
// *******************************************************************************
// Overload 'toString' function
ndArray.prototype.toString = function()
{
	return "[object ndArray]";
}
// Constructor function for the multidimensional array
function ndArray(dimStructIn)
{	// Private members
	var dimNum = dimStructIn.length;			// Number of dimensions of the array
	var dimStruct = new Array(dimNum);			// Array to hold the dimension structure
	var offset = new Array(dimNum);				// Array to hold the offsets of each of the dimensions
	// Array initialisation
	var totOffset = 1;
	for(var dimIter = 0; dimIter < dimNum; ++dimIter)
	{
		dimStruct[dimIter] = Math.floor(dimStructIn[dimIter]);
		if(dimStruct[dimIter] <= 0)
		{
			throw "invalid dimension extent given for multidimensional array";
		}
		offset[dimIter] = totOffset;
		totOffset *= dimStruct[dimIter];
	}
	var contents = new Array(totOffset);
	// Private function to retrieve the offset required to address element of a given
	// dimensional coordinates
	function getOffset(dimVals)
	{
		var findOffset = 0;
		for(var dimIter = 0; dimIter < dimNum; ++dimIter)
		{
			if(dimVals[dimIter] < 0 || dimVals[dimIter] >= dimStruct[dimIter])
			{
				throw "invalid dimension extents given for element access";
			}
			findOffset += dimVals[dimIter] * offset[dimIter];
		}
		return findOffset;
	}
	// Function to retrieve the number of dimensions in the array
	this.getNumberDimensions = function()
	{
		return dimNum;
	}
	// Function to retrieve the length of a given dimension from the array
	this.getDimensionLength = function(inIndex)
	{
		if(inIndex < 0 || inIndex >= dimNum)
		{
			throw "invalid dimension index";
		}
		return dimStruct[inIndex];
	}
	// Getter function to retrieve particular elements from the array
	this.getElement = function (dimVals)
	{
		return contents[getOffset(dimVals)];
	}
	// Setter function to set particular elements in the array
	this.setElement = function (dimVals, newVal)
	{
		contents[getOffset(dimVals)] = newVal;
	}
	// Set all elements of the array to a specific value
	this.setAll = function (newVal)
	{
		for(var conIter = 0; conIter < totOffset; ++conIter)
		{
			contents[conIter] = newVal;
		}
	}
}

// Function to calculate coefficients of a multi-polynomial when raised to a particular
// power.  Coefficients are expressed as a multidimensional array with each dimension representing
// a variable and each row along that dimension as an increasing power of that variable (starting
// at zero).
function multipolynomial(inArray, inPow)
{
	var fullPow = Math.floor(inPow);
	var outMat;
	if(inArray.getNumberDimensions() === 0)
	{	// Input array is not correctly initialised
		throw "input array is not initialised";
	}
	if(fullPow < 0)
	{	// Input power is less than zero
		throw "input power is less than zero";
	}
	else if(fullPow == 0)
	{	// Input power is zero
		outMat = new ndArray([1]);
		outMat.setElement([0], 1);
	}
	else
	{	// Input power is greater than zero
		var newSize = new Array(inArray.getNumberDimensions());
		var firstIters = new Array(inArray.getNumberDimensions());
		var secondIters = new Array(inArray.getNumberDimensions());
		var thirdIters = new Array(inArray.getNumberDimensions());
		var powIter = 0;
		var dimIterOne = 0;
		var dimIterTwo = 0;
		var dimIterThree = 0;
		// Calculate the size of the output array
		for(dimIterOne = 0; dimIterOne < inArray.getNumberDimensions(); ++dimIterOne)
		{
			newSize[dimIterOne] = inPow * (inArray.getDimensionLength(dimIterOne) - 1) + 1;
			firstIters[dimIterOne] = secondIters[dimIterOne] = thirdIters[dimIterOne] = 0;
		}
		// Initialise the output array to the appropriate size and fill with the input values
		outMat = new ndArray(newSize);
		outMat.setAll(0.0);
		for(dimIterOne = 0; dimIterOne < firstIters.length;)
		{
			outMat.setElement(firstIters, inArray.getElement(firstIters));
			for(++firstIters[dimIterOne = 0]; dimIterOne < firstIters.length && firstIters[dimIterOne] >= inArray.getDimensionLength(dimIterOne); ++firstIters[Math.min(++dimIterOne, firstIters.length - 1)])
			{
				firstIters[dimIterOne] = 0;
			}
		}
		// Iterate over each power
		for(powIter = 1; powIter < fullPow; ++powIter)
		{	// Create a temporary array
			var tempMat = new ndArray(newSize);
			tempMat.setAll(0.0);
			// Initialise the dimensional iterators
			for(dimIterOne = 0; dimIterOne < inArray.getNumberDimensions(); ++dimIterOne)
			{
				firstIters[dimIterOne] = 0;
			}
			// Iterate over the first set of dimensional coordinates
			for(dimIterOne = 0; dimIterOne < firstIters.length;)
			{	// Initialise the dimensional iterators
				for(dimIterTwo = 0; dimIterTwo < inArray.getNumberDimensions(); ++dimIterTwo)
				{
					secondIters[dimIterTwo] = 0;
				}
				// Iterate over the second set of dimensional coordinates
				for(dimIterTwo = 0; dimIterTwo < secondIters.length;)
				{	// Initialise the dimensional iterators
					for(dimIterThree = 0; dimIterThree < inArray.getNumberDimensions(); ++dimIterThree)
					{
						thirdIters[dimIterThree] = firstIters[dimIterThree] + secondIters[dimIterThree];
					}
					// Set the relevant element of the temporary array
					tempMat.setElement(thirdIters, tempMat.getElement(thirdIters) + outMat.getElement(firstIters) * inArray.getElement(secondIters));
					// Increment the dimensional coordinates
					for(++secondIters[dimIterTwo = 0]; dimIterTwo < secondIters.length && secondIters[dimIterTwo] >= inArray.getDimensionLength(dimIterTwo); ++secondIters[Math.min(++dimIterTwo, secondIters.length - 1)])
					{
						secondIters[dimIterTwo] = 0;
					}
				}
				// Increment the dimensional coordinates
				for(++firstIters[dimIterOne = 0]; dimIterOne < firstIters.length && firstIters[dimIterOne] >= (inArray.getDimensionLength(dimIterOne) - 1) * powIter + 1; ++firstIters[Math.min(++dimIterOne, firstIters.length - 1)])
				{
					firstIters[dimIterOne] = 0;
				}
			}
			// Initialise the dimensional iterators
			for(dimIterOne = 0; dimIterOne < inArray.getNumberDimensions(); ++dimIterOne)
			{
				firstIters[dimIterOne] = 0;
			}
			// Iterate over the dimensional coordinates
			for(dimIterOne = 0; dimIterOne < firstIters.length;)
			{	// Set the output matrix
				outMat.setElement(firstIters, tempMat.getElement(firstIters));
				// Increment the dimensional coordinates
				for(++firstIters[dimIterOne = 0]; dimIterOne < firstIters.length && firstIters[dimIterOne] >= (inArray.getDimensionLength(dimIterOne) - 1) * (powIter + 1) + 1; ++firstIters[Math.min(++dimIterOne, firstIters.length - 1)])
				{
					firstIters[dimIterOne] = 0;
				}
			}
		}
	}
	return outMat;
}