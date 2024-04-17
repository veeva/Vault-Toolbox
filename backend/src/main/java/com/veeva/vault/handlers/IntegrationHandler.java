/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.handlers;

import com.veeva.vault.Environment;
import com.veeva.vault.client.Client;
import com.veeva.vault.models.IntegrationRequest;
import com.veeva.vault.models.IntegrationResponse;
import com.veeva.vault.models.ResponseModel;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

public class IntegrationHandler {
    private static final Logger LOGGER = Logger.getLogger(IntegrationHandler.class);
    private final IntegrationRequest integrationRequest;
    private final IntegrationResponse integrationResponse;

    public IntegrationHandler(IntegrationRequest integrationRequest) {
        this.integrationRequest = integrationRequest;
        this.integrationResponse = new IntegrationResponse();
    }

    public IntegrationResponse process() {
        try {
            LOGGER.debug("integration : start");

            String logLevel = Environment.getLogLevel();
            LOGGER.setLevel(Level.toLevel(logLevel.toUpperCase()));
            LOGGER.debug("logLevel : " + logLevel);

            LOGGER.debug("vaultDNS : " + integrationRequest.getBodyParams().getVaultDNS());
            LOGGER.debug("username : " + integrationRequest.getBodyParams().getUserName());
            LOGGER.debug("tool : " + integrationRequest.getBodyParams().getTool());
            LOGGER.debug("action : " + integrationRequest.getBodyParams().getAction());

            // Generate and assign a jobId
            String jobId = integrationRequest.getBodyParams().getLambdaJobId();
            if (jobId == null) {
                jobId = java.util.UUID.randomUUID().toString();
                LOGGER.debug("Generating new AWS lambda jobId : " + jobId);
            }
            integrationResponse.setJobId(jobId);

            Client.login(integrationRequest, integrationResponse);

            if (Client.getVaultClient() != null && Client.getVaultClient().getAuthenticationResponse().isSuccessful() && integrationRequest.getBodyParams().getTool() != null) {

                switch (integrationRequest.getBodyParams().getToolType()) {
                    case VAULT_DATA_TOOLS:
                        IntegrationVaultDataToolsHandler.process(integrationRequest, integrationResponse);
                        break;
                    default:
                        LOGGER.debug("Failed to match switch on tool type");
                }
            }

            integrationResponse.setResponseStatus(ResponseModel.ResponseStatus.SUCCESS);

            LOGGER.debug("integration: end");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
            integrationResponse.setResponseStatus(ResponseModel.ResponseStatus.FAILURE);
            integrationResponse.setResponseMessage(e.getMessage());
        }
        return integrationResponse;
    }
}