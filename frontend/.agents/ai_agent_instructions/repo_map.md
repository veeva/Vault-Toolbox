# 🗺️ Vault Toolbox Repo Map (PageRank Sorted)

*Generated at: 6/5/2026, 9:05:49 AM*
*Total Files: 206*

## 🏗️ Architectural Backbone (Top 20%)
### 📄 src/app/services/ApiService.js (Score: 0.1347)
  - **Exports:** `VAULT_CLIENT_ID`, `invokeAwsLambdaFunction`, `retrieveAllDocumentTypes`, `retrieveAllDocumentFields`, `retrieveDocumentSignatureMetadata`, `retrieveDomainInformation`, `query`, `queryByPage`, `listItemsAtAPath`, `listItemsAtAPathByPage`, `downloadItemContent`, `createFolderOrFile`, `handleDeleteFileStagingItem`, `retrieveAvailableDirectDataFiles`, `downloadDirectDataFile`, `retrieveComponentRecordMdl`, `retrieveComponentRecordXmlJson`, `executeMdlScript`, `executeMdlScriptAsync`, `retrieveAsyncMdlScriptResults`, `retrieveObjectCollection`, `retrieveAllComponentMetadata`, `retrieveObjectMetadata`, `retrieveUserMetadata`, `retrievePicklistValues`, `retrieveJobStatus`, `sessionKeepAlive`, `login`, `getAuthorizationHeader`, `getVaultDNS`, `handleErrors`

### 📄 src/app/services/SharedServices.ts (Score: 0.1254)
  - **Exports:** `VAULT_SUBDOMAINS`, `isProductionVault`, `isSandboxVault`, `getVaultDns`, `getVaultId`, `getVaultName`, `getVaultDomainType`, `getVaultUsername`, `getVaultApiVersion`, `getCustomApiHeadersFromStorage`, `formatDateTime`, `formatBytesToUserFriendlyFormat`, `convertArrayToSelectOptions`, `pollJobStatus`, `chunkFile`

### 📄 src/app/services/vapil/VaultRequest.js (Score: 0.0914)
  - **Exports:** `VAULT_API_VERSION`, `VAULT_DEVELOPER_TOOLBOX_VERSION`, `HTTP_HEADER_CONTENT_TYPE`, `HTTP_HEADER_ACCEPT`, `HTTP_HEADER_VAULT_CLIENT_ID`, `HTTP_HEADER_REFERENCE_ID`, `HTTP_HEADER_AUTHORIZATION`, `HTTP_HEADER_CONTENT_LENGTH`, `HTTP_HEADER_CONTENT_MD5`, `HTTP_HEADER_FILEPART_NUMBER`, `HTTP_CONTENT_TYPE_JSON`, `HTTP_CONTENT_TYPE_XFORM`, `HTTP_CONTENT_TYPE_PLAINTEXT`, `HTTP_CONTENT_TYPE_OCTET_STREAM`, `request`, `getAPIEndpoint`, `getPaginationEndpoint`, `RequestMethod`

### 📄 src/app/hooks/shared/useCustomApiHeaders.ts (Score: 0.0390)
  - **Exports:** `useCustomApiHeaders`

### 📄 src/app/utils/api-history/ApiHistoryHelper.ts (Score: 0.0300)
  - **Exports:** `getApiHistory`, `logApiCall`, `buildDisplayedHistoryRow`, `buildPayload`, `buildSortedHeaderList`

### 📄 src/app/components/shared/ui-components/close-button.tsx (Score: 0.0196)
  - **Exports:** `CloseButton`

### 📄 src/app/components/shared/ui-components/dialog.tsx (Score: 0.0130)
  - **Exports:** `DialogContent`, `DialogCloseTrigger`, `DialogRoot`, `DialogFooter`, `DialogHeader`, `DialogBody`, `DialogBackdrop`, `DialogTitle`, `DialogDescription`, `DialogTrigger`, `DialogActionTrigger`

### 📄 src/app/utils/settings/VaultToolboxSettings.ts (Score: 0.0124)
  - **Exports:** `MAX_FAVORITE_TOOLS`, `defaultSettings`, `PageSettingsMetadata`, `FeatureSettingsMetadata`

### 📄 src/app/components/shared/ui-components/tooltip.tsx (Score: 0.0116)
  - **Exports:** `Tooltip`

### 📄 src/app/services/vapil/AuthenticationRequest.js (Score: 0.0108)
  - **Exports:** `retrieveApiVersions`, `login`, `sessionKeepAlive`

### 📄 src/app/services/vapil/FileStagingRequest.js (Score: 0.0107)
  - **Exports:** `listItemsAtAPath`, `listItemsAtAPathByPage`, `downloadItemContent`, `createFolderOrFile`, `deleteFolderOrFile`, `createResumableUploadSession`, `uploadToASession`, `commitUploadSession`, `abortUploadSession`

### 📄 src/app/hooks/data-navigator/useDataReducer.ts (Score: 0.0104)
  - **Exports:** `useDataReducer`

### 📄 src/app/services/vapil/UserRequest.js (Score: 0.0103)
  - **Exports:** `retrieveUserMetadata`

### 📄 src/app/services/vapil/QueryRequest.js (Score: 0.0103)
  - **Exports:** `query`, `queryByPage`

### 📄 src/app/services/vapil/PicklistRequest.js (Score: 0.0103)
  - **Exports:** `retrievePicklistValues`

### 📄 src/app/services/vapil/MetaDataRequest.js (Score: 0.0103)
  - **Exports:** `retrieveComponentRecordMdl`, `retrieveComponentRecordXmlJson`, `executeMdlScript`, `executeMdlScriptAsync`, `retrieveAsyncMdlScriptResults`, `retrieveObjectCollection`, `retrieveAllComponentMetadata`, `retrieveObjectMetadata`

### 📄 src/app/services/vapil/JobsRequest.js (Score: 0.0103)
  - **Exports:** `retrieveJobStatus`

### 📄 src/app/services/vapil/DomainRequest.js (Score: 0.0103)
  - **Exports:** `retrieveDomainInformation`

### 📄 src/app/services/vapil/DocumentSignatureRequest.js (Score: 0.0103)
  - **Exports:** `retrieveDocumentSignatureMetadata`

### 📄 src/app/services/vapil/DocumentRequest.js (Score: 0.0103)
  - **Exports:** `retrieveAllDocumentTypes`, `retrieveAllDocumentFields`

### 📄 src/app/services/vapil/DirectDataRequest.js (Score: 0.0103)
  - **Exports:** `retrieveAvailableDirectDataFiles`, `downloadDirectDataFile`

### 📄 src/app/components/shared/ui-components/color-mode.tsx (Score: 0.0093)
  - **Exports:** `ColorModeProvider`, `useColorMode`, `useColorModeValue`, `ColorModeIcon`, `ColorModeButton`, `LightMode`, `DarkMode`

### 📄 src/app/components/shared/CustomSelect.jsx (Score: 0.0077)
  - **Exports:** `CustomSelect`

### 📄 src/app/hooks/login/useSavedVaultData.ts (Score: 0.0066)
  - **Exports:** `useSavedVaultData`

### 📄 src/app/components/shared/ui-components/toaster.tsx (Score: 0.0062)
  - **Exports:** `toaster`, `Toaster`

### 📄 src/app/components/shared/ApiErrorMessageCard.tsx (Score: 0.0060)
  - **Exports:** `ApiErrorMessageCard`

### 📄 src/app/context/AuthContext.tsx (Score: 0.0054)
  - **Exports:** `useAuth`, `AuthProvider`

### 📄 src/app/components/shared/ui-components/checkbox.tsx (Score: 0.0049)
  - **Exports:** `Checkbox`

### 📄 src/app/components/shared/ui-components/input-group.tsx (Score: 0.0048)
  - **Exports:** `InputGroup`

### 📄 src/app/context/SettingsContext.tsx (Score: 0.0046)
  - **Exports:** `SettingsProvider`, `useSettings`

### 📄 src/app/components/shared/JsonSyntaxHighlighter.tsx (Score: 0.0043)
  - **Exports:** `default`

### 📄 src/app/utils/shared/SidebarItems.ts (Score: 0.0041)
  - **Exports:** `SidebarItems`

### 📄 src/app/components/shared/ui-components/popover.tsx (Score: 0.0036)
  - **Exports:** `PopoverContent`, `PopoverArrow`, `PopoverCloseTrigger`, `PopoverTitle`, `PopoverDescription`, `PopoverFooter`, `PopoverHeader`, `PopoverRoot`, `PopoverBody`, `PopoverTrigger`

### 📄 src/app/hooks/file-browser/useFileDownloadModal.js (Score: 0.0034)
  - **Exports:** `SUCCESS`, `FAILURE`, `IN_PROGRESS`, `CANCELLED`, `useFileDownloadModal`

### 📄 src/app/components/shared/ui-components/breadcrumb.tsx (Score: 0.0032)
  - **Exports:** `BreadcrumbRoot`, `BreadcrumbLink`, `BreadcrumbCurrentLink`, `BreadcrumbEllipsis`

### 📄 src/app/hooks/file-browser/useFileBrowserSearch.js (Score: 0.0032)
  - **Exports:** `useFileBrowserSearch`

### 📄 src/app/components/shared/ErrorBoundaryCard.tsx (Score: 0.0030)
  - **Exports:** `ErrorBoundaryCard`

### 📄 src/app/components/data-navigator/DataTabs.tsx (Score: 0.0030)
  - **Exports:** `DataTabs`

### 📄 src/app/components/login/LoginCard.tsx (Score: 0.0029)
  - **Exports:** `LoginCard`

### 📄 src/app/components/vql-editor/query-history/QueryHistoryRow.jsx (Score: 0.0028)
  - **Exports:** `QueryHistoryRow`

### 📄 src/app/components/shared/ContextualHelpButton.jsx (Score: 0.0028)
  - **Exports:** `ContextualHelpButton`

### 📄 src/app/components/shared/ApiHistory.tsx (Score: 0.0028)
  - **Exports:** `ApiHistory`

## 📂 Project Structure (Remainder)
- **src/**
  - **app/**
    - App.jsx
    - **components/**
      - **component-editor/**
        - ComponentConsole.jsx
        - ComponentDirectoryPanel.jsx
        - ComponentEditorHeaderRow.jsx
        - ComponentEditorIsland.jsx
        - ComponentTree.jsx
        - OutstandingAsyncJobWarning.jsx
      - **data-navigator/**
        - DataLookupInfoPopover.tsx
        - DataNavigatorHeaderRow.tsx
        - DataNavigatorIsland.tsx
        - DataTabTooltip.tsx
        - DataTable.tsx
        - FieldLabelCell.tsx
        - FieldNameCell.tsx
        - FieldTypeCell.tsx
        - FieldValueActionMenu.tsx
        - FieldValueCell.tsx
        - FullTextDisplayDialog.tsx
        - MultiSelectColumnFilter.tsx
        - OpenComponentEditorConfirmationDialog.tsx
        - ReadOnlyComponentEditorDialog.tsx
        - SearchableColumnFilter.tsx
      - **data-tools/**
        - ConfirmDataDeletion.jsx
        - DataFilesPanel.jsx
        - DataFilesTableBody.jsx
        - DataFilesTableHeader.jsx
        - DataSelectionCheckboxGroup.jsx
        - DataSelectionPanel.jsx
        - DataToolsHeaderRow.jsx
        - DataToolsIand.jsx
        - FileContentsModal.jsx
      - **file-browser/**
        - DownloadProgressModal.jsx
        - FileBrowserDirectoryPanel.jsx
        - FileBrowserHeaderRow.jsx
        - FileBrowserIsland.jsx
        - **direct-data/**
          - DirectDataBrowserBreadcrumb.jsx
          - DirectDataBrowserSearchBar.jsx
          - DirectDataBrowserTable.jsx
          - DirectDataTree.jsx
          - DirectDataVirtualizedTable.jsx
        - **file-staging/**
          - ConfirmFileOrFolderDeletion.jsx
          - FileStagingBrowserBreadcrumb.jsx
          - FileStagingBrowserSearchBar.jsx
          - FileStagingBrowserTable.jsx
          - FileStagingTree.jsx
          - FileStagingVirtualizedTable.jsx
      - **login/**
        - IntegratedLoginAlert.tsx
        - SavedVaultsPopover.tsx
        - SavedVaultsTable.tsx
        - SavedVaultsTableRow.tsx
      - **settings/**
        - FeatureSettingsTableRow.tsx
        - GeneralSettingsTab.tsx
        - PageSettingsTab.tsx
        - PageSettingsTableRow.tsx
        - SettingsIsland.tsx
      - **shared/**
        - ApiHistoryExpandedRow.tsx
        - CodeEditor.jsx
        - CollapsedSidebar.tsx
        - DrawerSidebar.tsx
        - DrawerSidebarItem.tsx
        - HorizontalResizeHandle.jsx
        - IdleWarningDialog.jsx
        - Layout.jsx
        - NotOfficialVeevaProductAlert.tsx
        - ProtectedRoute.jsx
        - Sidebar.tsx
        - SidebarItem.tsx
        - TelemetryData.jsx
        - VerticalResizeHandle.jsx
        - VirtualizedTable.jsx
        - **ui-components/**
          - drawer.tsx
          - field.tsx
          - file-upload.tsx
          - menu.tsx
          - provider.tsx
          - radio.tsx
          - select.tsx
          - skeleton.tsx
          - switch.tsx
        - **vault-info-island/**
          - ApiSettingsModal.tsx
          - ApiVersionSection.tsx
          - CustomApiHeadersSection.tsx
          - VaultInfoIsland.tsx
      - **vault-info/**
        - VaultInfoHeader.tsx
        - VaultInfoTable.tsx
      - **vql-editor/**
        - VqlActionsMenu.jsx
        - VqlConfirmQueryDeletionModal.jsx
        - VqlConsole.jsx
        - VqlEditorIsland.jsx
        - VqlHeaderRow.jsx
        - VqlProdVaultWarningModal.jsx
        - VqlSaveQueryModal.jsx
        - VqlSavedQueriesContainer.jsx
        - VqlTableBody.jsx
        - VqlTableHeader.jsx
        - **query-builder/**
          - QueryBuilderContainer.jsx
          - QueryCategorySelector.jsx
          - QueryFieldsSelector.jsx
          - QueryFilterRow.jsx
          - QueryObjectSelector.jsx
          - QueryTargetSelector.jsx
          - VqlQueryMetadata.js
          - WhereClauseBuilder.jsx
        - **query-history/**
          - QueryHistoryContainer.jsx
    - **hooks/**
      - **component-editor/**
        - useComponentEditor.js
        - useComponentTree.js
      - **data-navigator/**
        - useDataNavigator.ts
        - useDataNavigatorInput.ts
        - useDataTable.ts
        - useMultiSelectColumnFilter.ts
        - useOverflowResizer.ts
      - **data-tools/**
        - useConfirmDataDeletion.js
        - useDataFileModal.js
        - useDataFiles.js
        - useDataTools.js
        - useFileContents.js
        - useVaultData.js
        - useVaultDataSelection.js
      - **file-browser/**
        - **direct-data/**
          - useDirectDataBrowser.js
          - useDirectDataTree.js
        - **file-staging/**
          - useConfirmFileStagingItemDeletion.js
          - useFileStagingBrowser.js
          - useFileStagingTree.js
          - useFileStagingUpload.js
        - useFileBrowserTabs.js
        - useFolderContents.js
      - **login/**
        - useIntegratedLogin.ts
        - useSavedVaultsPopover.ts
        - useSavedVaultsTable.ts
        - useVaultLoginForm.ts
      - **settings/**
        - useFeatureSpecificSettings.ts
        - usePageSettings.ts
      - **shared/**
        - useApiHistory.ts
        - useEditApiVersion.ts
        - useElementHeight.ts
        - useFavoriteTools.ts
        - useIdleTimer.ts
        - useLogout.ts
        - useRemainingHeight.ts
        - useToolSearch.ts
        - useVaultSession.ts
        - useVaultSessionKeepAlive.ts
      - **vault-info/**
        - useVaultInfo.ts
      - **vql-editor/**
        - useQueryBuilder.js
        - useQueryHistory.js
        - useQuerySidePanel.js
        - useSavedQueries.js
        - useVqlQuery.js
    - index.jsx
    - **pages/**
      - ComponentEditorPage.jsx
      - DataNavigatorPage.tsx
      - DataToolsPage.jsx
      - ErrorPage.tsx
      - FileBrowserPage.jsx
      - LoginPage.tsx
      - SettingsPage.tsx
      - VaultInfoPage.tsx
      - VqlEditorPage.jsx
    - **utils/**
      - **component-editor/**
        - MdlLanguageDefinition.ts
      - **data-navigator/**
        - DataNavigatorHelper.ts
      - **shared/**
        - VeevaTheme.ts
      - **vql-editor/**
        - VqlLanguageDefinition.ts
        - VqlQueryMetadata.js
  - **background/**
    - background.js
