/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */
package com.veeva.vault.tools.vaultdatatools.delete;

import com.opencsv.CSVWriter;
import com.veeva.vault.tools.vaultdatatools.utils.FileUtil;
import com.veeva.vault.tools.vaultdatatools.services.SortService;
import com.veeva.vault.tools.vaultdatatools.model.DataToolOptions;
import com.veeva.vault.client.Client;
import com.veeva.vault.vapil.api.model.metadata.VaultObject;
import com.veeva.vault.vapil.api.model.response.*;
import com.veeva.vault.vapil.api.request.*;
import org.apache.log4j.Logger;
import org.json.JSONArray;

import java.io.File;
import java.util.*;

public class DeleteVaultData {
    private static Logger LOGGER = Logger.getLogger(DeleteVaultData.class);
    private DataToolOptions.Action action;
    private DataToolOptions.DataType dataType;
    private HashMap<String, List<String>> inputData;
    private List<DataToolOptions.Exclude> excludeSources;
    private CSVWriter csvWriter;
    private Boolean isReadOnly;
    private String isIntegration;

    /**
     * Main driver method for DeleteVaultData. Processes the given DataToolOptions and performs data deletion based on
     * selected action and data type.
     *
     * @param dataToolOptions - DataToolOptions object containing the configuration from input
     */
    public void process(DataToolOptions dataToolOptions) {

        DomainResponse domainResponse = Client.getVaultClient().newRequest(DomainRequest.class)
                .retrieveDomainInformation();

        if (!domainResponse.getDomain().getDomainType().equalsIgnoreCase("SANDBOX")) {
            LOGGER.error("This tool can only be run in a Sandbox domain.");
            return;
        }

        action = dataToolOptions.getAction();
        isIntegration = dataToolOptions.getIsIntegration();
        try {
            dataType = dataToolOptions.getDataType();
            if (dataType == null) {
                LOGGER.error("Datatype is required");
                return;
            }
        } catch (IllegalArgumentException e) {
            LOGGER.error("Unknown datatype provided; Expected values = " + Arrays.asList(DataToolOptions.DataType.values()));
            return;
        }

        if (dataToolOptions.getInput() != null) {
            File inputFile = dataToolOptions.getInputFile();

            if (FileUtil.getInputFile(inputFile)) {
                inputData = FileUtil.getInputFileData(inputFile);

                if (inputData == null) {
                    return;
                }
            } else {
                // Quit if input file was provided, but we couldn't retrieve it
                return;
            }
        }

        if (dataToolOptions.getExcludeList() != null) {
            excludeSources = dataToolOptions.getExcludeList();
        }

        if (dataToolOptions.getReadyOnly() != null) {
            if (dataToolOptions.getReadyOnly().equalsIgnoreCase("true") || dataToolOptions.getReadyOnly().equalsIgnoreCase("false")) {
                isReadOnly = Boolean.valueOf(dataToolOptions.getReadyOnly());
            } else {
                LOGGER.error("Unknown value provided for readOnly; Expected values = [TRUE, FALSE]");
                return;
            }
        }

        // Confirm user wants to proceed with deleting data
        if (isIntegration != null && !isIntegration.equalsIgnoreCase("true") && dataType != null && !confirmDataDeletion()) {
            return;
        }

        String readOnlyFileNameModifier = "";
        if (isReadOnly != null && isReadOnly) {
            readOnlyFileNameModifier = "read-only-";
        }
        String outputFileName = FileUtil.formatFileName(readOnlyFileNameModifier + "delete-data-output.csv", isIntegration);
        csvWriter = FileUtil.getCsvWriter(outputFileName);

        String[] outputHeaders = {"action", "data_type", "name", "id", "status", "error_message"};
        if (isReadOnly != null && isReadOnly) {
            outputHeaders = new String[] {"data_type", "name", "id"};
        }

        List<String[]> headerData = Collections.singletonList(outputHeaders);
        FileUtil.writeDataToCsv(headerData, csvWriter);

        switch (dataType) {
            case OBJECTS:
                deleteObjectsHandler();
                break;

            case DOCUMENTS:
                deleteDocumentsHandler();
                break;

            case ALL:
                deleteObjectsHandler();
                deleteDocumentsHandler();
                break;

            default:
                return;
        }

        FileUtil.closeCsvWriter(csvWriter);

        // If called from an integration, write to the Vault File Staging Server
        if (isIntegration != null && isIntegration.equalsIgnoreCase("true")) {
            FileUtil.writeToFileStaging(outputFileName, "delete");
        }

        LOGGER.info("--------------------------------------------------------------");
        LOGGER.info("Review " + outputFileName + " for full details");
        LOGGER.info("--------------------------------------------------------------");
    }

    /**
     * Displays the data selected for deletion and prompts user to confirm with deletion.
     *
     * @return - True if user agrees to proceed with data deletion, otherwise False
     */
    private boolean confirmDataDeletion() {
        String selectedDataToDelete = "";
        if (inputData != null && !inputData.isEmpty()) {
            selectedDataToDelete = "Selected data to delete (via input file): " + inputData.keySet();
        } else if (dataType.equals(DataToolOptions.DataType.ALL)) {
            selectedDataToDelete = "Selected data to delete: ALL OBJECTS & DOCUMENTS";
        } else {
            selectedDataToDelete = "Selected data to delete: ALL " + dataType;
        }

        String excludedSourcesString = "\nExcluded Object sources: ";
        if (dataType.equals(DataToolOptions.DataType.DOCUMENTS)) {
            excludedSourcesString = "\n";
        } else {
            if (excludeSources != null) {
                excludedSourcesString += excludeSources.toString();
                excludedSourcesString += "\n";
            } else {
                excludedSourcesString += "NONE\n";
            }
        }

        String warningMessage = "";
        if (isReadOnly != null && isReadOnly) {
            warningMessage = "READ-ONLY mode enabled. No data will be deleted.\n" +
                    "The data that would be deleted based on the current inputs will be written to file.";
        } else {
            warningMessage = "You are about to permanently delete this data from your Vault. THIS CANNOT BE UNDONE.";
        }

        /*
         Intentionally using System.out instead of Logger to draw attention to this section and make it obvious
         the user needs to confirm before proceeding with bulk deletion
        */
        System.out.println("-------------------------------------------------------------------------------------");
        System.out.println("Selected action: " + action);
        System.out.println("Selected data type: " + dataType);
        System.out.print(selectedDataToDelete);
        System.out.print(excludedSourcesString);
        System.out.println();
        System.out.println(warningMessage);
        System.out.println();
        System.out.println("-------------------------------------------------------------------------------------");
        System.out.print("Do you wish to proceed? (Y/N) ");

        Scanner input = new Scanner(System.in);
        String answer = input.next().trim().toUpperCase();

        return answer.matches("^(Y|YES)$");
    }

    /**
     * Handles object deletion. Retrieves the objects and their metadata, builds a relationship map, sorts the objects,
     * then deletes the data in sorted order.
     */
    private void deleteObjectsHandler() {

        MetaDataObjectBulkResponse objectResponse = Client.getVaultClient().newRequest(MetaDataRequest.class)
                .retrieveObjectCollection();

        if (objectResponse.isSuccessful()) {

            HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap = new HashMap<>();

            // Get each object and their relevant metadata
            for (VaultObject object : objectResponse.getObjects()) {

                if (inputData != null && !inputData.containsKey(object.getName())) {
                    continue;
                }

                if (excludeSources != null && excludeSources.contains(DataToolOptions.Exclude.valueOf(object.getSource().toUpperCase()))) {
                    continue;
                }

                if (!objectRelationshipHashMap.containsKey(object.getName())) {

                    MetaDataObjectResponse metaDataObjectResponse = Client.getVaultClient().newRequest(MetaDataRequest.class)
                            .retrieveObjectMetadata(object.getName());

                    VaultObject objectMetaData = metaDataObjectResponse.getObject();

                    // Recursively build a hashmap of all objects we need to delete and their relationships
                    buildObjectRelationshipMap(object.getName(), objectRelationshipHashMap, objectMetaData);
                }
            }

            // Arrays for topological sorting
            ArrayList<String> visited = new ArrayList<>();
            ArrayList<String> sorted = new ArrayList<>();

            // Sort the objects
            for (String object : objectRelationshipHashMap.keySet()) {
                SortService.topologicalSort(object, objectRelationshipHashMap, visited, sorted);
            }

            // Build a HashMap of all the data to delete for each object
            HashMap<String, List<QueryResponse.QueryResult>> allDataToDelete = new HashMap<>();
            gatherObjectDataToDelete(allDataToDelete, sorted, objectRelationshipHashMap);

            // Delete the data in sorted order
            for (String object : sorted) {
                if (allDataToDelete.containsKey(object)) {
                    if (isReadOnly != null && isReadOnly) {
                        writeReadOnlyResultsToCSV("OBJECTS", object, allDataToDelete.get(object));
                    } else {
                        deleteData(object, "", allDataToDelete.get(object));
                    }
                }
            }
        }
    }

    /**
     * Recursively builds a map of objects to delete and their relationships.
     *
     * @param objectName                - name of the current object
     * @param objectRelationshipHashMap - HashMap containing the objects and a list of their relationships
     * @param objectMetaData            - metadata of the current object
     */
    private void buildObjectRelationshipMap(String objectName, HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap, VaultObject objectMetaData) {
        // Exclude component object classes
        if (objectMetaData.getObjectClass().equalsIgnoreCase("COMPONENT")) {
            return;
        }

        // Add this object to the HashMap of objects to delete
        if (!objectRelationshipHashMap.containsKey(objectName)) {

            objectRelationshipHashMap.put(objectName, objectMetaData.getRelationships());

            if (objectMetaData.getRelationships() == null) {
                return;
            }

            // Recursively add dependent objects to the HashMap of objects to delete
            for (VaultObject.Relationship relationship : objectMetaData.getRelationships()) {

                String relationshipType = relationship.getRelationshipType();
                if (relationshipType.equals("reference_inbound") || relationshipType.equals("child")) {

                    if (!objectRelationshipHashMap.containsKey(relationship.getObjectReference().getName())) {

                        MetaDataObjectResponse metaDataObjectResponse = Client.getVaultClient().newRequest(MetaDataRequest.class)
                                .retrieveObjectMetadata(relationship.getObjectReference().getName());
                        objectMetaData = metaDataObjectResponse.getObject();

                        buildObjectRelationshipMap(relationship.getObjectReference().getName(), objectRelationshipHashMap, objectMetaData);
                    }
                }
            }
        }
    }

    /**
     * Gathers all the object data to delete. Iterates through sorted objects in reverse order, queries for the data to
     * delete, and stores it in a HashMap.
     *
     * @param allDataToDelete           - HashMap containing the objects and a list of its QueryResults to delete
     * @param sorted                    - sorted list of objects to delete
     * @param objectRelationshipHashMap - HashMap containing the objects and a list of their relationships
     */
    private void gatherObjectDataToDelete(HashMap<String, List<QueryResponse.QueryResult>> allDataToDelete, ArrayList<String> sorted, HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap) {
        // Iterate through the sorted objects to delete in reverse order a query for the data to delete for each
        for (int count = sorted.size() - 1; count >= 0; count--) {
            String objectName = sorted.get(count);

            String query = buildObjectQueryString(objectName, allDataToDelete, objectRelationshipHashMap);

            if (!query.isEmpty()) {
                List<QueryResponse.QueryResult> dataList = queryHandler(query);
                if (!dataList.isEmpty()) {
                    allDataToDelete.put(objectName, dataList);
                }
            }
        }
    }

    /**
     * Builds the query string for an object based on the provided data to delete and the object's relationships
     *
     * @param object                    - name of the current object
     * @param allDataToDelete           - HashMap containing the objects and a list of its QueryResults to delete
     * @param objectRelationshipHashMap - HashMap containing the objects and a list of their relationships
     * @return - the query string for this object
     */
    private String buildObjectQueryString(String object, HashMap<String, List<QueryResponse.QueryResult>> allDataToDelete, HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap) {
        StringBuilder query = new StringBuilder();
        query.append("SELECT id FROM ");
        query.append(object);

        if (inputData != null) {
            // If the input contains this object, add those idParamValues and ids from dependencies to the query
            if (inputData.containsKey(object)) {

                // Only add idParamValues to the query if provided in the input
                if (inputData.get(object).size() > 1) {
                    String idParam = inputData.get(object).get(0);
                    int paramValuesSize = inputData.get(object).size();
                    List<String> idParamValues = inputData.get(object).subList(1, paramValuesSize);

                    addIdParamValuesToQuery(query, idParam, idParamValues);
                    addDependencyDataToQuery(query, object, allDataToDelete, objectRelationshipHashMap, idParamValues, true);
                }

            } else { // If the input has data but this object isn't in it, simply add ids from dependencies to the query
                addDependencyDataToQuery(query, object, allDataToDelete, objectRelationshipHashMap, null, false);
            }
        }
        return query.toString();
    }

    /**
     * Appends IdParam values to the query string
     *
     * @param query         - StringBuilder object representing the query string
     * @param idParam       - the name of the id parameter
     * @param idParamValues - List of id parameter values
     */
    private void addIdParamValuesToQuery(StringBuilder query, String idParam, List<String> idParamValues) {
        if (!idParam.isEmpty()) {
            query.append(" WHERE ");
            appendListToQuery(query, idParam, idParamValues);
        }
    }

    /**
     * Adds data from dependent records to the query string
     *
     * @param query                     - StringBuilder object representing the query string
     * @param object                    - name of the current object
     * @param allDataToDelete           - HashMap containing the objects and a list of its QueryResults to delete
     * @param objectRelationshipHashMap - HashMap containing the objects and a list of their relationships
     * @param idParamValues             - List of id parameter values
     * @param hasInputData              - True if object has input data, false otherwise
     */
    private void addDependencyDataToQuery(StringBuilder query, String object, HashMap<String, List<QueryResponse.QueryResult>> allDataToDelete, HashMap<String, List<VaultObject.Relationship>> objectRelationshipHashMap, List<String> idParamValues, boolean hasInputData) {

        if (objectRelationshipHashMap.get(object) != null) {
            boolean hasRelatedData = false;
            int relationshipCount = 1;
            for (VaultObject.Relationship relationship : objectRelationshipHashMap.get(object)) {

                String relationshipType = relationship.getRelationshipType();
                if (relationshipType.equals("reference_outbound") || relationshipType.equals("parent")) {

                    String relatedObjectName = relationship.getObjectReference().getName();

                    // If allDataToDelete contains the related object, add the associated records of this type
                    if (allDataToDelete.containsKey(relatedObjectName)) {

                        List<String> idList = new ArrayList<>();
                        for (QueryResponse.QueryResult result : allDataToDelete.get(relatedObjectName)) {
                            idList.add(result.get("id").toString());
                        }

                        if (!idList.isEmpty()) {
                            hasRelatedData = true;

                            // Use where clause if this object either isn't in the input or is in the input without idParamValues
                            if (relationshipCount == 1 && (!hasInputData || idParamValues.isEmpty())) {
                                query.append(" WHERE ");
                            } else {
                                query.append(" OR ");
                            }

                            appendListToQuery(query, relationship.getField(), idList);
                            relationshipCount++;
                        }
                    }
                }
            }
            // Skip querying this object since it's not in the input and its related objects don't have data to delete
            if (!hasRelatedData && !hasInputData) {
                query.delete(0, query.length());
            }
        }
    }

    /**
     * Appends a list of values to the query string as a Contains clause
     *
     * @param query    - StringBuilder object representing the query string
     * @param field    - name of the field
     * @param idValues - values to append
     */
    private void appendListToQuery(StringBuilder query, String field, List<String> idValues) {
        query.append(field);
        query.append(" CONTAINS ('");
        query.append(String.join("','", idValues));
        query.append("')");
    }

    /**
     * Executes VQL query and paginates through results
     *
     * @param query - VQL query to execute
     * @return - List of QueryResults
     */
    private List<QueryResponse.QueryResult> queryHandler(String query) {
        // Query to gather the data to delete
        QueryResponse queryResponse = Client.getVaultClient().newRequest(QueryRequest.class).query(query);
        List<QueryResponse.QueryResult> queryResultList = new ArrayList<>();

        if (queryResponse != null && !queryResponse.getResponseStatus().equalsIgnoreCase("FAILURE") && queryResponse.getData().size() > 0) {

            queryResultList.addAll(queryResponse.getData());

            if (queryResponse.isPaginated()) {

                while (queryResponse != null && queryResponse.getResponseDetails().hasNextPage()) {
                    String nextPage = queryResponse.getResponseDetails().getNextPage();
                    queryResponse = Client.getVaultClient().newRequest(QueryRequest.class).queryByPage(nextPage);

                    if (queryResponse != null && !queryResponse.getResponseStatus().equalsIgnoreCase("FAILURE")) {
                        queryResultList.addAll(queryResponse.getData());
                    }
                }
            }
        }

        return queryResultList;
    }

    /**
     * Handles document deletion. Retrieves all document types and deletes the documents for each.
     */
    private void deleteDocumentsHandler() {

        DocumentTypesResponse documentTypesResponse = Client.getVaultClient().newRequest(DocumentRequest.class)
                .retrieveAllDocumentTypes();

        if (documentTypesResponse.isSuccessful()) {

            for (DocumentTypesResponse.DocumentType docType : documentTypesResponse.getTypes()) {

                // Only delete specified doc types, if they were provided
                if (inputData != null && !inputData.containsKey(docType.getName())) {
                    continue;
                }

                StringBuilder query = new StringBuilder();
                query.append("SELECT id FROM documents WHERE type__v = '").append(docType.getLabel()).append("'");

                // If the input contains this document type and has idParams, add those idParamValues to query
                if (inputData != null && inputData.containsKey(docType.getName())) {
                    // Only add idParamValues to the query if provided in the input
                    if (inputData.get(docType.getName()).size() > 1) {
                        String idParam = inputData.get(docType.getName()).get(0);
                        int paramValuesSize = inputData.get(docType.getName()).size();
                        List<String> idParamValues = inputData.get(docType.getName()).subList(1, paramValuesSize);
                        if (!idParam.isEmpty() && idParamValues.size() > 0) {
                            query.append(" AND ");
                            appendListToQuery(query, idParam, idParamValues);
                        }
                    }
                }
                deleteDataHandler("documents", docType.getName(), query.toString());
            }
        }
    }

    /**
     * Deletes data for the specified target and type based on the provided query. Executes the VQL query, paginates
     * through results, and deletes data while paginating.
     *
     * @param target - the target of data deletion (e.g. "documents" or the object name)
     * @param type   - document type if target is documents, null otherwise
     * @param query  - VQL query to execute
     */
    private void deleteDataHandler(String target, String type, String query) {
        // Query the provided target and delete its data
        QueryResponse queryResponse = Client.getVaultClient().newRequest(QueryRequest.class).query(query);

        if (queryResponse != null && !queryResponse.getResponseStatus().equalsIgnoreCase("FAILURE") && queryResponse.getData().size() > 0) {

            if (isReadOnly != null && isReadOnly) {
                writeReadOnlyResultsToCSV(target, type, queryResponse.getData());
            } else {
                // Delete the first page
                deleteData(target, type, queryResponse.getData());
            }

            if (queryResponse.isPaginated()) {

                while (queryResponse != null && queryResponse.getResponseDetails().hasNextPage()) {
                    String nextPage = queryResponse.getResponseDetails().getNextPage();
                    queryResponse = Client.getVaultClient().newRequest(QueryRequest.class).queryByPage(nextPage);

                    if (queryResponse != null && !queryResponse.getResponseStatus().equalsIgnoreCase("FAILURE")) {

                        if (isReadOnly != null && isReadOnly) {
                            writeReadOnlyResultsToCSV(target, type, queryResponse.getData());
                        } else {
                            deleteData(target, type, queryResponse.getData());
                        }
                    }
                }
            }
        }
    }

    /**
     * Deletes the provided data for the specified target and type.
     *
     * @param target       - the target of data deletion (e.g. "documents" or the object name)
     * @param type         - document type if target is documents, null otherwise
     * @param dataToDelete - List of QueryResults to delete
     */
    private void deleteData(String target, String type, List<QueryResponse.QueryResult> dataToDelete) {

        // Partition the VQL response into batches of 500
        int batchSize = 500;
        List<List<QueryResponse.QueryResult>> partitions = new ArrayList<>();

        for (int cnt = 0; cnt < dataToDelete.size(); cnt += batchSize) {
            partitions.add(dataToDelete.subList(cnt, Math.min(cnt + batchSize, dataToDelete.size())));
        }

        int startIndex = 0;
        // Build a JSONArray and execute bulk delete
        for (List<QueryResponse.QueryResult> batch : partitions) {
            List<String[]> outputData = new ArrayList<>();

            JSONArray jsonArray = new JSONArray();
            for (QueryResponse.QueryResult row : batch) {
                jsonArray.put(row.toJSONObject());
            }

            if (target.equalsIgnoreCase("DOCUMENTS")) {
                DocumentBulkResponse resp = Client.getVaultClient().newRequest(DocumentRequest.class)
                        .setContentTypeJson()
                        .setRequestString(jsonArray.toString())
                        .deleteMultipleDocuments();

                if (resp != null) {
                    handleDeleteResponse(resp, type, dataToDelete, startIndex, outputData);
                }
            } else {
                ObjectRecordBulkResponse resp = Client.getVaultClient().newRequest(ObjectRecordRequest.class)
                        .setContentTypeJson()
                        .setRequestString(jsonArray.toString())
                        .deleteObjectRecords(target);

                if (resp != null) {
                    handleDeleteResponse(resp, target, dataToDelete, startIndex, outputData);
                }
            }
            startIndex += 500;

            // Print the results to CSV as we go
            FileUtil.writeDataToCsv(outputData, csvWriter);
        }
    }

    /**
     * Handles the response for document deletion and writes it to the output CSV
     *
     * @param resp         - DocumentBulkResponse object representing the deletion response
     * @param docType      - document type
     * @param dataToDelete - List of QueryResults being deleted
     * @param startIndex   - starting index for data being deleted, used to map response to particular record id
     * @param outputData   - output array to be written to the output CSV
     */
    private void handleDeleteResponse(DocumentBulkResponse resp, String docType, List<QueryResponse.QueryResult> dataToDelete, int startIndex, List<String[]> outputData) {

        handleErrors(resp, false);

        if (resp.getErrors() == null) {
            int index = startIndex;
            for (DocumentResponse documentResponse : resp.getData()) {

                String[] currentOutput = new String[6];
                currentOutput[0] = String.valueOf(action); // Action (From CLI Input)
                currentOutput[1] = "DOCUMENTS";
                currentOutput[2] = docType; // Document type
                currentOutput[3] = String.valueOf(dataToDelete.get(index).toJSONObject().get("id")); // Id
                currentOutput[4] = String.valueOf(documentResponse.getResponseStatus()); // Response status

                currentOutput[5] = handleErrors(documentResponse, true); // Error Message

                outputData.add(currentOutput);
                index++;
            }
        }
    }

    /**
     * Handles the response for object deletion and writes it to the output CSV
     *
     * @param resp         - ObjectRecordBulkResponse object representing the deletion response
     * @param objectName   - object name
     * @param dataToDelete - List of QueryResults being deleted
     * @param startIndex   - starting index for data being deleted, used to map response to particular record id
     * @param outputData   - output array to be written to the output CSV
     */
    private void handleDeleteResponse(ObjectRecordBulkResponse resp, String objectName, List<QueryResponse.QueryResult> dataToDelete, int startIndex, List<String[]> outputData) {

        handleErrors(resp, false);

        if (resp.getErrors() == null) {
            int index = startIndex;
            for (ObjectRecordResponse objectRecordResponse : resp.getData()) {

                String[] currentOutput = new String[6];
                currentOutput[0] = String.valueOf(action); // Action (From CLI Input)
                currentOutput[1] = "OBJECTS";
                currentOutput[2] = objectName; // Record type
                currentOutput[3] = dataToDelete.get(index).toJSONObject().getString("id"); // Id
                currentOutput[4] = String.valueOf(objectRecordResponse.getResponseStatus()); // Response status

                currentOutput[5] = handleErrors(objectRecordResponse, true);

                outputData.add(currentOutput);
                index++;
            }
        }
    }

    /**
     * Handles errors in the VaultResponse
     *
     * @param resp                 - VaultResponse object being processed
     * @param isIndividualResponse - Indicates whether handling a top-level response (false), or an individual record-
     *                             level response (true)
     * @return - The error message to print to the CSV, or "" if no errors
     */
    private String handleErrors(VaultResponse resp, boolean isIndividualResponse) {
        if (resp.hasErrors()) {

            StringBuilder errorString = new StringBuilder();
            if (resp.getErrors() != null) {

                int countErrors = 1;
                for (VaultResponse.APIResponseError error : resp.getErrors()) {

                    if (isIndividualResponse) {
                        // Build individual error messages for output
                        errorString.append(error.getType()).append(" : ").append(error.getMessage());
                        if (resp.getErrors().size() > 1 && countErrors != resp.getErrors().size()) {
                            errorString.append(" | ");
                        }
                    } else {
                        LOGGER.error("VaultResponse Error : " + error.getMessage());
                    }
                    countErrors++;
                }
            }
            return errorString.toString();
        } else {
            return "";
        }
    }

    /**
     * In read-only mode, writes the data to be deleted to CSV
     *
     * @param dataType - OBJECTS or DOCUMENTS
     * @param name - the object name or document type to be deleted
     * @param dataToDelete - List of QueryResults to be deleted
     */
    private void writeReadOnlyResultsToCSV(String dataType, String name, List<QueryResponse.QueryResult> dataToDelete) {
        List<String[]> outputData = new ArrayList<>();

        for (QueryResponse.QueryResult row : dataToDelete) {
            String[] currentOutput = { dataType.toUpperCase(), name, row.get("id").toString()};
            outputData.add(currentOutput);
        }

        FileUtil.writeDataToCsv(outputData, csvWriter);
    }
}