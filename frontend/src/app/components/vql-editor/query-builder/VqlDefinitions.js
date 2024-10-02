export default function VqlDefinitions() {

    const defaultOperators = ['=', '!=', '<', '>', '<=', '>=', 'CONTAINS', 'LIKE', 'IS NULL', 'IS NOT NULL'];
    const booleanValues = ['true', 'false'];

    const attachmentsQueryTarget = {
        queryTarget: 'attachments__sysr',
        objectAttachmentFields: [
            {
                field: 'attachment_id__sys',
                label: 'ID',
                fieldType: 'ID'
            },
            {
                field: 'attachment_version__sys',
                label: 'Version',
                fieldType: 'Number'
            },
            {
                field: 'attachment_name__sys',
                label: 'Name',
                fieldType: 'String'
            },
            {
                field: 'file_name__sys',
                label: 'File Name',
                fieldType: 'String'
            },
            {
                field: 'description__sys',
                label: 'Description',
                fieldType: 'String'
            },
            {
                field: 'md5checksum__sys',
                label: 'MD5 Checksum',
                fieldType: 'String'
            },
            {
                field: 'latest_version__sys',
                label: 'Latest Version',
                fieldType: 'Number'
            },
            {
                field: 'modified_date__sys',
                label: 'Modified Date',
                fieldType: 'DateTime'
            },
            {
                field: 'modified_by__sys',
                label: 'Modified By',
                fieldType: 'Object'
            },
            {
                field: 'created_date__sys',
                label: 'Created Date',
                fieldType: 'DateTime'
            },
            {
                field: 'created_by__sys',
                label: 'Created By',
                fieldType: 'Object'
            },
            {
                field: 'format__sys',
                label: 'Format',
                fieldType: 'String'
            },
            {
                field: 'size__sys',
                label: 'Size',
                fieldType: 'Number'
            }
        ]
    }

    return {
        defaultOperators,
        booleanValues,
        attachmentsQueryTarget,
    }
}