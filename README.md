# Vault Developer Toolbox

Vault Developer Toolbox is a Chrome Extension designed to make the everyday life of Vault Admins and Developers easier. It has a built-in set of "Tools" that leverage the power of the [Vault REST API](https://developer.veevavault.com/docs/) through a clean and responsive User Interface.

## Getting started

Vault Developer Toolbox is available for installation via the [Chrome Web Store](https://chromewebstore.google.com/detail/vault-developer-toolbox/mnhgljfhifhchamigkieeghmcdjaahdg). 

For information on the technical architecture and instructions on entending or self-hosting this project, please refer to the [project wiki](https://github.com/veeva/Vault-Developer-Toolbox/wiki).

## Features

### Login
Vault Developer Toolbox requires you to authenticate into a Vault. You can do this using the <b>Vault DNS</b> (```your_vault_name.veevavault.com```) and either the combination of your <b>Username</b> and <b>Password</b> or you can supply an active <b>Session ID</b>. SSO Authentication is possible by obtaining the <b>Session ID</b> via the Vault REST API using [OAuth 2.0 / OpenID Connect](https://developer.veevavault.com/api/23.3/#oauth-2-0-openid-connect) (see [Vault Help](https://platform.veevavault.help/en/gr/43329/) for more information).

#### Login: Vault-aware Login Form
If you open Developer Toolbox from a Vault, it will automatically copy the <b>Vault DNS</b> into the Login Form for you.

#### Login: Environment Manager
The tool allows you to save up to 100 environments and 1 default with their <b>Vault DNS</b> and <b>Username</b>.

***
### Component Editor
The <b>Component Editor</b> lets you get the [MDL](https://developer.veevavault.com/mdl/) of [Vault Components](https://developer.veevavault.com/mdl/components/) by searching for them using the <b>Componenttype.Componentname</b> format and clicking the <b>Get</b> button.
</br>
</br>
If you are in a <i>non-production</i> environment, the <b>Component Editor</b> also allows you to <b>Send</b> [MDL Commands](https://developer.veevavault.com/mdl/#mdl-commands-1) to Vault. This enables you to <b>Get</b> a component, make quick modifications, and then <b>Send</b> it back to Vault, allowing for faster configuration changes.

![alt text](</uploads/Component Editor.png>)

#### Component Editor: Component Directory
Developer Toolbox will get all MDL-based components from the system and load them into the right-hand-side <b>Component Directory</b>.
</br>
</br>
The <b>Component Directory</b> will be organized by [Component Types](https://developer.veevavault.com/mdl/components/) and once a Component Type is expanded, the list will reveal the <i>Component Records</i>. When clicked, the <i>Component Record</i> MDL will be retrieved and loaded into the <b>Monaco Editor</b>.

#### Component Editor: Monaco Editor
Developer Toolbox uses the open-source [Monaco Editor](https://microsoft.github.io/monaco-editor/) (used by VS Code) which has been customized with <i>Syntax Highlighting for MDL</i> and <i>Sticky Scroll</i> enabled.
</br>
</br>
You can <b>Zoom In/Out</b> to set the desired display size by <i>Ctrl/Command + Mouse Scroll</i> or the <i>Pinch Zoom</i> on touchpads. You can access the <i>Monaco Editor Command Palette</i> by pressing the <b>F1</b> key while focused on the editor.

***
### VQL Editor
The VQL Editor lets you send [VQL Queries](https://developer.veevavault.com/vql/) to Vault and retrieve the data, which you can view in <b>Table</b> or <b>JSON</b> format. The <b>Download CSV</b> button will generate a CSV file of the <i>entire query result</i>, including all pages. <i>Subquery Pagination</i> ([Object](https://developer.veevavault.com/vql/#left-outer-join-parent-to-child-1-m") or [Document](https://developer.veevavault.com/vql/#left-outer-join-document-to-product-m-m)) is not supported in the current version, so results will be limited to the first page of subquery results.

![alt text](</uploads/VQL Editor.png>)

#### VQL Editor: Pagination
The VQL results are retrieved according to the default [PAGESIZE](https://developer.veevavault.com/vql/#pagesize) which can be reduced by adding the <b>PAGESIZE</b> parameter to the query.
</br>

If there are more results than the <b>PAGESIZE</b>, you can use the <i>Next Page</i> and <i>Previous Page</i> buttons to perform the pagination, which will utilize the [recommended](https://developer.veevavault.com/vql/#paginating-results-1) ```next_page``` and ```previous_page``` values from the query result JSON.
***
### Vault Data Tools
The cloud version of the open-source <b>Vault Data Tools</b> allows developers to initiate <b>Count Object</b> and <b>Count Document</b> jobs, for <i>all</i> or <i>specific</i> Objects or Document Types.
</br>

On <i>non-production</i> environments, the tool will also allow developers to initiate <b>Delete Object</b> and <b>Delete Document</b> jobs. Delete operations cannot be reversed. 
</br>

Once a job is completed, a summary of the results will be posted on the Vault's [File Staging Server](https://platform.veevavault.help/en/gr/38653/) and displayed in the results window.

![alt text](</uploads/Vault Data Tools.png>)

## Required Permissions
Vault Developer Toolbox uses the published and validated API endpoints, and does not provide any overrides to documented functionalities.

In order to use Developer Toolbox, users must have the following permissions:
* <b>Application > API > Access API</b> is required to be able to access Developer Toolbox and use the VQL Editor
* <b>Application > API > Metadata API</b> is required to be able to use the Component Editor
* <b>Application > File Staging > Access</b> is required for Data Tools to be able to put the results of the jobs into the File Staging Server

Access to Objects and Documents is subject to the relevant permissions and potential Lifecycle Role restrictions, or to simply put, users will only see data using Developer Toolbox, which they would be able to access via the Vault UI.

## Support
Support for Vault Developer Toolbox is handled exclusively through the [Vault for Developers community](https://veevaconnect.com/communities/ATeJ3k8lgAA/about) on Veeva Connect.
