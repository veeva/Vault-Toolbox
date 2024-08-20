import { Box, Flex, Heading, Spacer } from '@chakra-ui/react';
import CustomSelect from '../../shared/CustomSelect';

export default function QueryTargetSelector() {
    // Will move to helper file when other targets are introduced
    const queryTargetOptions = [{ value: 'Objects', label: 'Objects' }];

    return (
        <Flex align='center' marginX='5px'>
            <Box minWidth='75px' marginRight='5px'>
                <Heading size='xs'>Target:</Heading>
            </Box>
            <Box width='100%'>
                <CustomSelect
                    options={queryTargetOptions}
                    value={queryTargetOptions[0]}
                />
            </Box>
            <Spacer/>
        </Flex>
    );
}
