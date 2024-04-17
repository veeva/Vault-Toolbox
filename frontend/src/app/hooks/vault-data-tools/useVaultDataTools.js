import { useToast } from '@chakra-ui/react';
import { invokeAwsLambdaFunction } from '../../services/ApiService';
import { useState } from 'react';

export default function useVaultDataTools() {
    const toast = useToast({ containerStyle: { fontSize: 'lg' } });

    const [dataType, setDataType] = useState('ALL');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [submittingCountJob, setSubmittingCountJob] = useState(false);
    const [submittingDeleteJob, setSubmittingDeleteJob] = useState(false);

    /**
     * Initiates a Count Data job via the AWS Lambda backend
     */
    const countData = async () => {
        const params = {
            dataType,
            dataTypeSelections: selectedOptions.toString(),
            isAsync: true,
            tool: 'VAULT_DATA_TOOLS',
            action: 'COUNT_DATA'
        };

        setSubmittingCountJob(true);
        const response = await invokeAwsLambdaFunction(params);
        setSubmittingCountJob(false);

        if (response?.responseStatus === 'SUCCESS') {
            toast({
                title: 'Count Data Job Submitted',
                description: 'Upon completion, results will appear in the table below.',
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        } else {
            toast({
                title: 'Count Data Job Submission Failed',
                description: response?.errors[0]?.message,
                status: 'error',
                duration: 10000,
                isClosable: true,
                position: 'top'
            });
        }
    };

    /**
     * Initiates a Delete Data job via the AWS Lambda backend
     */
    const deleteData = async () => {
        const params = {
            dataType,
            dataTypeSelections: selectedOptions.toString(),
            isAsync: true,
            tool: 'VAULT_DATA_TOOLS',
            action: 'DELETE_DATA'
        };

        setSubmittingDeleteJob(true);
        const response = await invokeAwsLambdaFunction(params);
        setSubmittingDeleteJob(false);

        if (response?.responseStatus === 'SUCCESS') {
            toast({
                title: 'Delete Data Job Submitted',
                description: 'Upon completion, results will appear in the table below.',
                status: 'success',
                duration: 3000,
                isClosable: true,
                position: 'top'
            });
        } else {
            toast({
                title: 'Delete Data Job Submission Failed',
                description: response?.errors[0]?.message,
                status: 'error',
                duration: 10000,
                isClosable: true,
                position: 'top'
            });
        }
    };

    return { 
        countData, 
        deleteData,
        dataType,
        setDataType,
        selectedOptions,
        setSelectedOptions,
        submittingCountJob,
        setSubmittingCountJob,
        submittingDeleteJob,
        setSubmittingDeleteJob 
    }
}
