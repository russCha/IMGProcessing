/*!
 * filterImage.js
 * author: Brent M. Dingle EDITED by Russ Chamberlain
 * last modified: 2015
 * Example script for simple image loading.//edited to be used to convert picture to black and white
 *
 * Note currently resizing the browser window does NOT change the canvas size
 * So... probably want a boundary edge displayed on the canvas (via html style)
 *
 * This program uses a filter "class" defined in filter.js  //filter.js was unchanged
 * which means that file and this file must be included in the html
 *
 * Other javaScript files required for this to work:
 *       filter.js
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
    SOURCE_IMG_CANVAS_ID: "sourceCanvas",     // canvas id used in html
    OUTPUT_IMG_CANVAS_ID: "outputCanvas",     // canvas id used in html
    
    // ------------------------------------------------------------------------
    // Variables
    // ------------------------------------------------------------------------
    width:          400,           // canvas width... likely will be reset
    height:         400,           // canvas height... likely will be reset
    xOffset:        5,
    yOffset:        5,
    
    dropArea:       null,
    srcData:        null,
    
    destCanvas:     null,
    destCTX:        null,
    
    // ------------------------------------------------------------------------
    // Functions
    // ------------------------------------------------------------------------
    //                                                          Main
    // ------------------------------------------------------------------------
    Main: function() 
    {
        // Setup the listeners
        this.dropArea = document.getElementById('theDropArea');
        this.dropArea.addEventListener('dragover', this.onDragOver, false);
        this.dropArea.addEventListener('drop', this.onDropFileSelect, false);

        // Get handle on the OUTPUT destCanvas
        theProgram.destCanvas = document.getElementById(theProgram.OUTPUT_IMG_CANVAS_ID);
        theProgram.destCTX = theProgram.destCanvas.getContext('2d');
                
        // initialize the filter        
        theFilter.Init();  //only really using the greyscale function of the filter.js file

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

        // If the "first" file is not an image, do nothing
        var curFile = files[0];
        // Only process image file
        if ( curFile.type.match('image.*') ) 
        {
            var img = new Image;
            img.onload = function() 
            {
                //theProgram.dropArea.style.display = "none"; unrem to allow only 1 drop
                var canvas = document.getElementById(theProgram.SOURCE_IMG_CANVAS_ID);
                var ctx = canvas.getContext('2d');
                canvas.style.display = "block";
                canvas.width = canvas.style.width = img.width;
                canvas.height = canvas.style.height = img.height;
                canvas.style.width = canvas.width + "px" ;
                canvas.style.height = canvas.height + "px";
                ctx.drawImage(img, 0, 0);
                //alert('the original image is drawn');   // for DEBUG
                
                // Set the source data BEFORE applying any filters!
                theProgram.srcData  = ctx.getImageData(0, 0, img.width, img.height);
                
                // TODO: link these to a button press
                theProgram.applyGreyscale();
                //theProgram.applyConvIdentity();
                //theProgram.applyConvSharpen();
                //theProgram.applyConvSobel();
                
                URL.revokeObjectURL(img.src);  // clear up memory... may want to hold on this if doing "real" stuff
            }
            img.src = URL.createObjectURL(curFile);
        }
        // else current file type is NOT image --> so do nothing
    },
    
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    applyGreyscale: function()
    {
        var destData = theFilter.greyscale(theProgram.srcData);
        theProgram.displayOutput(destData, theProgram.srcData);
    },

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    applyConvIdentity: function()
    {
        // below should do 'nothing' apply a filter but change nothing -- debug test
        var destData = theFilter.convolute(theProgram.srcData, 
                                            [  0,  0,  0,
                                               0,  1,  0,
                                               0,  0,  0   ]);
        theProgram.displayOutput(destData, theProgram.srcData);
    },

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    applyConvSharpen: function()
    {
        // Below sort of 'sharpens' the image
        var destData = theFilter.convolute(theProgram.srcData, 
                                            [  0, -1,  0,
                                              -1,  5, -1,
                                               0, -1,  0   ]);
        theProgram.displayOutput(destData, theProgram.srcData);
    },
    
    // ------------------------------------------------------------------------
    // Sobel based edge detection
    // Notice this works in steps: greyscale, horizontal, vertical, combine
    // This version creates a greyscale image.
    // A more artistic option (commented out)
    // applies the vertical and horizontal in red and green 
    // respectively mixing in some blue. Just greyscale is more typical.
    // ------------------------------------------------------------------------
    applyConvSobel: function()
    {
        var grey = theFilter.greyscale(theProgram.srcData);

        var vertical = theFilter.convoluteFloat32(grey, 
                                                    [-1, -2, -1,
                                                      0,  0,  0,
                                                      1,  2,  1]  );
        var horizontal = theFilter.convoluteFloat32(grey, 
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
        
        theProgram.displayOutput(finalImg, theProgram.srcData);
    },
    
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    displayOutput: function(destData)
    {
        // make things visible and correct size
        theProgram.destCanvas.style.display = "block";
        theProgram.destCanvas.width = theProgram.destCanvas.style.width = destData.width;
        theProgram.destCanvas.height = theProgram.destCanvas.style.height = destData.height;
        theProgram.destCanvas.style.width = theProgram.destCanvas.width + "px" ;
        theProgram.destCanvas.style.height = theProgram.destCanvas.height + "px";
        
        theProgram.destCTX.putImageData(destData, 0, 0);
    },
    
    
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
