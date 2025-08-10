/*******************************************************************************
*             All rights reserved MonzirGraphix 2025©
* A script to simulate Trim View in older versions of Illustrator
* by creating or removing a clipping mask on the active artboard.
*
* When run, it checks if a mask layer named "TrimViewMaskLayer" exists.
* - If it doesn't exist, it creates a rectangle the size of the artboard,
*   moves all other items into a group with it, and creates a clipping mask.
* - If it does exist, it releases the mask and deletes the layer,
*   restoring the original view.
*
*******************************************************************************/

#target illustrator

function simulateTrimView() {
    if (app.documents.length === 0) {
        alert("Please open a document first.");
        return;
    }

    var doc = app.activeDocument;
    var artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    var artboardRect = artboard.artboardRect; // [left, top, right, bottom]

    var maskLayerName = "TrimViewMaskLayer";
    var maskLayer;
    var maskExists = false;

    // Check if our special mask layer exists
    try {
        maskLayer = doc.layers.getByName(maskLayerName);
        maskExists = true;
    } catch (e) {
        maskExists = false;
    }

    if (maskExists) {
        // If mask exists, release it and remove the layer
        try {
            maskLayer.locked = false;
            maskLayer.visible = true;

            // There should be one group item on this layer which is the clipped group
            if (maskLayer.groupItems.length > 0) {
                var groupToRelease = maskLayer.groupItems[0];
                
                // Move all items from the clipped group back to their original layer
                // This part assumes content was on a single layer, we will move it to the first layer below the mask layer.
                var targetLayerIndex = -1;
                for(var i = 0; i < doc.layers.length; i++){
                    if(doc.layers[i] === maskLayer){
                        if(i + 1 < doc.layers.length){
                           targetLayerIndex = i + 1;
                        }
                        break;
                    }
                }

                var targetLayer;
                if(targetLayerIndex !== -1){
                    targetLayer = doc.layers[targetLayerIndex];
                } else {
                    // If no layer below, create a new one
                    targetLayer = doc.layers.add();
                    targetLayer.name = "Artwork";
                }

                // Release the clipping mask
                groupToRelease.clipped = false;
                var maskRect = groupToRelease.pathItems[0]; // The first item is the mask rectangle

                // Move all other items out of the group
                while (groupToRelease.pageItems.length > 1) {
                    groupToRelease.pageItems[1].move(targetLayer, ElementPlacement.PLACEATEND);
                }
                
                maskRect.remove(); // remove the rectangle
            }
            
            maskLayer.remove(); // remove the temporary layer
            alert("Trim View simulation turned OFF.");

        } catch (e) {
            alert("An error occurred while removing the mask. You may need to release it manually.\n" + e.message);
            // Attempt to clean up the layer if it still exists
            try {
                doc.layers.getByName(maskLayerName).remove();
            } catch (err) {}
        }

    } else {
        // If mask does not exist, create it
        try {
            // Collect all items from all visible, unlocked layers
            var itemsToMask = [];
            for (var i = 0; i < doc.layers.length; i++) {
                var currentLayer = doc.layers[i];
                if (!currentLayer.locked && currentLayer.visible) {
                    for (var j = 0; j < currentLayer.pageItems.length; j++) {
                        var item = currentLayer.pageItems[j];
                        if (!item.locked && !item.hidden) {
                            itemsToMask.push(item);
                        }
                    }ل
                }
            }

            if (itemsToMask.length === 0) {
                alert("There are no items to mask.");
                return;
            }

            // Create a new layer for the mask to keep things organized
            maskLayer = doc.layers.add();
            maskLayer.name = maskLayerName;
            maskLayer.zOrder(ZOrderMethod.BRINGTOFRONT);

            // Create a rectangle the size of the artboard on the new layer
            var maskRect = maskLayer.pathItems.rectangle(artboardRect[1], artboardRect[0], artboardRect[2] - artboardRect[0], artboardRect[1] - artboardRect[3]);
            maskRect.stroked = false;
            maskRect.filled = false;

            // Create a group on the new layer to hold all items
            var mainGroup = maskLayer.groupItems.add();
            maskRect.move(mainGroup, ElementPlacement.PLACEATBEGINNING);

            // Move all collected items into the new group
            for (var k = 0; k < itemsToMask.length; k++) {
                itemsToMask[k].move(mainGroup, ElementPlacement.PLACEATEND);
            }
            
            // Apply the clipping mask
            mainGroup.clipped = true;
            
            alert("Trim View simulation turned ON.");

        } catch (e) {
            alert("An error occurred while creating the mask.\n" + e.message);
            // Clean up if an error occurs
            if (maskLayer) {
                try {
                    maskLayer.remove();
                } catch(err) {}
            }
        }
    }
}

// Run the main function
simulateTrimView();

