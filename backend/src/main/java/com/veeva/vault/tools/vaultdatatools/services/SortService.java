/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.tools.vaultdatatools.services;

import com.veeva.vault.vapil.api.model.metadata.VaultObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class SortService {
    /**
     * Recursively sorts the provided objects based on their dependencies. This sorting method ignores cycles.
     *
     * @param objectName                - name of the current object
     * @param objectRelationshipHashMap - HashMap containing the objects and a list of their relationships
     * @param visited                   - list of objects that have already been sorted
     * @param sorted                    - sorted list of objects to delete
     */
    public static void topologicalSort(String objectName, HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap, ArrayList<String> visited, ArrayList<String> sorted) {

        /*
        If this object is already in visited array, we either:
            A) Have a circular dependency - ignore these and let them fail
            B) Have already processed this object - ignore these since we've already sorted it and its children
         */
        if (!visited.contains(objectName)) {

            visited.add(objectName);

            // Recursively process child/inbound reference relationships
            List<VaultObject.Relationship> objectRelationships = objectRelationshipHashMap.get(objectName);
            if (objectRelationships != null) {

                for (VaultObject.Relationship relationship : objectRelationships) {

                    String relationshipType = relationship.getRelationshipType();
                    if (relationshipType.equals("reference_inbound") || relationshipType.equals("child")) {

                        topologicalSort(relationship.getObjectReference().getName(), objectRelationshipHashMap, visited, sorted);

                    }
                }
            }

            sorted.add(objectName);
        }
    }

}
