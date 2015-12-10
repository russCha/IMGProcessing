/*!
 * filter.js
 * author: Brent M. Dingle
 * last modified: 2015
 * Example 'filter' class for image processing
 * This was derived from: 
 * http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
 *
 * This is a support class, it has no 'main' function
 * It is written as a singleton variable
 *    thus can be used sort of as a "black box"
 #    this may or may not be useful for what you want/need
 * See also comments at bottom of file for explanation of 
 * javascript class functions/methods
 *
 * Other javaScript files required for this to work:
 *       none
*/

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// theFilter (singleton) Object                            theFilter Object
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
var theFilter = 
{
    // ------------------------------------------------------------------------
    // Pseudo-constants
    // ------------------------------------------------------------------------
    
    // ------------------------------------------------------------------------
    // Variables
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Functions
    // ------------------------------------------------------------------------
    //                                                          Init
    // ------------------------------------------------------------------------
    Init: function() 
    {
        // nothing needs to be done here... yet =)
    },    
 

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // ------------------------------------ BEGIN simple filter examples
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // greyscale
    // Assumed: 
    //      pixels are data struct returned by: ctx.getImageData(0, 0, w, h);
    // ------------------------------------------------------------------------
    greyscale: function(pixels) 
    {
        var d = pixels.data;
        for (var i=0; i < d.length; i+=4) 
        {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            // CIE luminance for the RGB --- fixes appearance for humans
            var v = 0.2126*r + 0.7152*g + 0.0722*b;
            d[i] = d[i+1] = d[i+2] = v
        }
        return pixels;
    },

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    brightenUp: function(pixels, adjustment) 
    {
        // TODO should bound the values between 0 and 255
        var d = pixels.data;
        for (var i=0; i<d.length; i+=4) 
        {
            d[i]   += adjustment;
            d[i+1] += adjustment;
            d[i+2] += adjustment;
        }
        return pixels;
    },

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    threshold: function(pixels, maxVal) 
    {
        var d = pixels.data;
        for (var i=0; i<d.length; i+=4) 
        {
            var r = d[i];
            var g = d[i+1];
            var b = d[i+2];
            var v = (0.2126*r + 0.7152*g + 0.0722*b >= maxVal) ? 255 : 0;
            d[i] = d[i+1] = d[i+2] = v
        }
        return pixels;
    },
    
    // ------------------------------------------------------------------------
    // ------------------------------------ END simple filter examples
    // ------------------------------------ BEGIN convolution routines
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // convolute
    // This clamps the output/returned image data values to be from 0 to 255
    // ------------------------------------------------------------------------
    convolute: function(pixels, kernel, opaque) 
    {
        var side = Math.round(Math.sqrt(kernel.length));
        var halfSide = Math.floor(side/2);
        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;

        // pad output by the convolution matrix
        var w = sw;
        var h = sh;
        var tmpCanvas  = document.createElement('canvas');
        var tmpContext = tmpCanvas.getContext('2d');
        var output = tmpContext.createImageData(w, h);
        var dst = output.data;

        // go through the destination image pixels
        var alphaFac = opaque ? 1 : 0;
        for (var y=0; y<h; y++) 
        {
            for (var x=0; x<w; x++) 
            {
                var sy = y;
                var sx = x;
                var dstOff = (y*w+x)*4;

                // calculate the weighted sum of the source image pixels that
                // fall under the convolution matrix
                var r=0, g=0, b=0, a=0;
                for (var cy=0; cy<side; cy++) 
                {
                    for (var cx=0; cx<side; cx++) 
                    {
                        var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
                        var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
                        var srcOff = (scy*sw+scx)*4;
                        var wt = kernel[cy*side+cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff+1] * wt;
                        b += src[srcOff+2] * wt;
                        a += src[srcOff+3] * wt;                        }
                }
                // The below bounding may not really be required as image displays correctly without it
                // i.e. Technically image.data data structure is supposed to clamp the values from 0 to 255 
                // BUT... this way we *know* it happens, and makes things read nicer(though maybe slightly slower)
                // See function: convoluteFloat32 for cases where this clamping is NOT desired
                if (r < 0) r =0;
                if (r > 255) r =255;
                if (g < 0) g =0;
                if (g > 255) g =255;
                if (b < 0) b =0;
                if (b > 255) b =255;
                
                // Assign results to the output's data
                dst[dstOff]   = r;
                dst[dstOff+1] = g;
                dst[dstOff+2] = b;
                dst[dstOff+3] = a + alphaFac*(255-a);  // 0 = fully transparent, 255 = no transparency
            }
        }
        return output;
    },
    
    // ------------------------------------------------------------------------
    // convoluteFloat32
    // This does NOT clamp the values
    // Notice this does require the following definition to be applied:
    //    if (!window.Float32Array)
    //              Float32Array = Array;
    // This is done within the context of this function
    // It *may* be useful in a more global context
    //
    // This function was needed for doing things like a Sobel filter
    // where intermediate steps do not work if values are clamped
    // ------------------------------------------------------------------------
    convoluteFloat32: function(pixels, weights, opaque) 
    {
        if (!window.Float32Array)
        {
            Float32Array = Array;
        }
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side/2);

        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;

        var w = sw;
        var h = sh;
        var output = {  width: w, 
                        height: h, 
                        data: new Float32Array(w*h*4)
                     };
                     
        var dst = output.data;

        var alphaFac = opaque ? 1 : 0;

        for (var y=0; y<h; y++) 
        {
            for (var x=0; x<w; x++) 
            {
                var sy = y;
                var sx = x;
                var dstOff = (y*w+x)*4;
                var r=0, g=0, b=0, a=0;
                for (var cy=0; cy<side; cy++) 
                {
                    for (var cx=0; cx<side; cx++) 
                    {
                        var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
                        var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
                        var srcOff = (scy*sw+scx)*4;
                        var wt = weights[cy*side+cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff+1] * wt;
                        b += src[srcOff+2] * wt;
                        a += src[srcOff+3] * wt;
                    }
                }
                dst[dstOff] = r;
                dst[dstOff+1] = g;
                dst[dstOff+2] = b;
                dst[dstOff+3] = a + alphaFac*(255-a);
            }
        }
        return output;
    },    
};

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// end of file
