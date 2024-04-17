import { Flex, Heading, Button, Spacer, Box } from '@chakra-ui/react';

export default function VqlHeaderRow({ submitVqlQuery, downloadQueryResults, isDownloading, isExecutingQuery, canDownload }) {

    return (
        <Flex {...ParentFlexStyle}>
            <Heading {...HeadingStyle}>VQL Editor</Heading>
            <Spacer />
            <Box>
                <Button onClick={submitVqlQuery} isLoading={isExecutingQuery} {...RunVqlButtonStyle}>
                    Run VQL
                </Button>
                <Button onClick={downloadQueryResults} isLoading={isDownloading} isDisabled={!canDownload()} {...DownloadCsvButtonStyle}>
                    Download CSV
                </Button>
            </Box>
        </Flex>
    );
}

const ParentFlexStyle = {
    width: '100%',
    margin: '10px',
    alignItems: 'center'
};

const HeadingStyle = {
    color: 'veeva_orange.500',
    minWidth: 'max-content',
    marginLeft: '25px',
    marginRight: '5px',
    fontSize: '2rem'
};

const RunVqlButtonStyle = {
    colorScheme: 'veeva_twighlight_blue',
    marginRight: '5px',
    width: '180px'
};

const DownloadCsvButtonStyle = {
    colorScheme: 'veeva_green_pasture',
    marginRight: '10px',
    width: '180px'
};
