import { extendTheme } from '@chakra-ui/react';

/**
 * Extend the default Chakra theme with custom styling and Veeva colors.
 */
export const veevaTheme = extendTheme({
    styles: {
        global: (props) => ({
            'html, body': {
                backgroundColor: 'white.color_mode'
            }
        })
    },
    semanticTokens: {
        colors: {
            veeva_dark_gray: {
                text: {
                    color_mode: { // Define different color mode for dark gray text elements
                        default: 'veeva_dark_gray.500',
                        _dark: 'white'
                    }
                },
                500: '#636669'
            },
            veeva_medium_gray: { 500: '#898a8d' },
            veeva_light_gray: {
                color_mode: {
                    default: 'veeva_light_gray.100',
                    _dark: '#44444B'
                },
                100: '#f5f5f5',
                500: '#bbbbbc'
            },
            veeva_sunshine_yellow: { 500: '#fbd913' },
            veeva_sunset_yellow: {
                500: '#FDB913',
                five_percent_opacity: {
                    default: 'rgb(253, 185, 19, 0.05)',
                    _dark: 'veeva_dark_base_shaded.500'
                },
                ten_percent_opacity: {
                    default: 'rgb(253, 185, 19, 0.1)',
                    _dark: 'veeva_dark_base_shaded.500'
                }
            },
            veeva_sunset_red: {
                color_mode: {
                    default: 'veeva_sunset_red.500',
                    _dark: '#FF7927'
                },
                500: '#db6015',
                fifty_percent_opacity: 'rgb(219, 96, 21, 0.5)',
                eighty_percent_opacity: 'rgb(219, 96, 21, 0.5)'
            },
            veeva_orange: {
                color_mode: {
                    default: 'veeva_orange.500',
                    _dark: '#FFAC41'
                },
                500: '#f7981d'
            },
            veeva_twilight_blue: {
                500: '#1A76A3' ,
                fifty_percent_opacity: 'rgb(26, 118, 163, 0.5)',
                eighty_percent_opacity: 'rgb(26, 118, 163, 0.8)'
            },
            veeva_midnight_indigo: {
                200: '#c0c6d0',
                500: '#1b2f54'
            },
            veeva_sandbox_green: { 500: '#316525' },
            veeva_green_pasture: {
                color_mode: {
                    default: 'veeva_green_pasture.500',
                    _dark: '#8EB88B'
                },
                500: '#2F855A',
                fifty_percent_opacity: 'rgb(47, 133, 90, 0.5)',
            },
            veeva_dark_base_shaded: {
                500: '#2E3135'
            },
            hyperlink_blue: {
                color_mode: {
                    default: '#0000EE',
                    _dark: '#478be6'
                }
            },
            gray: {
                background: {
                    color_mode: {
                        default: 'gray.200',
                        _dark: '#636669',
                    }
                }
            },
            white: {
                color_mode: {
                    default: 'white',
                    _dark: '#303841'
                },
            },
            blue: {
                color_mode: {
                    default: 'blue.500',
                    _dark: 'blue.200',
                }
            },
            text: {
                color_mode: {
                    default: 'black',
                    _dark: 'white'
                }
            }
        }
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'medium',
                borderRadius: '8px'
            },
            sizes: { md: { fontSize: '20px' } }
        }
    }
});