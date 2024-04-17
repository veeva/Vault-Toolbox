/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.models;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;

public class IntegrationResponse extends ResponseModel {
    @JsonProperty("jobId")
    private String jobId;

    @JsonGetter
    public String getJobId() {
        return jobId;
    }

    @JsonSetter
    public void setJobId(String jobId) {
        this.jobId = jobId;
    }
}
