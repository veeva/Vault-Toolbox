/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.models;
import com.fasterxml.jackson.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.veeva.vault.Environment;
import com.veeva.vault.vapil.api.model.VaultModel;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;


import java.util.*;

@JsonIgnoreProperties
public class IntegrationRequest extends VaultModel {
    private static final Logger LOGGER = Logger.getLogger(IntegrationRequest.class);
    public IntegrationRequest() { LOGGER.setLevel(Level.toLevel(Environment.getLogLevel())); }
    @JsonIgnore
    private IntegrationRequestBodyParams bodyParams;
    @JsonProperty("body")
    private String body;

    @JsonIgnore
    public IntegrationRequestBodyParams getBodyParams() { return bodyParams; }
    @JsonIgnore
    public void setBodyParams(IntegrationRequestBodyParams bodyParams) {
        this.bodyParams = bodyParams;
    }

    @JsonProperty("body")
    public String getBody() { return this.getString("body"); }
    @JsonSetter
    public void setBody(String json) {
        try {
            LOGGER.debug("Integration request body : " + json);
            this.set("body", json);
            this.bodyParams = new ObjectMapper().readValue(json, IntegrationRequestBodyParams.class);
        }
        catch (Exception e) {
            LOGGER.error(e.getMessage());
            this.bodyParams = new IntegrationRequestBodyParams();
        }
    }
//    @JsonProperty("queryStringParameters")
//    private Map<String, Object> queryStringParameters;
//
//    @JsonGetter
//    public Map<String, Object> getQueryStringParameters() {
//        return queryStringParameters;
//    }
//
//    @JsonSetter
//    public void setQueryStringParameters(Map<String, Object> queryStringParameters) {
//        LOGGER.debug(queryStringParameters);
//        this.queryStringParameters = queryStringParameters;
//    }
//
//    @JsonIgnore
//    public String getSessionId() {
//        if(bodyParams != null && bodyParams.sessionId != null) {
//            return bodyParams.sessionId;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getVaultDNS() {
//        if(bodyParams != null && bodyParams.vaultDNS != null) {
//            return bodyParams.vaultDNS;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getUserName() {
//        if(bodyParams != null && bodyParams.userName != null) {
//            return bodyParams.userName;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getPassword() {
//        if(bodyParams != null && bodyParams.password != null) {
//            return bodyParams.password;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getAction() {
//        if(bodyParams != null && bodyParams.action != null) {
//            return bodyParams.action;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getComponentRecord() {
//        if(bodyParams != null && bodyParams.selectedComponent != null) {
//            return bodyParams.selectedComponent;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getMdlCode() {
//        if(bodyParams != null && bodyParams.mdlCode != null) {
//            return bodyParams.mdlCode;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getAsyncJobId() {
//        if(bodyParams != null && bodyParams.asyncJobId != null) {
//            return bodyParams.asyncJobId;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getFilePath() {
//        if(bodyParams != null && bodyParams.filePath != null) {
//            return bodyParams.filePath;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getDataType() {
//        if(bodyParams != null && bodyParams.dataType != null) {
//            return bodyParams.dataType;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getDataToolsAction() {
//        if(bodyParams != null && bodyParams.dataToolsAction != null) {
//            return bodyParams.dataToolsAction;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public void setDataToolsAction(String dataToolsAction) {
//        if (bodyParams != null) {
//            bodyParams.dataToolsAction = dataToolsAction;
//        }
//    }
//
//    @JsonIgnore
//    public String getDataTypeSelections() {
//        if(bodyParams != null && bodyParams.dataTypeSelections != null) {
//            return bodyParams.dataTypeSelections;
//        }
//        return null;
//    }
//    @JsonIgnore
//    public String getlambdaJobId() {
//        if(bodyParams != null && bodyParams.lambdaJobId != null) {
//            return bodyParams.lambdaJobId;
//        }
//        return null;
//    }
//
//    @JsonIgnore
//    public String getIsAsync() {
//        if(bodyParams != null && bodyParams.isAsync != null) {
//            return bodyParams.isAsync;
//        }
//        return null;
//    }
}