/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.client;

import com.veeva.vault.Environment;
import com.veeva.vault.models.IntegrationRequest;
import com.veeva.vault.models.IntegrationResponse;
import com.veeva.vault.tools.vaultdatatools.model.DataToolOptions;
import com.veeva.vault.vapil.api.client.VaultClient;
import org.apache.log4j.Level;
import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;

public class Client {
    private static VaultClient vaultClient;
    private static final Logger LOGGER = LogManager.getLogger(Client.class);
    private static final String CLIENT_ID = "veeva-vault-developer-toolbox";
    public Client() {LOGGER.setLevel(Level.toLevel(Environment.getLogLevel()));}

    /**
     * Gets the current VaultClient
     *
     * @return - Current VaultClient
     */
    public static VaultClient getVaultClient() {
        return vaultClient;
    }

    /**
     * Authenticates to Vault and stores the VaultClient
     * @param dataToolOptions - DataToolOptions object containing the configuration from input
     */
    public static void login(DataToolOptions dataToolOptions) {
        if (dataToolOptions.getVaultDNS() == null || dataToolOptions.getVaultDNS().isEmpty()) {
            LOGGER.error("Vault DNS is required");
            throw new IllegalArgumentException("Vault DNS is required");
        }


        if (dataToolOptions.getVaultSessionId() != null) {
            vaultClient = VaultClient.newClientBuilder(VaultClient.AuthenticationType.SESSION_ID)
                    .withVaultDNS(dataToolOptions.getVaultDNS())
                    .withVaultClientId(CLIENT_ID)
                    .withVaultSessionId(dataToolOptions.getVaultSessionId())
                    .build();
        } else {
            vaultClient = VaultClient.newClientBuilder(VaultClient.AuthenticationType.BASIC)
                    .withVaultDNS(dataToolOptions.getVaultDNS())
                    .withVaultClientId(CLIENT_ID)
                    .withVaultUsername(dataToolOptions.getVaultUsername())
                    .withVaultPassword(dataToolOptions.getVaultPassword())
                    .build();
        }
    }

    /**
     * Authenticates to Vault and stores the VaultClient
     * @param integrationRequest
     * @param integrationResponse
     */
    public static void login(IntegrationRequest integrationRequest, IntegrationResponse integrationResponse) {

        // Authenticate with session id if possible, otherwise use username/password
        if (integrationRequest.getBodyParams().getVaultDNS() != null && integrationRequest.getBodyParams().getSessionId() != null
                && !integrationRequest.getBodyParams().getVaultDNS().equals("") && !integrationRequest.getBodyParams().getSessionId().equals("")) {
            LOGGER.debug("Authenticating with session id");

            vaultClient = VaultClient
                    .newClientBuilder(VaultClient.AuthenticationType.SESSION_ID)
                    .withVaultClientId(CLIENT_ID)
                    .withVaultDNS(integrationRequest.getBodyParams().getVaultDNS())
                    .withVaultSessionId(integrationRequest.getBodyParams().getSessionId())
                    .build();

        } else if (integrationRequest.getBodyParams().getVaultDNS() != null && integrationRequest.getBodyParams().getUserName() != null && integrationRequest.getBodyParams().getPassword() != null)  {
            LOGGER.debug("Authenticating with username/password");

            // Instantiate the VAPIL VaultClient using username and password authentication
            vaultClient = VaultClient
                    .newClientBuilder(VaultClient.AuthenticationType.BASIC)
                    .withVaultDNS(integrationRequest.getBodyParams().getVaultDNS())
                    .withVaultUsername(integrationRequest.getBodyParams().getUserName())
                    .withVaultPassword(integrationRequest.getBodyParams().getPassword())
                    .withVaultClientId(CLIENT_ID)
                    .build();
        }

        if (vaultClient != null && vaultClient.hasSessionId()) {
            integrationResponse.setResponseStatus(IntegrationResponse.ResponseStatus.SUCCESS);
        }
        else {
            integrationResponse.setResponseStatus(IntegrationResponse.ResponseStatus.FAILURE);
            if (vaultClient != null && vaultClient.getAuthenticationResponse().hasErrors()) {
                integrationResponse.setData(vaultClient.getAuthenticationResponse().getErrors().get(0).getMessage());
            } else {
                integrationResponse.setResponseMessage("Unexpected error");
            }
        }
    }
}
