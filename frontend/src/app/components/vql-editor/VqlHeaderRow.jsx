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
    color: 'veeva_orange.color_mode',
    minWidth: 'max-content',
    marginLeft: '25px',
    marginRight: '5px',
    fontSize: '2rem'
};

const RunVqlButtonStyle = {
    backgroundColor: 'veeva_twilight_blue.500',
    color: 'white',
    _hover: {
        backgroundColor: 'veeva_twilight_blue.fifty_percent_opacity'
    },
    marginRight: '5px',
    width: '180px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)'
};

const DownloadCsvButtonStyle = {
    backgroundColor: 'veeva_green_pasture.500',
    color: 'white',
    _hover: {
        backgroundColor: 'veeva_green_pasture.fifty_percent_opacity'
    },
    marginRight: '10px',
    width: '180px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)'
};
