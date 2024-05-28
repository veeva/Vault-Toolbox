import { Text, Box } from '@chakra-ui/react';

export default function TelemetryData({ telemetryData }) {
    const textColor = telemetryData?.responseStatus === 200 ? 'veeva_green_pasture.color_mode' : 'red.500'

    return (
        <>
            { telemetryData ?
                (
                    <>
                        { telemetryData.responseStatus && (
                            <Box {...BoxStyle}>
                                Status: <Text {...TextStyle} color={textColor}>{telemetryData.responseStatus}</Text>
                            </Box>
                        )}
                        { telemetryData.executionTimeInMS && (
                            <Box {...BoxStyle}>
                                Time: <Text {...TextStyle} color={textColor}>{telemetryData.executionTimeInMS} ms</Text>
                            </Box>
                        )}
                        { telemetryData.responseSizeInKB && (
                            <Box {...BoxStyle}>
                                Size: <Text {...TextStyle} color={textColor}>{telemetryData.responseSizeInKB} kB</Text>
                            </Box>
                        )}
                    </>
                ) : null
            }
        </>
    );
}

const BoxStyle = {
    marginRight: '10px',
    height: '42px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}

const TextStyle = {
    display: 'inline',
    marginLeft: '5px',
}
