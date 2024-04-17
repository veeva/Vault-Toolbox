import { Thead, Tr, Th } from '@chakra-ui/react';

export default function VqlTableHeader ({ consoleOutput, queryDescribe, hasSubqueries, isPicklist, isPrimaryFieldRichText, getSubqueryFieldCount, headerRowSpan, isPrimaryFieldString, isSubqueryObject }) {
    const OBJECT = 'object';

    return (
        <Thead {...ThStyle}>
            <Tr>
                { // Iterate through the first data object to get the headers (in the correct order)
                    Object.keys(consoleOutput.data[0]).map((dataKey, dataKeyCount) => {

                        // Picklists and normal field headers (including dot notation)
                        if (!isSubqueryObject(dataKey) || isPicklist(dataKey)|| isPrimaryFieldRichText(dataKey) || dataKey.includes('.') || isPrimaryFieldString(dataKey)) {
                            return <Th key={dataKeyCount} rowSpan={headerRowSpan} {...ThStyle}>{dataKey}</Th>
                        } // Subquery headers
                        else if (hasSubqueries) {
                            const subqueryFieldCount = getSubqueryFieldCount(dataKey);
                            return <Th key={dataKeyCount} colSpan={subqueryFieldCount} {...ThStyle}>{dataKey}</Th>
                        }
                    })
                }
            </Tr>
            { hasSubqueries &&
                <Tr>
                    {
                        Object.keys(consoleOutput.data[0]).map((dataKey, dataKeyCount) => {
                            if (typeof consoleOutput.data[0][dataKey] === OBJECT && !isPicklist(dataKey)) {

                                // Get subquery fields from query describe
                                return queryDescribe.subqueries.find(subquery => subquery.relationship === dataKey)?.fields.map((field, fieldCount) => {
                                    return <Th key={`${dataKeyCount}-${fieldCount}`} {...ThStyle}>{field.name}</Th>
                                })																	
                            }
                        })
                    }
                </Tr>
            }
        </Thead>
    )
}

const ThStyle = {
    color: 'white',
	backgroundColor: 'veeva_sandbox_green.500',
	textAlign: 'left',
    textTransform: 'lowercase',
    width:'1%',
    whiteSpace: 'nowrap',
    _last: {
        width: '100%'
    },
    position: 'sticky',
    top: 0,
	border: 'none',
	zIndex: 10
}