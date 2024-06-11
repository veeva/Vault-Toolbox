# Vault Developer Toolbox

Vault Developer Toolbox is a Chrome Extension designed to make the everyday life of Vault Admins and Developers easier. It has a built-in set of "Tools" that leverage the power of the [Vault REST API](https://developer.veevavault.com/docs/) through a clean and responsive User Interface.

## Getting started

Vault Developer Toolbox is available for installation via the [Chrome Web Store](https://chromewebstore.google.com/detail/vault-developer-toolbox/mnhgljfhifhchamigkieeghmcdjaahdg). 

For information on the technical architecture and instructions for extending or self-hosting this project, please refer to the [project wiki](https://github.com/veeva/Vault-Developer-Toolbox/wiki).

## Features

### Login (24.1.0)
Developer Toolbox requires you to authenticate into a Vault. You can do this using the <b>Vault DNS</b> 
(```yourvaultname.veevavault.com```) and either the combination of your <b>Username</b> and <b>Password</b> or you can
supply an active <b>Session ID</b>. 

<i>SSO Authentication</i> is possible by obtaining the <b>Session ID</b> via the Vault 
REST API using [OAuth 2.0 / OpenID Connect](https://developer.veevavault.com/api/23.3/#oauth-2-0-openid-connect) (see 
[Vault Help](https://platform.veevavault.help/en/gr/43329/) for more information).

The <i>Login Form</i> will automatically copy the <b>Vault DNS</b> into the <i>Login Form</i> for you if you open the
plugin from a tab where you are logged into a Vault. It also lets you save up to 100 environments' <b>Vault DNS</b> and
<b>Username</b>, including setting one of them as the default.

![Login.png](uploads%2FLogin.png)

***
### Dark Mode (24.1.1)
Users can can switch between Light and Dark mode using a button. Toolbox will remember your settings when opening the next time.

***
### API Info Panel (24.1.1)
API Info section will display:
- The Name and Link to the Vault you are currently logged in to; when clicked, opens Vault in new tab
- Status, Time, and Size of the last API Call made
- The API Version used to make the API Calls

Users can change the API Version used by the tools by clicking the version link, and then selecting an available version from the popup.

***
### Component Editor (24.1.0)
The <b>Component Editor</b> lets you get the [MDL](https://developer.veevavault.com/mdl/) of [Vault Components](https://developer.veevavault.com/mdl/components/) by searching for them using the <b>Componenttype.Componentname</b> format and clicking the <b>Get</b> button.
</br>
</br>
If you are in a <i>non-production</i> environment, the <b>Component Editor</b> also allows you to <b>Send</b> [MDL Commands](https://developer.veevavault.com/mdl/#mdl-commands-1) to Vault. This enables you to <b>Get</b> a component, make quick modifications, and then <b>Send</b> it back to Vault, allowing for faster configuration changes.

![Component Editor.png](uploads%2FComponent%20Editor.png)

#### Component Editor: Component Directory (24.1.0)
Developer Toolbox will get all MDL-based components from the system and load them into the right-hand-side <b>Component Directory</b>.
</br>
</br>
The <b>Component Directory</b> will be organized by [Component Types](https://developer.veevavault.com/mdl/components/) and once a Component Type is expanded, the list will reveal the <i>Component Records</i>. When clicked, the <i>Component Record</i> MDL will be retrieved and loaded into the <b>Monaco Editor</b>.

#### Component Editor: Monaco Editor (24.1.0)
Developer Toolbox uses the open-source [Monaco Editor](https://microsoft.github.io/monaco-editor/) (used by VS Code) which has been customized with <i>Syntax Highlighting for MDL</i> and <i>Sticky Scroll</i> enabled.
</br>
</br>
You can <b>Zoom In/Out</b> to set the desired display size by <i>Ctrl/Command + Mouse Scroll</i> or the <i>Pinch Zoom</i> on touchpads. You can access the <i>Monaco Editor Command Palette</i> by pressing the <b>F1</b> key while focused on the editor.

***
### VQL Editor (24.1.0)
The VQL Editor lets you send [VQL Queries](https://developer.veevavault.com/vql/) to Vault and retrieve the data, which you can view in <b>Table</b> or <b>JSON</b> format. The <b>Download CSV</b> button will generate a CSV file of the <i>entire query result</i>, including all pages. <i>Subquery Pagination</i> ([Object](https://developer.veevavault.com/vql/#left-outer-join-parent-to-child-1-m") or [Document](https://developer.veevavault.com/vql/#left-outer-join-document-to-product-m-m)) is not supported in the current version, so results will be limited to the first page of subquery results.

![VQL Editor.png](uploads%2FVQL%20Editor.png)

#### VQL Editor: Pagination (24.1.0)
The VQL results are retrieved according to the default [PAGESIZE](https://developer.veevavault.com/vql/#pagesize) which can be reduced by adding the <b>PAGESIZE</b> parameter to the query.
</br>

If there are more results than the <b>PAGESIZE</b>, you can use the <i>Next Page</i> and <i>Previous Page</i> buttons to perform the pagination, which will utilize the [recommended](https://developer.veevavault.com/vql/#paginating-results-1) ```next_page``` and ```previous_page``` values from the query result JSON.
***
### Vault Data Tools (24.1.0)
The cloud version of the open-source <b>Vault Data Tools</b> allows developers to initiate <b>Count Object</b> and <b>Count Document</b> jobs, for <i>all</i> or <i>specific</i> Objects or Document Types.
</br>

On <i>non-production</i> environments, the tool will also allow developers to initiate <b>Delete Object</b> and <b>Delete Document</b> jobs. Delete operations cannot be reversed. 
</br>

Once a job is completed, a summary of the results will be posted on the Vault's [File Staging Server](https://platform.veevavault.help/en/gr/38653/) and displayed in the results window.

![Vault Data Tools.png](uploads%2FVault%20Data%20Tools.png)

## Required Permissions
Vault Developer Toolbox uses the published and validated API endpoints, and does not provide any overrides to documented functionalities.

In order to use Developer Toolbox, users must have the following permissions:
* <b>Application > API > Access API</b> is required to be able to access Developer Toolbox and use the VQL Editor
* <b>Application > API > Metadata API</b> is required to be able to use the Component Editor
* <b>Application > File Staging > Access</b> is required for Data Tools to be able to put the results of the jobs into the File Staging Server

Access to Objects and Documents is subject to the relevant permissions and potential Lifecycle Role restrictions, or to simply put, users will only see data using Developer Toolbox, which they would be able to access via the Vault UI.

## Support
Support for Vault Developer Toolbox is handled exclusively through the [Vault for Developers community](https://veevaconnect.com/communities/ATeJ3k8lgAA/about) on Veeva Connect.
