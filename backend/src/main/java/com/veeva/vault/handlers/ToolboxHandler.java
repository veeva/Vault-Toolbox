package com.veeva.vault.handlers;

import com.veeva.vault.Environment;
import com.veeva.vault.tools.vaultdatatools.handlers.VaultDataToolsHandler;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

public class ToolboxHandler {
    private static final Logger LOGGER = Logger.getLogger(ToolboxHandler.class);
    public ToolboxHandler() {
        LOGGER.setLevel(Level.toLevel(Environment.getLogLevel()));
    }

    /**
     * Handler method for Vault Developer Toolbox CLI.
     *
     * @param args - command line arguments
     */
    public static void main(String[] args) {
        // Will convert to switch statement when more tools are added
        VaultDataToolsHandler.process(args);
    }
}
