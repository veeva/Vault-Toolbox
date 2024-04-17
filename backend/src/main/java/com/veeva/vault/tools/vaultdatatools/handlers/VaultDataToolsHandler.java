/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.tools.vaultdatatools.handlers;

import com.veeva.vault.Environment;
import com.veeva.vault.client.Client;
import com.veeva.vault.tools.vaultdatatools.count.CountVaultData;
import com.veeva.vault.tools.vaultdatatools.delete.DeleteVaultData;
import com.veeva.vault.tools.vaultdatatools.model.DataToolOptions;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import java.util.Arrays;

public class VaultDataToolsHandler {
    private static final Logger LOGGER = Logger.getLogger(VaultDataToolsHandler.class);
    public VaultDataToolsHandler() {
        LOGGER.setLevel(Level.toLevel(Environment.getLogLevel()));
    }

    /**
     * Handler method for VaultDataTools CLI. Loads the given command line inputs, performs basic validation, and
     * initiates the selected action.
     *
     * @param args - command line arguments
     */
    public static void process(String[] args) {

        DataToolOptions dataToolOptions = DataToolOptions.loadFromCliArguments(args);

        DataToolOptions.Action action;
        try {
            action = dataToolOptions.getAction();
            if (action == null) {
                LOGGER.error("Action is required");
                return;
            }
        } catch (IllegalArgumentException e) {
            LOGGER.error("Unknown action provided; Expected values = " + Arrays.asList(DataToolOptions.Action.values()));
            return;
        }

        try {
            Client.login(dataToolOptions);
        } catch (IllegalArgumentException illegalArgumentException) {
            return;
        }

        if (Client.getVaultClient() == null || !Client.getVaultClient().getAuthenticationResponse().isSuccessful()) {
            return;
        }

        switch (action) {

            case COUNT:
                CountVaultData countVaultData = new CountVaultData();
                countVaultData.process(dataToolOptions);
                break;

            case DELETE:
                DeleteVaultData deleteVaultData = new DeleteVaultData();
                deleteVaultData.process(dataToolOptions);
                break;

            default:
        }
    }

    /**
     * Handler method for invoking VaultDataTools from within Vault Developer Toolbox integrations.
     * @param dataToolOptions
     */
    public static void process(DataToolOptions dataToolOptions) {
        LOGGER.debug("Processing action in VaultDataToolsHandler");

        switch (dataToolOptions.getAction()) {
            case COUNT:
                CountVaultData countVaultData = new CountVaultData();
                countVaultData.process(dataToolOptions);
                break;

            case DELETE:
                DeleteVaultData deleteVaultData = new DeleteVaultData();
                deleteVaultData.process(dataToolOptions);
                break;

            default:
        }
    }

}
