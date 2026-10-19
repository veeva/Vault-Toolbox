import { Fragment } from 'react';
import { Box, Button, ColorPicker, Flex, HStack, Link, Portal, Switch, Text, VStack, parseColor } from '@chakra-ui/react';
import { PiArrowSquareOutLight } from 'react-icons/pi';
import type { ViewSettings, ViewSettingKey, ErdEdgeColors, EdgeColorKey } from '../../../hooks/erd-explorer/erdReducer';
import ViewSettingLabel from './ViewSettingLabel';

interface ViewSettingsTabProps {
    viewSettings: ViewSettings;
    setViewSetting: (key: ViewSettingKey, value: boolean) => void;
    edgeColors: ErdEdgeColors;
    setEdgeColor: (key: EdgeColorKey, value: string) => void;
    onRestoreDefaults: () => void;
}

const VISUAL_TOGGLES: { key: ViewSettingKey; label: string; help: string }[] = [
    { key: 'colorCodeEdges', label: 'Color-coded relationships', help: 'Color relationship lines by type.' },
    { key: 'showLegend', label: 'Legend', help: 'Display the relationship color legend on the canvas.' },
    { key: 'showRelationshipLineLabels', label: 'Relationship line labels', help: 'Display relationship type information on each relationship line.' },
    { key: 'showSourceBadges', label: 'Object source badges', help: 'Display object source (System/Standard/Custom/Application) on each object.' },
    { key: 'hideSimpleJoinObjects', label: 'Hide simple joins', help: 'Collapse simple join objects into a single relationship between their two parents.' },
    { key: 'hideComplexJoinObjects', label: 'Hide complex joins', help: 'Collapse complex join objects into a single relationship between their two parents.' },
];

/** View settings: visual toggles + colours, and layout actions. Exports live in the header. */
export default function ViewSettingsTab({
    viewSettings,
    setViewSetting,
    edgeColors,
    setEdgeColor,
    onRestoreDefaults,
}: ViewSettingsTabProps) {
    return (
        <VStack align='stretch' gap={0} height='100%' overflow='hidden'>
            <Flex {...TabTitleStyle}>
                <Text fontSize='xl' fontWeight='bold' color='veeva_orange_color_mode'>View Settings</Text>
            </Flex>
            <VStack align='stretch' gap='14px' flex={1} padding='16px' overflowY='auto'>
                {VISUAL_TOGGLES
                    // The legend only means anything when relationships are colour-coded, so hide its toggle
                    // (and, elsewhere, the legend itself) when colour-coding is off.
                    .filter((toggle) => toggle.key !== 'showLegend' || viewSettings.colorCodeEdges)
                    .map((toggle) => (
                        <Fragment key={toggle.key}>
                            <ToggleRow
                                label={toggle.label}
                                help={toggle.help}
                                value={viewSettings[toggle.key]}
                                onToggle={() => setViewSetting(toggle.key, !viewSettings[toggle.key])}
                            />
                            {/* Colour pickers sit right under the Legend toggle. */}
                            {toggle.key === 'showLegend' && viewSettings.colorCodeEdges && (
                                <>
                                    <ColorRow
                                        label='Reference color'
                                        textBeforeLink='Color used for '
                                        linkText='object reference relationship'
                                        textAfterLink=' lines.'
                                        infoUrl='https://platform.veevavault.help/en/gr/28740/#object-reference'
                                        value={edgeColors.reference}
                                        onChange={(value) => setEdgeColor('reference', value)}
                                    />
                                    <ColorRow
                                        label='Parent-child color'
                                        textBeforeLink='Color used for '
                                        linkText='parent-child relationship'
                                        textAfterLink=' lines.'
                                        infoUrl='https://platform.veevavault.help/en/gr/28740/#parent-child-relationships'
                                        value={edgeColors.parentChild}
                                        onChange={(value) => setEdgeColor('parentChild', value)}
                                    />
                                </>
                            )}
                            {/* Hidden joins are collapsed into a single coloured edge, so the colour only matters once hidden. */}
                            {toggle.key === 'hideSimpleJoinObjects' && viewSettings.hideSimpleJoinObjects && viewSettings.colorCodeEdges && (
                                <ColorRow
                                    label='Simple join color'
                                    textBeforeLink='Color used for the merged '
                                    linkText='simple join relationship'
                                    textAfterLink=' line.'
                                    infoUrl='https://platform.veevavault.help/en/gr/28740/#simple-relationship'
                                    value={edgeColors.simpleJoin}
                                    onChange={(value) => setEdgeColor('simpleJoin', value)}
                                />
                            )}
                            {toggle.key === 'hideComplexJoinObjects' && viewSettings.hideComplexJoinObjects && viewSettings.colorCodeEdges && (
                                <ColorRow
                                    label='Complex join color'
                                    textBeforeLink='Color used for the merged '
                                    linkText='complex join relationship'
                                    textAfterLink=' line.'
                                    infoUrl='https://platform.veevavault.help/en/gr/28740/#complex-relationship'
                                    value={edgeColors.complexJoin}
                                    onChange={(value) => setEdgeColor('complexJoin', value)}
                                />
                            )}
                        </Fragment>
                    ))}
                <Button
                    size='xs'
                    variant='outline'
                    alignSelf='start'
                    borderColor='light_gray_color_mode'
                    onClick={onRestoreDefaults}
                >
                    Restore defaults
                </Button>
            </VStack>
        </VStack>
    );
}

const TabTitleStyle = {
    borderBottom: 'solid 3px',
    borderBottomColor: 'gray.400',
    padding: '8px 12px',
    width: '100%',
};

/** A labelled Chakra colour picker (used for the customizable relationship colours). */
function ColorRow({
    label,
    textBeforeLink,
    linkText,
    textAfterLink,
    infoUrl,
    value,
    onChange,
}: {
    label: string;
    textBeforeLink: string;
    linkText: string;
    textAfterLink: string;
    infoUrl: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <HStack justify='space-between' gap={2}>
            <ViewSettingLabel
                label={label}
                helpText={`${textBeforeLink}${linkText}${textAfterLink}`}
                help={
                    <>
                        {textBeforeLink}
                        <Link
                            href={infoUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            color='hyperlink_blue_color_mode'
                            textDecoration='underline'
                        >
                            {linkText}
                            <Box as={PiArrowSquareOutLight} display='inline' />
                        </Link>
                        {textAfterLink}
                    </>
                }
            />
            <ColorPicker.Root
                size='xs'
                value={parseColor(value)}
                onValueChange={(details) => onChange(details.value.toString('hex'))}
            >
                <ColorPicker.HiddenInput />
                <ColorPicker.Control>
                    <ColorPicker.Trigger
                        aria-label={label}
                        height='6'
                        minWidth='48px'
                        justifyContent='center'
                        paddingX='1'
                        borderColor='light_gray_color_mode'
                    >
                        <ColorPicker.ValueSwatch boxSize='5' borderRadius='sm' />
                    </ColorPicker.Trigger>
                </ColorPicker.Control>
                <Portal>
                    <ColorPicker.Positioner>
                        <ColorPicker.Content>
                            <ColorPicker.Area />
                            <HStack>
                                <ColorPicker.EyeDropper size='xs' variant='outline' />
                                <ColorPicker.Sliders />
                            </HStack>
                            <ColorPicker.ChannelInput channel='hex' />
                        </ColorPicker.Content>
                    </ColorPicker.Positioner>
                </Portal>
            </ColorPicker.Root>
        </HStack>
    );
}

function ToggleRow({ label, help, value, onToggle }: { label: string; help: string; value: boolean; onToggle: () => void }) {
    return (
        <HStack justify='space-between' gap={2}>
            <ViewSettingLabel label={label} help={help} helpText={help} />
            <Switch.Root size='lg' colorPalette='green' flexShrink={0} checked={value} onCheckedChange={onToggle}>
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
            </Switch.Root>
        </HStack>
    );
}
