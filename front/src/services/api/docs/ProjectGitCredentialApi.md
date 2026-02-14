# ProjectGitCredentialApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiProjectGitCredentialAssignPost**](#apiprojectgitcredentialassignpost) | **POST** /api/ProjectGitCredential/Assign | |
|[**apiProjectGitCredentialDeleteDelete**](#apiprojectgitcredentialdeletedelete) | **DELETE** /api/ProjectGitCredential/Delete | |
|[**apiProjectGitCredentialListGet**](#apiprojectgitcredentiallistget) | **GET** /api/ProjectGitCredential/List | |

# **apiProjectGitCredentialAssignPost**
> apiProjectGitCredentialAssignPost(projectGitCredentialAssignRequest)


### Example

```typescript
import {
    ProjectGitCredentialApi,
    Configuration,
    ProjectGitCredentialAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectGitCredentialApi(configuration);

let projectGitCredentialAssignRequest: ProjectGitCredentialAssignRequest; //

const { status, data } = await apiInstance.apiProjectGitCredentialAssignPost(
    projectGitCredentialAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectGitCredentialAssignRequest** | **ProjectGitCredentialAssignRequest**|  | |


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiProjectGitCredentialDeleteDelete**
> apiProjectGitCredentialDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    ProjectGitCredentialApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectGitCredentialApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiProjectGitCredentialDeleteDelete(
    batchDeleteRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **batchDeleteRequest** | **BatchDeleteRequest**|  | |


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json, text/json, application/*+json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiProjectGitCredentialListGet**
> apiProjectGitCredentialListGet()


### Example

```typescript
import {
    ProjectGitCredentialApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectGitCredentialApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiProjectGitCredentialListGet(
    keyword,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyword** | [**string**] |  | (optional) defaults to undefined|
| **page** | [**ApiAISupportListGetPageParameter**] |  | (optional) defaults to undefined|
| **pageSize** | [**ApiAISupportListGetPageParameter**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

