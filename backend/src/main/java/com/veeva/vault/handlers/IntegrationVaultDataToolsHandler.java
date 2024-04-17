/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.handlers;

import com.opencsv.CSVWriter;
import com.veeva.vault.Environment;
import com.veeva.vault.client.Client;
import com.veeva.vault.models.IntegrationRequest;
import com.veeva.vault.models.IntegrationResponse;
import com.veeva.vault.models.ResponseModel;
import com.veeva.vault.tools.vaultdatatools.handlers.VaultDataToolsHandler;
import com.veeva.vault.tools.vaultdatatools.model.DataToolOptions;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class IntegrationVaultDataToolsHandler {
    private static final Logger LOGGER = Logger.getLogger(IntegrationVaultDataToolsHandler.class);
    public IntegrationVaultDataToolsHandler() {
        LOGGER.setLevel(Level.toLevel(Environment.getLogLevel()));
    }

    /**
     * Entry point for calling Vault Data Tools from an integration. Processes integration request and calls the
     * appropriate VaultDataTools methods.
     * @param integrationRequest - integration request
     * @param integrationResponse - response for the integration call
     */
    public static void process(IntegrationRequest integrationRequest, IntegrationResponse integrationResponse) {
        LOGGER.debug("Processing action in IntegrationVaultDataToolsHandler");

        Boolean isAsync = integrationRequest.getBodyParams().getIsAsync();
        LOGGER.debug("isAsync : " + isAsync);

        ResponseModel vaultDataToolsResponseModel = new ResponseModel();
        DataToolOptions dataToolOptions = buildDataToolOptions(integrationRequest);

        switch (integrationRequest.getBodyParams().getActionType()) {
            case COUNT_DATA:
                if (isAsync) {
                    LambdaHandler.runAsync(integrationRequest, integrationResponse.getJobId());
                    vaultDataToolsResponseModel.setResponseStatus(ResponseModel.ResponseStatus.SUCCESS);
                } else {
                    dataToolOptions.setAction(DataToolOptions.Action.COUNT.toString());
                    VaultDataToolsHandler.process(dataToolOptions);
                }
                break;
            case DELETE_DATA:
                if (isAsync) {
                    LambdaHandler.runAsync(integrationRequest, integrationResponse.getJobId());
                    vaultDataToolsResponseModel.setResponseStatus(ResponseModel.ResponseStatus.SUCCESS);
                } else {
                    dataToolOptions.setAction(DataToolOptions.Action.DELETE.toString());
                    VaultDataToolsHandler.process(dataToolOptions);
                }
                break;
            default:
                LOGGER.debug("Failed to match switch action for Vault Data Tools action type");
        }

        integrationResponse.setData(vaultDataToolsResponseModel);
    }

    /**
     * Populates the DataToolOptions object from corresponding integrationRequest parameters
     * @param integrationRequest - integration request
     * @return DataToolOptions object containing Vault Data Tool selections
     */
    private static DataToolOptions buildDataToolOptions(IntegrationRequest integrationRequest) {
        DataToolOptions dataToolOptions = new DataToolOptions();

        dataToolOptions.setDataType(integrationRequest.getBodyParams().getDataType());
        dataToolOptions.setVaultDNS(Client.getVaultClient().getVaultDNS());
        dataToolOptions.setVaultSessionId(Client.getVaultClient().getSessionId());
        dataToolOptions.setIsIntegration(Boolean.TRUE.toString());

        // If provided, write the input params (object/doc types) into a CSV
        if (integrationRequest.getBodyParams().getDataTypeSelections() != null && !integrationRequest.getBodyParams().getDataTypeSelections().isEmpty()) {
            String inputFile = writeInputParamsToTmpFile(integrationRequest);
            if (inputFile != null) {
                dataToolOptions.setInput(inputFile);
            }
        }

        return dataToolOptions;
    }

    /**
     * Reads user-selected data from integrationRequest and writes it to CSV in the Lambda tmp directory, for later use in Vault Data Tools
     * @param integrationRequest - integration request, for retrieving selected data
     * @return - file path of generated CSV if successful, otherwise null
     */
    private static String writeInputParamsToTmpFile(IntegrationRequest integrationRequest) {
        String tmpInputFile = "/tmp/" + java.util.UUID.randomUUID() + ".csv";

        List<String> inputData = new ArrayList<>(Arrays.asList(integrationRequest.getBodyParams().getDataTypeSelections().split(",")));
        inputData.add(0, "name__v"); // Default header (placeholder only; won't be read by vault data tools)

        LOGGER.debug("Writing input data to tmp file : " + inputData);
        try {
            CSVWriter writer = new CSVWriter(new BufferedWriter(new FileWriter(tmpInputFile)));
            for (String value : inputData) {
                writer.writeNext(new String[]{value});
            }
            writer.flush();
            writer.close();

            return tmpInputFile;
        } catch (IOException e) {
            LOGGER.debug("Unexpected error creating input file in tmp directory : " + e.getMessage());
            return null;
        }
    }
}
