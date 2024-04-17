import { Tbody, Tr, Td, Box } from "@chakra-ui/react";
import { Fragment } from "react";

export default function VqlTableBody({ consoleOutput, getMaxRowSize }) {
    const OBJECT = 'object';

    return (
        <Tbody>
            {consoleOutput?.data &&
                consoleOutput.data.map((row, i) => {
                    const maxRowSize = getMaxRowSize(row);
                    return (
                        <Fragment key={i}>
                            <Tr key={i}>
                                {
                                    Object.keys(row).map((dataRowKey, dataRowKeyCount) => {
                                        const dataRowValue = row[dataRowKey];
                                        if (typeof dataRowValue === OBJECT && dataRowValue !== null) {

                                            // We either have subqueries or picklist results
                                            if (dataRowValue?.data?.length > 0) {
                                                return dataRowValue?.data.map((subqueryDataRow, subqueryDataRowCount) => {
                                                    if (subqueryDataRowCount === 0) { // Only print the first row of subquery data in this Tr

                                                        return Object.values(subqueryDataRow).map((subqueryDataField, subqueryDataFieldCount) => {
                                                            // Join picklist values with a comma
                                                            if (Array.isArray(subqueryDataField)) {
                                                                return <Td key={subqueryDataFieldCount} {...TdStyle}>{subqueryDataField.join(', ')}</Td>
                                                            }
                                                            return <Td key={subqueryDataFieldCount}{...TdStyle}>{String(subqueryDataField)}</Td>
                                                        })
                                                    }
                                                })
                                            } else if (dataRowValue?.length > 0) { // Join picklist values with a comma
                                                return <Td key={dataRowKeyCount} {...TdStyle}>{dataRowValue.join(', ')}</Td>
                                            } else {
                                                const subqueryFieldCount = consoleOutput.queryDescribe.subqueries.find(currentSubquery => currentSubquery.relationship === dataRowKey)?.fields.length;

                                                return Array.from({ length: subqueryFieldCount }, (_, index) => (
                                                    <Td key={`${dataRowKeyCount}-${index}`} {...TdStyle}></Td>
                                                ));
                                            }
                                        } else {
                                            // Convert dataRowValue to a String before displaying, so booleans are displayed properly
                                            return <Td key={dataRowKeyCount} rowSpan={maxRowSize} {...TdStyle}><Box {...FloatingCellBoxStyle}>{String(dataRowValue)}</Box></Td>
                                        }
                                    })
                                }
                            </Tr>
                            {maxRowSize > 1 &&
                                [...Array(maxRowSize - 1)].map((_, index) => { // Loop over the number of subquery rows remaining in this overall row
                                    return (
                                        <Tr key={`${i}-${index}`}>
                                            {
                                                Object.keys(row).map((dataRowKey, dataRowKeyCount) => {

                                                    const dataRowValue = row[dataRowKey];

                                                    if (typeof dataRowValue === OBJECT && dataRowValue !== null) {
                                                        const subqueryDataRow = dataRowValue?.data?.length > 1 ? dataRowValue.data[index + 1] : null;

                                                        if (subqueryDataRow) {
                                                            return Object.values(subqueryDataRow).map((subqueryDataField, subqueryDataFieldCount) => {
                                                                // Join picklist values with a comma
                                                                if (Array.isArray(subqueryDataField)) {
                                                                    return <Td key={subqueryDataFieldCount} {...TdStyle}>{subqueryDataField.join(', ')}</Td>
                                                                }
                                                                return <Td key={subqueryDataFieldCount} {...TdStyle}>{String(subqueryDataField)}</Td>
                                                            });
                                                        } else if (dataRowValue?.length > 0) { // Create empty cells for picklists we've finished displaying
                                                            return <Td key={index}{...TdStyle}>{ }</Td>
                                                        } else {
                                                            const subqueryFieldCount = consoleOutput.queryDescribe.subqueries.find(currentSubquery => currentSubquery.relationship === dataRowKey)?.fields.length;
                                                            return Array.from({ length: subqueryFieldCount }, (_, index) => (
                                                                <Td key={`${dataRowKeyCount}-${index}`} {...TdStyle}></Td>
                                                            ));
                                                        }
                                                    }
                                                })
                                            }
                                        </Tr>)
                                })
                            }
                        </Fragment>
                    )
                })
            }
        </Tbody>
    )
}

const TdStyle = {
    borderBottom: 'solid thin',
    borderColor: 'gray.300',
    verticalAlign: 'top',
    backgroundColor: 'veeva_sunset_yellow.five_percent_opacity'
}

const FloatingCellBoxStyle = {
    verticalAlign: 'top',
    position: 'sticky',
    top: '100px'
}