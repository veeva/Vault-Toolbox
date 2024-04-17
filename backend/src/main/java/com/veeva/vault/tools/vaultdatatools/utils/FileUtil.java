/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.tools.vaultdatatools.utils;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;
import com.veeva.vault.client.Client;
import com.veeva.vault.vapil.api.model.response.FileStagingItemBulkResponse;
import com.veeva.vault.vapil.api.model.response.FileStagingItemResponse;
import com.veeva.vault.vapil.api.model.response.VaultResponse;
import com.veeva.vault.vapil.api.request.FileStagingRequest;
import org.apache.log4j.Logger;

import java.io.*;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

public class FileUtil {

    private static Logger LOGGER = Logger.getLogger(FileUtil.class);

    /**
     * Determines if user-provided input file exists
     *
     * @param inputFile - File provided by user input
     * @return - True if provided file exists, otherwise false
     */
    public static boolean getInputFile(File inputFile) {
        if (inputFile == null) {
            LOGGER.error("Unexpected error loading input file.");
            return false;
        } else if (!inputFile.exists()) {
            LOGGER.error("File does not exist [" + inputFile.getAbsolutePath() + "]");
            return false;
        }
        return true;
    }

    /**
     * Reads the input file CSV and loads the data into a HashMap
     *
     * @param inputFile - File provided by user input
     * @return - HashMap containing the contents of the input file
     */
    public static HashMap<String, List<String>> getInputFileData(File inputFile) {
        // Reads the CSV and returns the contents
        try (CSVReader csvReader = new CSVReaderBuilder(new FileReader(inputFile)).withSkipLines(1).build()) {

            HashMap<String, List<String>> inputData = new HashMap<>();
            String[] nextRow;

            while ((nextRow = csvReader.readNext()) != null) {
                if (nextRow.length != 0) {

                    // If there are multiple rows for this object, append the idParamValue (in column 3) to current list
                    if (inputData.containsKey(nextRow[0]) && nextRow.length >= 3) {
                        inputData.get(nextRow[0]).add(nextRow[2]);
                    } else if (nextRow.length >= 3) {
                        // First column is the object name, which is our key
                        // Second and third column are the idParam and idParamValue
                        inputData.put(nextRow[0], new ArrayList<>(Arrays.asList(nextRow).subList(1, 3)));
                    } else { // Case where input file does not have idParam/idParamValue columns
                        inputData.put(nextRow[0], new ArrayList<>());
                    }
                }
            }

            if (inputData.isEmpty()) {
                LOGGER.error("Provided input file is empty.");
                return null;
            }

            return inputData;

        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
        return null;
    }

    /**
     * Initializes a CSVWriter
     *
     * @param fileName - output file the CSVWriter will write to
     * @return - initialized CSVWriter, or null if failed to initialize
     */
    public static CSVWriter getCsvWriter(String fileName) {
        try {
            BufferedWriter writer = new BufferedWriter(new FileWriter(fileName));
            return new CSVWriter(writer);
        } catch (IOException e) {
            LOGGER.error("Unexpected error creating CSVWriter: " + e.getMessage());
            return null;
        }
    }

    /**
     * Writes output data to CSV
     *
     * @param outputData - data to write to CSV
     * @param csvWriter  - CSVWriter used to write output
     */
    public static void writeDataToCsv(List<String[]> outputData, CSVWriter csvWriter) {
        try {
            for (String[] row : outputData) {
                csvWriter.writeNext(row);
            }
            csvWriter.flush();
        } catch (IOException e) {
            LOGGER.error("Error writing to file: " + e.getMessage());
        }
    }

    /**
     * Writes output CSV to File Staging Area
     *
     * @param outputFileName - CSV file to write to File Staging Area
     */
    public static void writeToFileStaging(String outputFileName, String folder) {
        try {
            String newFileName = outputFileName.substring(4); // Remove /tmp from file name
            String folderPath = String.format("u%s/VaultDeveloperToolbox/%s", Client.getVaultClient().getUserId(), folder);


            File outputFile = new File(outputFileName);
            byte[] bytes = Files.readAllBytes(outputFile.toPath());

            // If the folder doesn't exist yet, create it
            FileStagingItemBulkResponse response = Client.getVaultClient().newRequest(FileStagingRequest.class)
                    .listItemsAtAPath(folderPath);

            if (!response.isSuccessful() && response.hasErrors()) {
                for (VaultResponse.APIResponseError error : response.getErrors()) {
                    if (error.getType().equalsIgnoreCase("MALFORMED_URL")) {
                        createVaultDataToolsFileStagingFolders();
                    }
                }
            }

            // Create the file
            String newFilePath = String.format("/%s%s", folderPath, newFileName);
            FileStagingItemResponse fileStagingItemResponse = Client.getVaultClient().newRequest(FileStagingRequest.class)
                    .setOverwrite(true)
                    .setFile(newFileName, bytes)
                    .createFolderOrFile(FileStagingRequest.Kind.FILE, newFilePath);

        } catch (IOException e) {
            LOGGER.error("Error writing to file staging server: " + e.getMessage());
        }
    }

    /**
     * Creates the required folders for Vault Data Tools on File Staging
     * @return - true for success, false for failure
     */
    public static boolean createVaultDataToolsFileStagingFolders() {
        String vaultToolboxPath = String.format("u%s/VaultDeveloperToolbox", Client.getVaultClient().getUserId());
        String countPath = String.format("%s/count", vaultToolboxPath);
        String deletePath = String.format("%s/delete", vaultToolboxPath);

        FileStagingItemResponse response = Client.getVaultClient().newRequest(FileStagingRequest.class).createFolderOrFile(FileStagingRequest.Kind.FOLDER, vaultToolboxPath);
        if (!response.isSuccessful()) {
            return false;
        }

        response = Client.getVaultClient().newRequest(FileStagingRequest.class).createFolderOrFile(FileStagingRequest.Kind.FOLDER, countPath);
        if (!response.isSuccessful()) {
            return false;
        }

        response = Client.getVaultClient().newRequest(FileStagingRequest.class).createFolderOrFile(FileStagingRequest.Kind.FOLDER, deletePath);
        if (!response.isSuccessful()) {
            return false;
        }

        // All folders created successfully
        return true;
    }

    /**
     * Flush and close the provided CSVWriter
     *
     * @param csvWriter - CSVWriter to flush and close
     */
    public static void closeCsvWriter(CSVWriter csvWriter) {
        try {
            csvWriter.flush();
            csvWriter.close();
        } catch (IOException e) {
            LOGGER.error("Unexpected error closing CSVWriter: " + e.getMessage());
        }
    }

    /**
     * Appends current DateTime to provided file name
     *
     * @param fileName - output file name
     * @return - formatted output file name
     */
    public static String formatFileName(String fileName, String isIntegration) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
        String path = ""; // Default printing to local directory
        if (isIntegration != null && isIntegration.equalsIgnoreCase("true")) {
            // For integrations, write to /tmp directory in AWS Lambda, which will be picked up and saved in Vault File Staging
            path = "/tmp/";
        }
        return path + formatter.format(LocalDateTime.now()) + "-" + fileName;

    }
}
