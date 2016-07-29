var parsedLayers = {};

function onRun(context){
    var currentDoc = context.document;
    var currentLayers = currentDoc.selectedLayers();
    var exportedLayers = [];
    for (var i=0; i < currentLayers.count(); i++) {
        var currentLayer = currentLayers[i];
        print(currentLayer);
        if (!parsedLayers[currentLayer])
        {
            exportedLayers.push(exportLayer(currentLayer));
        }
    }
    print(exportedLayers); // JSON encode this!
}

function exportLayer(currentLayer){
    parsedLayers[currentLayer] = 1;
    var currentOutput = {};
    var layerType = currentLayer.class();
    print("Exporting " + layerType);
    //try{
        if (layerType == "MSSymbolMaster")
        {
            currentOutput = exportMSShapeGroup(currentLayer);
        }
        else if (layerType == "MSShapeGroup")
        {
            currentOutput = exportMSShapeGroup(currentLayer);
        }
        else if (layerType == "MSRectangleShape")
        {
            currentOutput = exportMSRectangleShape(currentLayer);
        }
        else if (layerType == "MSTextLayer")
        {
            currentOutput = exportMSTextLayer(currentLayer);
        }
        else
        {
            currentOutput = {};
        }
    //}
    //catch(e){
    //    print(e);
    //    currentOutput = {};
    //}
    print("Exporting sublayers of " + layerType);
    var currentLayers = currentLayer.containedLayers();
    //try{
        if (currentLayers)
        {
            if (currentLayers.count() > 0) {
                currentOutput["subviews"] = [];
            }
            for (var i=0; i < currentLayers.count(); i++) {
                var currentLayer = currentLayers[i];
                if (!parsedLayers[currentLayer])
                {
                    currentOutput["subviews"].push(exportLayer(currentLayer));
                }
            }
        }
    //}
    //catch(e){
    //    print(e);
    //}
    return currentOutput;
}

// Layer common properties
function exportLayerCommon(currentLayer){
    var currentLayerParsed = {};
    var bounds = currentLayer.bounds();
    var origin = currentLayer.origin();
    currentLayerParsed["bounds"] = bounds;
    currentLayerParsed["origin"] = origin;

    // not all layers have styles; just skip if it's not there or there's no selector
    try{
        var style = currentLayer.style();
        if (style)
        {
            var borders = style.borders();
            var fills = style.fills();
            if (fills)
            {
                for (var i=0; i < fills.count(); i++)
                {
                    var currentFill = fills[i];
                    if (currentFill.fillType() == 0) // fill
                    {
                        currentLayerParsed["backgroundColor"] = currentFill.colorGeneric();
                    }
                    else if (currentFill.fillType() == 1) // gradient
                    {
                        // not supported yet
                    }
                    else if (currentFill.fillType() == 4) // image
                    {
                        currentLayerParsed["image"] = currentFill.image();
                    }
                }
            }
            var shadows = style.shadows();
            var innerShadows = style.innerShadows();
            var contextSettings = style.contextSettings(); 
            currentLayerParsed["borders"] = borders;
            currentLayerParsed["shadows"] = shadows;
            currentLayerParsed["innerShadows"] = innerShadows;
            currentLayerParsed["contextSettings"] = contextSettings;
        }
    }
    catch(e){
        print(e);
    }
    var cssStyle = currentLayer.CSSAttributes();
    var frame = currentLayer.frame();

    currentLayerParsed["cssStyle"] = cssStyle;
    currentLayerParsed["frame"] = frame;

    return currentLayerParsed;
}

// Root shape group, parsed as the parent container
function exportMSShapeGroup(currentLayer){
    var currentLayerParsed = exportLayerCommon(currentLayer);
    return {"UIView" : currentLayerParsed};
}

// Rectangle shape. Parse as a UIView
function exportMSRectangleShape(currentLayer){
    var currentLayerParsed = exportLayerCommon(currentLayer);
    return {"UIView" : currentLayerParsed};
}

// Text layer. Parse as a UILabel
function exportMSTextLayer(currentLayer){
    var currentLayerParsed = exportLayerCommon(currentLayer);
    
    var font = currentLayer.font();
    var text = currentLayer.stringValue();
    
    currentLayerParsed["font"] = font;
    currentLayerParsed["text"] = text;

    return {"UILabel" : currentLayerParsed};
}

// 
