/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.helpers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.veeva.vault.models.IntegrationResponse;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class FileHelper {
    private static final Logger LOGGER = Logger.getLogger(FileHelper.class);
    private static final String parentDirectory = "/tmp/";
    private final String id;

    public FileHelper(String id) {
        this.id = id;
    }

    public enum Status {
        RUNNING("RUNNING"),
        UNDEFINED("UNDEFINED");

        String value;
        Status(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    public File getLogFile() throws IOException {

        File logDirectory = getCustomDirectory("vault-integration-logs");

        File logFile = new File(logDirectory + "/log.json");

        if (!logFile.exists()) {
            logFile.createNewFile();
        }

        return logFile;
    }

    public File getParentDirectoryFile() { return new File(parentDirectory + this.id); }

    private File getCustomDirectory(String directory) {

        File customDirectory = new File(this.getParentDirectoryFile(), "/" + directory + "/");

        LOGGER.info("Creating new folder: " + customDirectory);

        if (!customDirectory.exists()) {
            customDirectory.mkdirs();
        }
        return customDirectory;
    }

    public void updateAsyncStatus(String status, String response) throws IOException {

        File logFile = getLogFile();
        BufferedReader reader = new BufferedReader(new FileReader(logFile));
        PrintWriter printWriter = new PrintWriter(new FileWriter(logFile));

        if (status != null) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("status", status);
            printWriter.write(jsonObject.toString());
        }
        if (response != null) {
            printWriter.write(response);
        }
        printWriter.flush();
        printWriter.close();
    }

    public IntegrationResponse retrieveAsyncStatus(String jobId) throws IOException {

        String jsonTxt = null;
        ObjectMapper objectMapper = new ObjectMapper();

        File logFile = new File(parentDirectory + "/" + jobId + "/vault-integration-logs/log.json");

        if (logFile.exists()) {
            InputStream is = new FileInputStream(logFile);
            jsonTxt = IOUtils.toString(is, StandardCharsets.UTF_8);
            //jsonTxt = jsonTxt.replaceAll("\\\\", "");
        }

        //LOGGER.debug(objectMapper.readValue(jsonTxt, IntegrationResponse.class).toJsonString());
        return objectMapper.readValue(jsonTxt, IntegrationResponse.class);

    }
}
