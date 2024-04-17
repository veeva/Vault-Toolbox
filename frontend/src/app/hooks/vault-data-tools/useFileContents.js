import { useState, useEffect } from 'react';
import { downloadItemContent } from '../../services/ApiService';

export default function useFileContents({ cellData }) {
    const [loading, setLoading] = useState(false);
    const [headerData, setHeaderData] = useState([]);
    const [fileData, setFileData] = useState([]);
    const [error, setError] = useState({ hasError: false, errorMessage: '' });

    /**
     * Retrieves content of the file from File Staging
     */
    const fetchFileData = async () => {
        setLoading(true);
        const fetchFileResponse = await downloadItemContent(cellData.replace(/^\//, '')); // Remove the leading / from the cellData

        if (fetchFileResponse?.responseStatus === 'FAILURE') {
            let errorString = '';
            if (fetchFileResponse?.errors?.length > 0) {
                errorString = `${fetchFileResponse.errors[0].type} : ${fetchFileResponse.errors[0].message}`
            }
            setError({ hasError: true, errorMessage: errorString});
            return;
        }

        setLoading(false);

        const responseArray = fetchFileResponse.trim().replace(/"/g, '').split('\n'); // Remove quotes and split on newlines

        const fileHeaders = responseArray[0].split(',');
        setHeaderData(fileHeaders);

        const tmpFileDataArray = new Array();
        responseArray.map((row, rowCount) => {
            if (rowCount !== 0) {
                tmpFileDataArray.push(row.split(','));
            }
        });

        if (fileHeaders.includes('document_versions')) {
            const sortColumnIndex = fileHeaders.indexOf('document_versions');
            // Sort the count data arrays by largest value
            tmpFileDataArray.sort((a, b) => b[sortColumnIndex] - a[sortColumnIndex]);
        } else if (fileHeaders.includes('record_count')) {
            const sortColumnIndex = fileHeaders.indexOf('record_count');
            // Sort the count data arrays by largest value
            tmpFileDataArray.sort((a, b) => b[sortColumnIndex] - a[sortColumnIndex]);
        }
        setFileData(tmpFileDataArray);
    };

    useEffect(() => {
        fetchFileData();
    }, [cellData]);

    return { 
        loading, 
        headerData,
        fileData,
        error
    }
}
