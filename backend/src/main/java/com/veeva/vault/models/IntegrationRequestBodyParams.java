/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.veeva.vault.vapil.api.model.VaultModel;
import org.apache.commons.lang3.EnumUtils;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IntegrationRequestBodyParams extends VaultModel {
    @JsonProperty("vaultDNS")
    public String getVaultDNS() {
        return this.getString("vaultDNS");
    }
    public void setVaultDNS(String vaultDNS) { this.set("vaultDNS", vaultDNS); }

    @JsonProperty("sessionId")
    public String getSessionId() {
        return this.getString("sessionId");
    }
    public void setSessionId(String sessionId) {
        this.set("sessionId", sessionId);
    }

    @JsonProperty("userName")
    public String getUserName() { return this.getString("userName"); }
    public void setUserName(String userName) { this.set("userName", userName); }

    @JsonProperty("password")
    public String getPassword() { return this.getString("password"); }
    public void setPassword(String password) { this.set("password", password); }

    @JsonProperty("tool")
    public String getTool() {
        return this.getString("tool");
    }
    public void setTool(String tool) {
        this.set("tool",  tool);
    }

    public enum ToolType {
        VAULT_DATA_TOOLS("VAULT_DATA_TOOLS"),
        UNDEFINED("UNDEFINED");

        String value;
        ToolType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    @JsonIgnore
    public ToolType getToolType() {
        return getToolType(ToolType.UNDEFINED);
    }

    @JsonIgnore
    public ToolType getToolType(ToolType defaultValue) {
        if (getTool() != null && EnumUtils.isValidEnum(ToolType.class, getTool().toUpperCase()))
            return ToolType.valueOf(getTool().toUpperCase());
        else
            return defaultValue;
    }

    @JsonIgnore
    public void setToolType(ToolType toolType) {
        this.set("tool",  toolType.getValue());
    }

    @JsonProperty("action")
    public String getAction() {
        return this.getString("action");
    }
    public void setAction(String action) {
        this.set("action",  action);
    }

    public enum ActionType {
        COUNT_DATA("COUNT_DATA"),
        DELETE_DATA("DELETE_DATA"),
        UNDEFINED("UNDEFINED");

        String value;
        ActionType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }

    @JsonIgnore
    public ActionType getActionType() {
        return getActionType(ActionType.UNDEFINED);
    }

    @JsonIgnore
    public ActionType getActionType(ActionType defaultValue) {
        if (getAction() != null && EnumUtils.isValidEnum(ActionType.class, getAction().toUpperCase()))
            return ActionType.valueOf(getAction().toUpperCase());
        else
            return defaultValue;
    }

    @JsonIgnore
    public void setActionType(ActionType actionType) {
        this.set("action",  actionType.getValue());
    }

    @JsonProperty("isAsync")
    public Boolean getIsAsync() {
        return this.getBoolean("isAsync");
    }
    public void setIsAsync(Boolean isAsync) {
        this.set("isAsync",  isAsync);
    }

    @JsonProperty("lambdaJobId")
    public String getLambdaJobId() {
        return this.getString("lambdaJobId");
    }
    public void setLambdaJobId(String lambdaJobId) {
        this.set("lambdaJobId",  lambdaJobId);
    }

    @JsonProperty("dataType")
    public String getDataType() {
        return this.getString("dataType");
    }
    public void setDataType(String dataType) {
        this.set("dataType",  dataType);
    }

    @JsonProperty("dataToolsAction")
    public String getDataToolsAction() {
        return this.getString("dataToolsAction");
    }
    public void setDataToolsAction(String dataToolsAction) {
        this.set("dataToolsAction",  dataToolsAction);
    }

    @JsonProperty("dataTypeSelections")
    public String getDataTypeSelections() {
        return this.getString("dataTypeSelections");
    }
    public void setDataTypeSelections(String dataTypeSelections) {
        this.set("dataTypeSelections",  dataTypeSelections);
    }

}
