# ProjectAISupportApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiProjectAISupportAssignPost**](#apiprojectaisupportassignpost) | **POST** /api/ProjectAISupport/Assign | |
|[**apiProjectAISupportDeleteDelete**](#apiprojectaisupportdeletedelete) | **DELETE** /api/ProjectAISupport/Delete | |
|[**apiProjectAISupportListGet**](#apiprojectaisupportlistget) | **GET** /api/ProjectAISupport/List | |

# **apiProjectAISupportAssignPost**
> apiProjectAISupportAssignPost(projectAISupportAssignRequest)


### Example

```typescript
import {
    ProjectAISupportApi,
    Configuration,
    ProjectAISupportAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectAISupportApi(configuration);

let projectAISupportAssignRequest: ProjectAISupportAssignRequest; //

const { status, data } = await apiInstance.apiProjectAISupportAssignPost(
    projectAISupportAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectAISupportAssignRequest** | **ProjectAISupportAssignRequest**|  | |


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

# **apiProjectAISupportDeleteDelete**
> apiProjectAISupportDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    ProjectAISupportApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectAISupportApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiProjectAISupportDeleteDelete(
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

# **apiProjectAISupportListGet**
> apiProjectAISupportListGet()


### Example

```typescript
import {
    ProjectAISupportApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectAISupportApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiProjectAISupportListGet(
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

