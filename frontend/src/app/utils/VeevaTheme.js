import { extendTheme } from '@chakra-ui/react';

/**
 * Extend the default Chakra theme with custom styling and Veeva colors.
 */
export const veevaTheme = extendTheme({
    colors: {
        veeva_dark_gray: { 500: '#636669' },
        veeva_medium_gray: { 500: '#898a8d' },
        veeva_light_gray: {
            100: '#f5f5f5',
            500: '#bbbbbc'
        },
        veeva_sunshine_yellow: { 500: '#fbd913' },
        veeva_sunset_yellow: {
            500: '#FDB913',
            five_percent_opacity: 'rgb(253, 185, 19, 0.05)',
            ten_percent_opacity: 'rgb(253, 185, 19, 0.1)'
        },
        veeva_sunset_red: { 
            500: '#db6015',
            fifty_percent_opacity: 'rgb(219, 96, 21, 0.5)',
            eighty_percent_opacity: 'rgb(219, 96, 21, 0.5)'
        },
        veeva_orange: { 500: '#f7981d' },
        veeva_twighlight_blue: { 
            500: '#1A76A3' ,
            fifty_percent_opacity: 'rgb(26, 118, 163, 0.5)',
            eighty_percent_opacity: 'rgb(26, 118, 163, 0.8)'
        },
        veeva_midnight_indigo: { 500: '#1b2f54' },
        veeva_sandbox_green: { 500: '#316525' },
        veeva_green_pasture: { 500: '#2F855A' }
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