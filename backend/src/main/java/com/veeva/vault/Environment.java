/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault;

public class Environment {
    public static String getLogLevel() {
        String logLevel = System.getenv("LOG_LEVEL");
        if (logLevel == null) {
            logLevel = "INFO";
        }
        return logLevel.toLowerCase();
    }
}
