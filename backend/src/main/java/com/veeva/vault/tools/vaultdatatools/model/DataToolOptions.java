/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.tools.vaultdatatools.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.veeva.vault.vapil.api.model.VaultModel;
import org.apache.log4j.Logger;
import org.json.JSONObject;

import java.io.File;
import java.nio.file.FileSystems;
import java.util.ArrayList;
import java.util.List;

public class DataToolOptions extends VaultModel {
    private static Logger logger = Logger.getLogger(DataToolOptions.class);

    //------------------------------------------------------------------------------------------------
    // Data type: Expected Values [ALL,OBJECTS,DOCUMENTS]
    //------------------------------------------------------------------------------------------------

    @JsonProperty("datatype")
    public DataType getDataType() {
        String dataType = this.getString("datatype");
        if (dataType != null) {
            return DataType.valueOf(dataType);
        }
        return null;
    }

    public void setDataType(String dataType) {
        if (dataType != null) {
            this.set("datatype", dataType.toUpperCase());
        } else {
            this.set("datatype", null);
        }
    }


    //------------------------------------------------------------------------------------------------
    // Action to perform: Expected Values [COUNT,DELETE]
    //------------------------------------------------------------------------------------------------

    @JsonProperty("action")
    public Action getAction() {
        String action = this.getString("action");
        if (action != null) {
            return Action.valueOf(action);
        }
        return null;
    }

    public void setAction(String action) {
        if (action != null) {
            this.set("action", action.toUpperCase());
        } else {
            this.set("action", null);
        }
    }

    //------------------------------------------------------------------------------------------------
    // Object types to exclude: Expected Values [SYSTEM, CUSTOM, STANDARD]
    //------------------------------------------------------------------------------------------------

    @JsonProperty("exclude")
    public List<Exclude> getExcludeList() {
        List<String> excludeListInput = this.getListString("exclude");

        if (excludeListInput != null && excludeListInput.size() > 0) {
            ArrayList<Exclude> excludeList = new ArrayList<>();
            for (String element : excludeListInput) {
                excludeList.add(Exclude.valueOf(element));
            }
            return excludeList;
        }
        return null;
    }

    public void setExclude(String exclude) {
        if (exclude != null) {
            this.set("exclude", exclude.toUpperCase());
        } else {
            this.set("exclude", null);
        }
    }

    //------------------------------------------------------------------------------------------------
    // Is Read Only: Expected Values [TRUE, FALSE]
    //------------------------------------------------------------------------------------------------
    @JsonProperty("readOnly")
    @JsonAlias({"readonly"})
    public String getReadyOnly() {
        return this.getString("readOnly");
    }

    public void setReadOnly(String readOnly) {
        this.set("readOnly", readOnly);
    }

    //------------------------------------------------------------------------------------------------
    // Vault Authentication Details
    //------------------------------------------------------------------------------------------------
    @JsonProperty("vaultDNS")
    @JsonAlias({"vaultdns"})
    public String getVaultDNS() {
        return this.getString("vaultDNS");
    }

    public void setVaultDNS(String vaultDNS) {
        this.set("vaultDNS", vaultDNS);
    }

    @JsonProperty("username")
    public String getVaultUsername() {
        return this.getString("username");
    }

    public void setVaultUsername(String username) {
        this.set("username", username);
    }

    @JsonProperty("password")
    public String getVaultPassword() {
        return this.getString("password");
    }

    public void setVaultPassword(String password) {
        this.set("password", password);
    }

    @JsonProperty("sessionId")
    @JsonAlias("sessionid")
    public String getVaultSessionId() {
        return this.getString("sessionId");
    }

    public void setVaultSessionId(String sessionId) {
        this.set("sessionId", sessionId);
    }

    //------------------------------------------------------------------------------------------------
    // Input and Output
    //------------------------------------------------------------------------------------------------
    @JsonProperty("input")
    public String getInput() {
        return this.getString("input");
    }

    public void setInput(String input) {
        this.set("input", input);
    }

    @JsonIgnore
    public File getInputFile() {
        String input = getInput();
        if (input != null) {
            String inputFilePath = FileSystems.getDefault().getPath(input).normalize().toAbsolutePath().toString();
            return new File(inputFilePath);
        }

        return null;
    }

    //------------------------------------------------------------------------------------------------
    // Is Integration
    //------------------------------------------------------------------------------------------------
    @JsonProperty("isIntegration")
    @JsonAlias("isintegration")
    public String getIsIntegration() {
        return this.getString("isIntegration");
    }
    public void setIsIntegration(String isIntegration) {
        this.set("isIntegration", isIntegration);
    }

    //------------------------------------------------------------------------------------------------
    public static DataToolOptions loadFromCliArguments(String[] cliArguments) {
        try {
            JSONObject jsonParams = new JSONObject();
            if (cliArguments != null) {
                String key = null;
                String value = null;
                for (int i = 0; i < cliArguments.length; i++) {
                    String buffer = cliArguments[i];
                    boolean isKey = buffer.startsWith("-");
                    if (isKey) {
                        key = buffer.substring(1).toLowerCase();
                        value = null;
                    } else {
                        value = buffer;
                    }

                    if (key != null && value != null) {
                        jsonParams.put(key, value);
                    }
                }
            }

            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            DataToolOptions dataToolOptions = mapper.readValue(jsonParams.toString(), DataToolOptions.class);
            return dataToolOptions;
        } catch (Exception e) {
            logger.error(e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public enum Action {
        DELETE("DELETE"),
        COUNT("COUNT");

        String action;

        Action(String action) {
            this.action = action;
        }

        public String getValue() {
            return action;
        }
    }

    public enum DataType {
        ALL("ALL"),
        OBJECTS("OBJECTS"),
        DOCUMENTS("DOCUMENTS");

        String dataType;

        DataType(String dataType) {
            this.dataType = dataType;
        }

        public String getValue() {
            return dataType;
        }
    }

    public enum Exclude {
        SYSTEM("SYSTEM"),
        STANDARD("STANDARD"),
        CUSTOM("CUSTOM"),
        APPLICATION("APPLICATION");
        String exclude;

        Exclude(String exclude) {
            this.exclude = exclude;
        }

        public String getValue() {
            return exclude;
        }
    }
}
