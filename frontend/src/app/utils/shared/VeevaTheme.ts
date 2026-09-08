import { createSystem, defaultConfig } from '@chakra-ui/react';

/**
 * Extend the default Chakra theme with custom styling and Veeva colors.
 */
export default createSystem(defaultConfig, {
    theme: {
        tokens: {
            colors: {
                veeva_dark_gray: {
                    500: { value: '#636669' },
                },
                veeva_light_gray: {
                    100: { value: '#f5f5f5' },
                    500: { value: '#bbbbbc' },
                },
                veeva_sunshine_yellow: { 500: { value: '#fbd913' } },
                veeva_sunset_yellow: {
                    500: { value: '#FDB913' },
                },
                veeva_sunset_red: {
                    500: { value: '#db6015' },
                    fifty_percent_opacity: { value: 'rgb(219, 96, 21, 0.5)' },
                    eighty_percent_opacity: { value: 'rgb(219, 96, 21, 0.5)' },
                },
                veeva_orange: {
                    500: { value: '#f7981d' },
                },
                veeva_twilight_blue: {
                    500: { value: '#1A76A3' },
                    fifty_percent_opacity: { value: 'rgb(26, 118, 163, 0.5)' },
                    eighty_percent_opacity: { value: 'rgb(26, 118, 163, 0.8)' },
                },
                veeva_midnight_indigo: {
                    200: { value: '#c0c6d0' },
                    500: { value: '#1b2f54' },
                },
                veeva_sandbox_green: { 500: { value: '#316525' } },
                veeva_green_pasture: {
                    500: { value: '#2F855A' },
                    fifty_percent_opacity: { value: 'rgb(47, 133, 90, 0.5)' },
                },
                veeva_dark_base_shaded: {
                    500: { value: '#2E3135' },
                },
                light_gray: {
                    100: { value: '#e0dede' },
                    500: { value: '#898a8d' },
                },
                beige: {
                    100: { value: '#fff2dc' },
                },
                yellow: {
                    100: { value: '#fffff4bf' },
                },
            },
        },
        semanticTokens: {
            colors: {
                veeva_orange_color_mode: {
                    value: {
                        base: '{colors.veeva_orange.500}',
                        _dark: '#FFAC41',
                    },
                },
                veeva_light_gray_color_mode: {
                    value: {
                        base: '{colors.veeva_light_gray.100}',
                        _dark: '#44444B',
                    },
                },
                veeva_dark_gray_text_color_mode: {
                    value: {
                        base: '{colors.veeva_dark_gray.500}',
                        _dark: 'white',
                    },
                },
                dimmed_text_color_mode: {
                    value: {
                        base: '{colors.light_gray.500}',
                        _dark: '{colors.veeva_dark_gray.500}',
                    },
                },
                veeva_sunset_yellow: {
                    five_percent_opacity: {
                        value: {
                            base: 'rgb(253, 185, 19, 0.05)',
                            _dark: '{colors.veeva_dark_base_shaded.500}',
                        },
                    },
                    ten_percent_opacity: {
                        value: {
                            base: 'rgb(253, 185, 19, 0.1)',
                            _dark: '{colors.veeva_dark_base_shaded.500}',
                        },
                    },
                },
                veeva_sunset_red_color_mode: {
                    value: {
                        base: '{colors.veeva_sunset_red.500}',
                        _dark: '#FF7927',
                    },
                },
                veeva_green_pasture_color_mode: {
                    value: {
                        base: '{colors.veeva_green_pasture.500}',
                        _dark: '#8EB88B',
                    },
                },
                white_color_mode: {
                    value: {
                        base: 'white',
                        _dark: '#303841',
                    },
                },
                hyperlink_blue_color_mode: {
                    value: {
                        base: '#0000EE',
                        _dark: '#478be6',
                    },
                },
                gray_background_color_mode: {
                    value: {
                        base: '{colors.gray.200}',
                        _dark: '{colors.veeva_dark_gray.500}',
                    },
                },
                blue_color_mode: {
                    value: {
                        base: '{colors.blue.500}',
                        _dark: '{colors.blue.200}',
                    },
                },
                light_gray_color_mode: {
                    value: {
                        base: '{colors.light_gray.100}',
                        _dark: '#6c6c7a',
                    },
                },
                beige_color_mode: {
                    value: {
                        base: '{colors.beige.100}',
                        _dark: '#2a2a2a',
                    },
                },
                workflow_log_card_hover_color_mode: {
                    value: {
                        base: '#fff9ee',
                        _dark: '#3b4654',
                    },
                },
                error_background_color_mode: {
                    value: {
                        base: '{colors.red.100}',
                        _dark: '#3d2224',
                    },
                },
                error_background_hover_color_mode: {
                    value: {
                        base: '#fbd0cb',
                        _dark: '#48292b',
                    },
                },
                yellow_color_mode: {
                    value: {
                        base: '{colors.yellow.100}',
                        _dark: '#44444B',
                    },
                },
                legacy_alert_background_color_mode: {
                    value: {
                        base: '{colors.blue.100}',
                        _dark: '#90cdf429',
                    },
                },
                selection_background_color_mode: {
                    value: {
                        base: '{colors.light_gray.100}',
                        _dark: '{colors.light_gray.500}',
                    },
                },
            },
        },
    },
    globalCss: {
        'html, body': {
            bg: 'white_color_mode',
        },
        '*::selection': {
            bg: 'selection_background_color_mode',
        },
    },
});
