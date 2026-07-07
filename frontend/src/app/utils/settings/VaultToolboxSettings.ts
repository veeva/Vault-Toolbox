export const MAX_FAVORITE_TOOLS = 10;

export interface FeatureSettings {
    showVaultAdminLinks?: boolean; // Used in Data Navigator
    showFileStaging?: boolean; // Used in File Browser
    showDirectData?: boolean; // Used in File Browser
}

interface BasePageSettings {
    enabled: boolean;
    favorite?: boolean;
    displayOrder?: number;
    featureSettings?: FeatureSettings;
}

export type VaultToolboxSettings = Record<string, BasePageSettings>;

export const defaultSettings: VaultToolboxSettings = {
    componentEditor: {
        enabled: true,
        favorite: true,
        displayOrder: 1,
    },
    vqlEditor: {
        enabled: true,
        favorite: true,
        displayOrder: 2,
    },
    dataTools: {
        enabled: true,
        favorite: true,
        displayOrder: 3,
    },
    fileBrowser: {
        enabled: true,
        favorite: true,
        displayOrder: 4,
        featureSettings: {
            showFileStaging: true,
            showDirectData: true,
        },
    },
    dataNavigator: {
        enabled: true,
        favorite: true,
        displayOrder: 5,
        featureSettings: {
            showVaultAdminLinks: true,
        },
    },
    workflowActivityLogInspector: {
        enabled: true,
    },
};

interface SettingsMetadataItem {
    label: string;
    infoText: string;
}

type PageSettingsMetadataType = {
    componentEditor: SettingsMetadataItem;
    vqlEditor: SettingsMetadataItem;
    dataTools: SettingsMetadataItem;
    fileBrowser: SettingsMetadataItem;
    dataNavigator: SettingsMetadataItem;
    workflowActivityLogInspector: SettingsMetadataItem;
};

export const PageSettingsMetadata: PageSettingsMetadataType = {
    componentEditor: {
        label: 'Component Editor',
        infoText: 'Allows you to <b>Get</b> and <b>Change</b> component configuration via the Metadata API.',
    },
    vqlEditor: {
        label: 'VQL Editor',
        infoText: 'Allows you to <b>Run</b> VQL queries and <b>Export</b> results to CSV.',
    },
    dataTools: {
        label: 'Data Tools',
        infoText: 'Allows you to run <b>Count</b> and <b>Delete</b> data jobs for objects and document types.',
    },
    fileBrowser: {
        label: 'File Browser',
        infoText: 'Allows you to <b>Interact</b> with Vault <b>File Staging</b> and <b>Direct Data API</b> files.',
    },
    dataNavigator: {
        label: 'Data Navigator',
        infoText:
            'Allows you to <b>View</b> all record field values and <b>Navigate</b> to related records in those fields.',
    },
    workflowActivityLogInspector: {
        label: 'Workflow Activity Log Inspector',
        infoText: 'Allows you to <b>Analyze</b> and <b>Visualize</b> Workflow Activity logs.',
    },
};

type PageSettingsType = typeof PageSettingsMetadata;
export type PageSettingsKeyType = keyof PageSettingsType;

type FeatureSettingsMetadataType = {
    showVaultAdminLinks: SettingsMetadataItem;
    showFileStaging: SettingsMetadataItem;
    showDirectData: SettingsMetadataItem;
};

export const FeatureSettingsMetadata: FeatureSettingsMetadataType = {
    showVaultAdminLinks: {
        label: 'Show Admin UI Links',
        infoText: 'Allows you to <b>Navigate</b> to the Vault Configuration UI for fields or components.',
    },

    showFileStaging: {
        label: 'File Staging Browser',
        infoText:
            'Allows you to <b>Browse</b>, <b>Download</b>, and <b>Upload</b> files from Vault <b>File Staging</b>.',
    },

    showDirectData: {
        label: 'Direct Data API Browser',
        infoText: 'Allows you to <b>Browse</b> and <b>Download Direct Data API</b> files.',
    },
};

type FeatureSettingsType = typeof FeatureSettingsMetadata;
export type FeatureSettingsKeyType = keyof FeatureSettingsType;
