/*!
 * homework4DeMo.js
 * author: Russell M. Chamberlain
 * last modified: November 2015
 * File for taking in and combining three RAW images into a single image utilizing interpolation
 *
*/
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// theProgram (singleton) Object                            theProgram Object
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
var theProgram = 
{
    // ------------------------------------------------------------------------
    // Pseudo-constants
    // ------------------------------------------------------------------------
    SOURCE_IMG_CANVAS_ID:  "sourceCanvas",     	// canvas id used in html for provided image
    OUTPUT_IMG_CANVAS_ID:  "outputCanvas",     	// canvas id used in html for transformed image
	//OUTPUT1_IMG_CANVAS_ID:  "greyCanvas",     	// canvas id used in html for greyscale image
	//OUTPUT2_IMG_CANVAS_ID:  "blurCanvas",     	// canvas id used in html for blurred image
	//OUTPUT3_IMG_CANVAS_ID:  "sobelCanvas",     	// canvas id used in html for edge detect image
	//OUTPUT4_IMG_CANVAS_ID:  "covSharpCanvas",   // canvas id used in html for sharpend image
	//OUTPUT5_IMG_CANVAS_ID:  "bwCanvas",     	// canvas id used in html for black and white image
    
    // ------------------------------------------------------------------------
    // Variables
    // ------------------------------------------------------------------------
    width:          400,           // canvas width... likely will be reset
    height:         400,           // canvas height... likely will be reset
    
    dropArea:       null,
    imageOne:       null,
    TransImg:       null,
    
    width:          0,
    height:         0,
    size:           0,
    
    offset:         null,
    delta:          null,
    frames:         0,
    scale:          0,
    factor:         0,
    
    oneLoaded:      0,
    
    destCanvas:     null,			// canvas for transformed image
    destCTX:        null,
	
	//step1Canvas:	null,			// greyscale
	//step1CTX:		null,
	//step2Canvas:	null,			// blur (meadian)
	//step2CTX:		null,
	//step3Canvas:	null,			// sobel edge detection
	//step3CTX:		null,
	//step4Canvas:	null,			// convolution sharpen
	//step4CTX:		null,
	//step5Canvas:	null,			// black and white filter
	//step5CTX:		null,
	
	theMedian:		new MedianFilter(),
	    
    // ------------------------------------------------------------------------
    // Functions
    // ------------------------------------------------------------------------
    // Main
    // ------------------------------------------------------------------------
    Main: function() 
    {
		// Setup the listeners for drop down menu
		// still need to do!!!!
		
        // Setup the listeners for drop box
        this.dropArea = document.getElementById('theDropArea');
        this.dropArea.addEventListener('dragover', this.onDragOver, false);
        this.dropArea.addEventListener('drop', this.onDropFileSelect, false);

        // Get handle on the OUTPUT destCanvas ##transformed image
        theProgram.destCanvas = document.getElementById(theProgram.OUTPUT_IMG_CANVAS_ID);
        theProgram.destCTX = theProgram.destCanvas.getContext('2d');
    },
    

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    onDragOver: function(evt) 
    {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly make this is a copy
    },

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    onDropFileSelect: function (evt) 
    {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files; // files that were dragged 

        // Set flags to know that new files are being loaded
        theProgram.oneLoaded    = 0;
        theProgram.width        = 0;
        theProgram.height       = 0;
        theProgram.size         = 0;
        
        
        // If the "first" file is not an image, do nothing
        var curFile = files[0];
        // Only process image file
        if ( curFile.type.match('image.*') ) 
        {
            var imgOne = new Image;
			
            imgOne.onload = function() 
            {
                //theProgram.dropArea.style.display = "none"; unrem to allow only 1 drop of files
                var canvas = document.getElementById(theProgram.SOURCE_IMG_CANVAS_ID);
                var ctx = canvas.getContext('2d');
                canvas.style.display = "block";
                canvas.width = imgOne.width;  // world coordinate system size
                canvas.height = imgOne.height;
                canvas.style.width = canvas.width + "px" ;  // viewport coordinate system size (like TV screen)
                canvas.style.height = canvas.height + "px";
                
                ctx.drawImage(imgOne, 0, 0);
                //alert('the original image is drawn');   // for DEBUG and annoyance of user
                
                // Set the source data BEFORE applying any filters!
                theProgram.imageOne  = ctx.getImageData(0, 0, imgOne.width, imgOne.height);
				
				// grab source data for use in CompImgCreate function
                theProgram.width = imgOne.width;
                theProgram.height = imgOne.height;
                theProgram.imageSize = 4 * theProgram.width * theProgram.height;
                theProgram.srcImageLoaded = 1; 
				
				//alert('pre VanTrans');   // for DEBUG and annoyance of user
				//call transformation
				theProgram.VanTrans();
                
				//clear memory
				URL.revokeObjectURL(imgOne.src);  // clear up memory... may want to hold on this if doing "real" stuff
            }
            imgOne.src = URL.createObjectURL(curFile);
        } 
        // else first file type is NOT image --> so do nothing
    },

    // ------------------------------------------------------------------------
	// VanTrans()
	// ------------------------------------------------------------------------
	VanTrans: function()
    {
		if (theProgram.srcImageLoaded == 1) // will only work after image is loaded
		{
			//alert('VanTrans is called');   // for DEBUG and annoyance of user
            // grab data from dropped image for sizing
			var width = theProgram.width;    // = imageOne.width;
			var height = theProgram.height;  // = imageOne.height;
			var len = theProgram.imageSize;  // = 4 * theProgram.width * theProgram.height;

			// define output images and set sizes
			theProgram.TransImg = theProgram.destCTX.createImageData(width, height);
			
			// define transformed image = original
			theProgram.TransImg.data = theProgram.imageOne.data
	
			// disply and size TransImg
			theProgram.destCanvas.style.display = "block";
			theProgram.destCanvas.width = width;
			theProgram.destCanvas.height = height;
			theProgram.destCanvas.style.width = theProgram.destCanvas.width + "px" ;
			theProgram.destCanvas.style.height = theProgram.destCanvas.height + "px";
			theProgram.destCTX.fillStyle = '#777777';
			theProgram.destCTX.fillRect(0, 0, width, height);
			
			// apply grey scale
			theProgram.TransImg = theProgram.greyscale(theProgram.imageOne);
				//display grey scale
				theProgram.DisplayResults(theProgram.TransImg); // for debug
			
			
			// apply meadian
			theProgram.TransImg = theProgram.theMedian.convertImage(theProgram.TransImg, theProgram.TransImg.width, theProgram.TransImg.height);
				// display median transformed image
				theProgram.DisplayResults(theProgram.TransImg); // for debug
				
				
			// apply sobel edge detection
			theProgram.TransImg = theProgram.applyConvSobel(theProgram.TransImg);
				// display sobel edge img
				theProgram.DisplayResults(theProgram.TransImg); // for debug

			
			// apply smooth effect
			//alert("pre smooth");
			theProgram.TransImg = theProgram.applyConvSmooth(theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug
			
			// apply second smooth effect like seg.m file
				// this seems to be too much for composite images
				// this needed for nature images
			//theProgram.TransImg = theProgram.applyConvSmooth(theProgram.TransImg);
				//theProgram.DisplayResults(theProgram.TransImg); // for debug
				
			// sharpen
			//alert("preSharp");
			theProgram.TransImg = theProgram.applyConvSharpen(theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug
				
			// black and white
			alert("preBW");
			theProgram.TransImg = theProgram.TurnBW(theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug	
				
			// cleanse noisey white pixels
			alert("pre remove Noise White");
			theProgram.TransImg = theProgram.removeNoiseEdges(theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug
			alert("pre remove Noise White 2");
			theProgram.TransImg = theProgram.removeNoiseEdges(theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug
				
			// connectivity (8-way)
			//call connectivity;
				//theProgram.DisplayResults(theProgram.TransImg); // for debug
				
			// overlay labeled sections
			alert("pre overlay");
			theProgram.TransImg = theProgram.overlayWhite(theProgram.imageOne,theProgram.TransImg);
				theProgram.DisplayResults(theProgram.TransImg); // for debug
		}
		//alert('pre display functions');   // for DEBUG and annoyance of user
        // Display the results
			// this will give final result
        theProgram.DisplayResults(theProgram.TransImg);
	},

	// ------------------------------------------------------------------------
	// use greyscale function from filter.js file
    // ------------------------------------------------------------------------
    // Assumed: 
    //      pixels are data struct returned by: ctx.getImageData(0, 0, w, h);
    // ------------------------------------------------------------------------
    greyscale: function(pixels) 
    {
		//alert('greyscale'); //debug test
        var d = pixels.data;
        for (var i=0; i < d.length; i+=4) 
        {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            // CIE luminance for the RGB --- fixes appearance for humans
            var v = 0.2126*r + 0.7152*g + 0.0722*b;
            d[i] = d[i+1] = d[i+2] = v;
        }
        return pixels;
    },
	
	// ------------------------------------------------------------------------
    // sharpen
	// ------------------------------------------------------------------------
    applyConvSharpen: function(pixels)
    {
		alert("apply conv sharp");
        // Below sort of 'sharpens' the image
        var sharpImg = theFilter.convolute(pixels, 
                                            [  0, -1,  0,
                                              -1,  5, -1,
                                               0, -1,  0   ]);
        return sharpImg;
    },

    // ------------------------------------------------------------------------
	// Black and White
	// ------------------------------------------------------------------------
    // Assumed: 
    //      -nonBW are data struct returned by: ImageData(0, 0, w, h);
	//		-assumes picture is grayscale
    // ------------------------------------------------------------------------
    TurnBW: function(nonBW) 
    {
		//alert('BW'); //debug test
        var BWs = nonBW.data;
        for (var i=0; i < BWs.length; i+=4) 
        {
			// check and change RGBA
			if (nonBW.data[i] > 204)
			{
				// 255*0.8=204
				nonBW.data[i]   = 255;
				nonBW.data[i+1] = 255;
				nonBW.data[i+2] = 255;
				nonBW.data[i+3] = 255;
				// turn white
			} else
			{
				nonBW.data[i]   = 0;
				nonBW.data[i+1] = 0;
				nonBW.data[i+2] = 0;
				nonBW.data[i+3] = 255;
				//turn black
			}
        }
		//alert("end of BW")
        return nonBW;
    },
	
    // ------------------------------------------------------------------------
    // Sobel based edge detection
    // Notice this works in steps: greyscale, horizontal, vertical, combine
    // This version creates a greyscale image.
    // A more artistic option (commented out)
    // applies the vertical and horizontal in red and green 
    // respectively mixing in some blue. Just greyscale is more typical.
    // ------------------------------------------------------------------------
    applyConvSobel: function(originalImageData)
    {
        var vertical = theFilter.convoluteFloat32(originalImageData, 
                                                    [-1, -2, -1,
                                                      0,  0,  0,
                                                      1,  2,  1]  );
        var horizontal = theFilter.convoluteFloat32(originalImageData, 
                                                    [-1,  0,  1,
                                                     -2,  0,  2,
                                                     -1,  0,  1]  );

        var finalImg = theProgram.destCTX.createImageData(vertical.width, vertical.height);

        for (var i=0; i<finalImg.data.length; i+=4) 
        {
            var v = Math.abs(vertical.data[i]);
            var h = Math.abs(horizontal.data[i]);
            finalImg.data[i] = (v+h)/2;            // artistic try:  = v, instead of = (v+h)/2
            finalImg.data[i+1] = (v+h)/2;          //                = h, instead of = (v+h)/2
            finalImg.data[i+2] = (v+h)/2;
            finalImg.data[i+3] = 255;              // alpha is 255 = opaque, 0=transparent
        }        
        
        return finalImg;
    },
	
	// ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    applyConvSmooth: function(ImData)
    {
        // Below is supposed to 'smooth' the img, fill gaps
		// from seg.m file
        var modData = theFilter.convolute(ImData, 
											[	0, 0, 0, 0, 0,
												0, 1, 1, 1, 0,
												0, 1, 1, 1, 0,
												0, 1, 1, 1, 0,
												0, 0, 0, 0, 0	]);
        return modData;
    },
	
	// ------------------------------------------------------------------------
	// remove noisey white pixels
	// ------------------------------------------------------------------------
	removeNoiseEdges: function(IMDATA)
	{
		//alert("remove Noise Edge function called");
		// set width and height
		IMwidth  = IMDATA.width;
		IMheight = IMDATA.height;
		
		// do left right check for cleansing
		for (var i=0; i<IMDATA.length;i+=4)
		{
			// check pixel is white
				// pixel data is assumed to be white or black only having values 0 or 255
			if(IMDATA[i]>0)
			{
				if(i%IMwidth==0) // first column
				{
					if(IMDATA.data[i]==IMDATA.data[i+4] && IMDATA.data[i]==IMDATA.data[i+8])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[i]		=0;		// set red black
						IMDATA.data[i+1]	=0; 	// set green black
						IMDATA.data[i+2]	=0; 	// set blue black
						IMDATA.data[i+3]	=255;	// make visible	
					}
				} else if(i%IMwidth==(IMwidth-1)) // last column
				{
					if(IMDATA.data[i]==IMDATA.data[i-4] && IMDATA.data[i]==IMDATA.data[i-8])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[i]		=0;		// set red black
						IMDATA.data[i+1]	=0; 	// set green black
						IMDATA.data[i+2]	=0; 	// set blue black
						IMDATA.data[i+3]	=255;	// make visible
					}	
				} else // middle columns
				{
					if(IMDATA.data[i]==IMDATA.data[i-4] && IMDATA.data[i]==IMDATA.data[i+4])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[i]		=0;		// set red black
						IMDATA.data[i+1]	=0; 	// set green black
						IMDATA.data[i+2]	=0; 	// set blue black
						IMDATA.data[i+3]	=255;	// make visible
					}
				}
			}
		}
		
		// do up down check for cleansing
		for (var j=0; j<IMDATA.length;j+=4)
		{
			// check pixel is white
				// pixel data is assumed to be white or black only having values 0 or 255
			if(IMDATA.data[j]>0)
			{
				if(j%IMheight==0) // first row
				{
					if(IMDATA.data[j]==IMDATA.data[j+4*IMwidth] && IMDATA.data[j]==IMDATA.data[j+8*IMwidth])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[j]		=0;		// set red black
						IMDATA.data[j+1]	=0; 	// set green black
						IMDATA.data[j+2]	=0; 	// set blue black
						IMDATA.data[j+3]	=255;	// make visible
					}
				} else if(j%IMheight==(IMheight-1)) // last row
				{
					if(IMDATA.data[j]==IMDATA.data[j-4*IMwidth] && IMDATA.data[j]==IMDATA.data[j-8*IMwidth])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[j]		=0;		// set red black
						IMDATA.data[j+1]	=0; 	// set green black
						IMDATA.data[j+2]	=0; 	// set blue black
						IMDATA.data[j+3]	=255;	// make visible
					}	
				} else // middle columns
				{
					if(IMDATA.data[j]==IMDATA.data[j-4*IMwidth] && IMDATA.data[j]==IMDATA.data[j+4*IMwidth])
					{
						// do nothing, pixel stays white
					} else
					{
						IMDATA.data[j]		=0;		// set red black
						IMDATA.data[j+1]	=0; 	// set green black
						IMDATA.data[j+2]	=0; 	// set blue black
						IMDATA.data[j+3]	=255;	// make visible
					}
				}
			}
		}
		return IMDATA;
	},

	// ------------------------------------------------------------------------
	// Connected one 
	// 			-only checks North and West neighbors (top and left)
	// ------------------------------------------------------------------------
	//labelOnePass: function(imageDataWH)
	//{
		// get image dimensions
		//IMwidth  = imageDataWH.width;	// get width for i
		//IMheight = imageDataWH.height;	// get height for j
		
		// get pixels
		//IMpixel = imageDataWH.data;
		
		// set up fillable array (2d array is not reliable so use 1d arrary)
		//var labeling = [];
		
		// set up index for labels
		//var indexLabel = 0;
		
		// set up two for loops to walk through the 1d array and assign labels based off of connectivity test
		//for (var j=0, j<IMheight, j++)
		//{
			//for (var i=0, i<IMwidth, i++)
			//{
				//if(j==0) // if first row
				//{
					//if(i==0) // if first column (so first row and column is first pixel)
					//{
						//labelin[j*width+i] = indexLabel;
					//} else{
						//if(IMpixel[j*width+i]=)
					//}
				//}
				//labeling[j*IMwidth+i] = indexLabel;
			//}
		//}
		//return labeling;
	//},
	
	// ------------------------------------------------------------------------
	// overlay white
	// ------------------------------------------------------------------------
	overlayWhite: function(sourceIM, labeledIM)
	{
		var srcDataForLength = sourceIM.data;
		for(var i=0; i<srcDataForLength.length; i+=4)
		{
			if(labeledIM.data[i]!=0)	//pixel is white
			{
				sourceIM.data[i]	=labeledIM.data[i];
				sourceIM.data[i+1]	=labeledIM.data[i];
				sourceIM.data[i+2]	=labeledIM.data[i];
				sourceIM.data[i+3]	=labeledIM.data[i];
			}
		}
		return sourceIM;
	},
	
    // ------------------------------------------------------------------------
	// Display all Results : just the one transformed image in this case
    // ------------------------------------------------------------------------
    DisplayResults: function()
    {
		alert('DisplayResults is called');   // for DEBUG and annoyance of user
        // Draw the results to the desired canvas contexts
        theProgram.destCTX.putImageData(theProgram.TransImg, 0, 0);		// transformed image
    },
    // ------------------------------------------------------------------------
	
};  // end theProgram variable
    
// ----------------------------------------------------------------------------
//                                                          window.ONLOAD
// ----------------------------------------------------------------------------
window.onload = function()
{
    // Initialize and Start the game
    theProgram.Main();
};

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// end of file
