/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.tools.vaultdatatools.count;

import com.opencsv.CSVWriter;
import com.veeva.vault.Environment;
import com.veeva.vault.tools.vaultdatatools.utils.FileUtil;
import com.veeva.vault.tools.vaultdatatools.model.DataToolOptions;
import com.veeva.vault.client.Client;
import com.veeva.vault.vapil.api.model.metadata.VaultObject;
import com.veeva.vault.vapil.api.model.response.DocumentTypesResponse;
import com.veeva.vault.vapil.api.model.response.MetaDataObjectBulkResponse;
import com.veeva.vault.vapil.api.model.response.MetaDataObjectResponse;
import com.veeva.vault.vapil.api.model.response.QueryResponse;
import com.veeva.vault.vapil.api.request.DocumentRequest;
import com.veeva.vault.vapil.api.request.MetaDataRequest;
import com.veeva.vault.vapil.api.request.QueryRequest;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class CountVaultData {
    private static Logger logger = Logger.getLogger(CountVaultData.class);
    private DataToolOptions.DataType dataType;
    private File inputFile;
    private List<DataToolOptions.Exclude> excludeSources;
    private CSVWriter csvWriter;
    private List<String> outputFiles = new ArrayList<>();
    private String isIntegration;

    public CountVaultData() {
        logger.setLevel(Level.toLevel(Environment.getLogLevel()));
    }

    /**
     * Main driver method for CountVaultData. Processes the given DataToolOptions and performs data count based on
     * selected action and data type.
     *
     * @param dataToolOptions - DataToolOptions object containing the configuration from input
     */
    public void process(DataToolOptions dataToolOptions) {
        dataType = dataToolOptions.getDataType();
        isIntegration = dataToolOptions.getIsIntegration();

        if (dataToolOptions.getInput() != null) {
            inputFile = dataToolOptions.getInputFile();
            if (!FileUtil.getInputFile(inputFile)) {
                // Quit if input file was provided, but we couldn't load it
                return;
            }
        }

        if (dataToolOptions.getExcludeList() != null) {
            excludeSources = dataToolOptions.getExcludeList();
        }

        switch (dataType) {
            case OBJECTS:
                countObjectsHandler();
                break;

            case DOCUMENTS:
                countDocumentsHandler();
                break;

            case ALL:
                countObjectsHandler();
                countDocumentsHandler();
                break;

            default:
                logger.error("Unknown data type [" + dataType + "]; Expected values = [OBJECTS, DOCUMENTS, ALL]");
                return;
        }

        // If called from an integration, write to Vault File Staging
        if (isIntegration != null && isIntegration.equalsIgnoreCase("true")) {
            for (String outputFileName : outputFiles) {
                FileUtil.writeToFileStaging(outputFileName, "count");
            }
        }

        logger.info("------------------------------------------------------------------");
        for (String outputFileName : outputFiles) {
            logger.info("Review " + outputFileName + " for full details");
        }
        logger.info("------------------------------------------------------------------");
    }

    /**
     * Handles object count. Retrieves the objects and their metadata, and sends a VQL Count Query
     * for each object. Writes the results to the output CSV.
     */
    public void countObjectsHandler() {
        String outputFileName = FileUtil.formatFileName("count-objects-output.csv", isIntegration);
        csvWriter = FileUtil.getCsvWriter(outputFileName);

        String[] outputHeaders = new String[]{"name", "data_type", "record_count", "system_managed"};
        List<String[]> headerData = Collections.singletonList(outputHeaders);
        FileUtil.writeDataToCsv(headerData, csvWriter);

        // Load input file, if provided
        HashMap<String, List<String>> providedObjectTypes = null;
        if (inputFile != null) {
            providedObjectTypes = FileUtil.getInputFileData(inputFile);
        }

        MetaDataObjectBulkResponse objectResponse = Client.getVaultClient().newRequest(MetaDataRequest.class)
                .retrieveObjectCollection();

        if (!objectResponse.isSuccessful()) {
            return;
        }

        for (VaultObject object : objectResponse.getObjects()) {
            List<String[]> outputData = new ArrayList<>();

            if (providedObjectTypes != null && !providedObjectTypes.containsKey(object.getName())) {
                continue;
            }

            if (excludeSources != null && excludeSources.contains(DataToolOptions.Exclude.valueOf(object.getSource().toUpperCase()))) {
                continue;
            }

            String objectName = object.getName();

            String query = String.format("SELECT id FROM %s PAGESIZE 0", objectName);
            QueryResponse queryResponse = Client.getVaultClient().newRequest(QueryRequest.class)
                    .query(query);

            MetaDataObjectResponse objectMetadataResponse = Client.getVaultClient()
                    .newRequest(MetaDataRequest.class)
                    .retrieveObjectMetadata(objectName);

            if (queryResponse != null && !queryResponse.hasErrors()) {
                outputData.add(new String[]{
                        objectName,
                        "OBJECT",
                        String.valueOf(queryResponse.getResponseDetails().getTotal()),
                        objectMetadataResponse.getObject().getSystemManaged().toString()
                });
            }

            FileUtil.writeDataToCsv(outputData, csvWriter);
        }

        FileUtil.closeCsvWriter(csvWriter);
        outputFiles.add(outputFileName);
    }

    /**
     * Handles document count. Retrieves all document types and sends a VQL Count Query
     * for each document type. Writes the results to the output CSV.
     */
    public void countDocumentsHandler() {
        String outputFileName = FileUtil.formatFileName("count-documents-output.csv", isIntegration);
        csvWriter = FileUtil.getCsvWriter(outputFileName);

        logger.debug("outputfilename " + outputFileName);

        String[] outputHeaders = new String[]{"name", "data_type", "document_versions"};
        List<String[]> headerData = Collections.singletonList(outputHeaders);
        FileUtil.writeDataToCsv(headerData, csvWriter);

        logger.debug("1");

        HashMap<String, List<String>> providedDocumentTypes = null;
        if (inputFile != null) {
            providedDocumentTypes = FileUtil.getInputFileData(inputFile);
        }

        logger.debug("2");

        DocumentTypesResponse documentTypesResponse = Client.getVaultClient().newRequest(DocumentRequest.class)
                .retrieveAllDocumentTypes();

        logger.debug("3");

        if (!documentTypesResponse.isSuccessful()) {
            return;
        }

        logger.debug("about to loop over doc types");

        for (DocumentTypesResponse.DocumentType docType : documentTypesResponse.getTypes()) {
            List<String[]> outputData = new ArrayList<>();

            if (providedDocumentTypes != null && !providedDocumentTypes.containsKey(docType.getName())) {
                continue;
            }

            logger.debug("about to query");

            String query = String.format("SELECT id FROM ALLVERSIONS documents WHERE type__v = '%s' PAGESIZE 0", docType.getLabel());
            QueryResponse queryResponse = Client.getVaultClient().newRequest(QueryRequest.class)
                    .query(query);

            if (queryResponse != null && !queryResponse.hasErrors()) {
                outputData.add(new String[]{
                        docType.getName(),
                        "DOCUMENT",
                        String.valueOf(queryResponse.getResponseDetails().getTotal())
                });
            }
            logger.debug("About to write to file");
            FileUtil.writeDataToCsv(outputData, csvWriter);
        }
        FileUtil.closeCsvWriter(csvWriter);
        outputFiles.add(outputFileName);
    }
}
