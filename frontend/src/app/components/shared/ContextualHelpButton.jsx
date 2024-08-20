import { Tooltip, Link, IconButton } from '@chakra-ui/react';
import { PiQuestion } from 'react-icons/pi';

export default function ContextualHelpButton({ tooltip, url }) {

    return (
            <Tooltip label={tooltip} placement='left'>
                <Link href={url} isExternal>
                    <IconButton
                        icon={<PiQuestion size={24} />}
                        isRound={true}
                        aria-label='Help button'
                        {...IconButtonStyle}
                    />
                </Link>
            </Tooltip>
    );
}

const IconButtonStyle = {
    marginBottom: '10px',
    variant: 'ghost'
}
