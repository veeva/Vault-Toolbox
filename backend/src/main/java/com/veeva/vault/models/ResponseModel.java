/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.models;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class ResponseModel {
    @JsonProperty("responseMessage")
    private String responseMessage;

    @JsonGetter
    public String getResponseMessage() {
        return responseMessage;
    }

    @JsonSetter
    public void setResponseMessage(String responseMessage) {
        this.responseMessage = responseMessage;
    }

    @JsonProperty("responseStatus")
    private IntegrationResponse.ResponseStatus responseStatus = IntegrationResponse.ResponseStatus.UNDEFINED;

    @JsonGetter
    public IntegrationResponse.ResponseStatus getResponseStatus() {
        return responseStatus;
    }

    @JsonSetter
    public void setResponseStatus(IntegrationResponse.ResponseStatus responseStatus) {
        this.responseStatus = responseStatus;
    }

    @JsonProperty("data")
    private Object data;

    @JsonGetter
    public Object getData() {
        return data;
    }

    @JsonSetter
    public void setData(Object data) {
        this.data = data;
    }

    @JsonIgnore
    public String toString() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
            return mapper.writeValueAsString(this);
        }
        catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public enum ResponseStatus {
        FAILURE("FAILURE"),
        SUCCESS("SUCCESS"),
        UNDEFINED("UNDEFINED");
        String value;
        ResponseStatus(String value) {
            this.value = value;
        }
        public String getValue() {
            return value;
        }
    }
}
