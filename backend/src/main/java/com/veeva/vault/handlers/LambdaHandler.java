/*---------------------------------------------------------------------
 *	Copyright (c) 2024 Veeva Systems Inc.  All Rights Reserved.
 *	This code is based on pre-existing content developed and
 *	owned by Veeva Systems Inc. and may only be used in connection
 *	with the deliverable with which it was provided to Customer.
 *---------------------------------------------------------------------
 */

package com.veeva.vault.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import com.amazonaws.services.lambda.model.InvocationType;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.veeva.vault.Environment;
import com.veeva.vault.models.IntegrationRequest;
import com.veeva.vault.models.IntegrationRequestBodyParams;
import com.veeva.vault.models.IntegrationResponse;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;

public class LambdaHandler implements RequestHandler<IntegrationRequest, IntegrationResponse> {
    public LambdaHandler() { logger.setLevel(Level.toLevel(Environment.getLogLevel())); }
    private static final Logger logger = Logger.getLogger(LambdaHandler.class);
    private static String lambdaFunctionARN;

    /**
     * Request method called by AWS Lambda service
     * @param integrationRequest - integration request
     * @param context - AWS Lambda context object
     * @return - response for the integration call
     */
    public IntegrationResponse handleRequest(IntegrationRequest integrationRequest, Context context) {
        lambdaFunctionARN = context.getInvokedFunctionArn();

        IntegrationHandler integrationHandler = new IntegrationHandler(integrationRequest);
        return integrationHandler.process();
    }

    /**
     * Runs a job asynchronously by invoking the current AWS Lambda function
     * @param request - integration request to be run async
     * @param jobId - ID for the async job
     */
    public static void runAsync(IntegrationRequest request, String jobId) {
        IntegrationRequestBodyParams newBodyParameters = request.getBodyParams();

        newBodyParameters.setIsAsync(false);
        newBodyParameters.setLambdaJobId(jobId);

        request.setBody(newBodyParameters.toJsonString());
        InvokeRequest lmbRequest = new InvokeRequest()
                .withFunctionName(lambdaFunctionARN)
                .withPayload(request.toJsonString());

        lmbRequest.setInvocationType(InvocationType.Event);

        AWSLambda lambda = AWSLambdaClientBuilder.standard()
                .build();

        InvokeResult lmbResult = lambda.invoke(lmbRequest);
    }
}
