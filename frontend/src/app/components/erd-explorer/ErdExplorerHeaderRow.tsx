import { Button, ButtonGroup, Flex, FlexProps, Heading, HeadingProps, HStack, IconButton, Spacer } from '@chakra-ui/react';
import { PiCaretDownBold } from 'react-icons/pi';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '../shared/ui-components/menu';

interface ErdExplorerHeaderRowProps {
    hasNodes: boolean;
    exportProject: () => void;
    exportPng: () => void;
    exportSvg: () => void;
    exportMarkdown: () => void;
    onImport: () => void;
}

/** ERD Explorer header: title + Export split button + Import. */
export default function ErdExplorerHeaderRow({
    hasNodes,
    exportProject,
    exportPng,
    exportSvg,
    exportMarkdown,
    onImport,
}: ErdExplorerHeaderRowProps) {
    return (
        <Flex {...HeaderRowFlexStyle}>
            <Heading {...HeaderTitleStyle}>ERD Explorer</Heading>
            <Spacer />

            <HStack gap='5px' marginRight='10px'>
                {/* Export split button — click exports Project (JSON), caret opens other formats */}
                <ButtonGroup attached {...ExportButtonGroupStyle}>
                    <Button onClick={exportProject} disabled={!hasNodes} aria-label='Export project as JSON' {...ExportButtonStyle}>
                        Export
                    </Button>
                    <MenuRoot>
                        <MenuTrigger asChild disabled={!hasNodes}>
                            <IconButton aria-label='More export formats' disabled={!hasNodes} {...ExportMenuButtonStyle}>
                                <PiCaretDownBold />
                            </IconButton>
                        </MenuTrigger>
                        <MenuContent>
                            <MenuItem value='png' {...ExportMenuItemStyle} onClick={exportPng}>
                                PNG Image
                            </MenuItem>
                            <MenuItem value='svg' {...ExportMenuItemStyle} onClick={exportSvg}>
                                SVG Image
                            </MenuItem>
                            <MenuItem value='markdown' {...ExportMenuItemStyle} onClick={exportMarkdown}>
                                Mermaid Markdown
                            </MenuItem>
                        </MenuContent>
                    </MenuRoot>
                </ButtonGroup>

                {/* Import — red solid button */}
                <Button onClick={onImport} aria-label='Import project' {...ImportButtonStyle}>
                    Import
                </Button>
            </HStack>
        </Flex>
    );
}

const HeaderRowFlexStyle: FlexProps = {
    width: '100%',
    margin: '10px',
    paddingLeft: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
};

const HeaderTitleStyle: HeadingProps = {
    fontSize: '2rem',
    color: 'veeva_orange_color_mode',
    marginLeft: '10px',
    marginRight: '5px',
    minWidth: 'max-content',
};

const ExportButtonGroupStyle = {
    variant: 'solid',
    colorPalette: 'veeva_twilight_blue',
    borderRadius: '8px',
    minWidth: '120px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)',
} as const;

const ExportButtonStyle = {
    backgroundColor: 'veeva_twilight_blue.500',
    color: 'white',
    _hover: { backgroundColor: 'veeva_twilight_blue.fifty_percent_opacity' },
    _active: { backgroundColor: 'veeva_twilight_blue.eighty_percent_opacity' },
    borderRightColor: 'white_color_mode',
    fontSize: 'lg',
    borderRadius: '8px',
    borderRight: 'solid',
    borderRightWidth: 'thin',
    flex: 1,
} as const;

const ExportMenuButtonStyle = {
    backgroundColor: 'veeva_twilight_blue.500',
    color: 'white',
    _hover: { backgroundColor: 'veeva_twilight_blue.fifty_percent_opacity' },
    _active: { backgroundColor: 'veeva_twilight_blue.eighty_percent_opacity' },
    minWidth: 8,
    borderRadius: '8px',
    borderTopLeftRadius: '0px',
    borderBottomLeftRadius: '0px',
} as const;

const ExportMenuItemStyle = {
    fontSize: 'medium',
    _hover: { backgroundColor: 'veeva_twilight_blue.500', color: 'white' },
} as const;

const ImportButtonStyle = {
    backgroundColor: 'veeva_sunset_red_color_mode',
    color: 'white',
    _hover: { backgroundColor: 'veeva_sunset_red.fifty_percent_opacity' },
    fontSize: 'lg',
    borderRadius: '8px',
    minWidth: '120px',
    boxShadow: '0 0 5px rgba(0,0,0,0.25)',
} as const;
