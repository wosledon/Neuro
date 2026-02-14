# ProjectApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiProjectDeleteDelete**](#apiprojectdeletedelete) | **DELETE** /api/Project/Delete | |
|[**apiProjectGetGet**](#apiprojectgetget) | **GET** /api/Project/Get | |
|[**apiProjectListGet**](#apiprojectlistget) | **GET** /api/Project/List | |
|[**apiProjectUpsertPost**](#apiprojectupsertpost) | **POST** /api/Project/Upsert | |

# **apiProjectDeleteDelete**
> apiProjectDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    ProjectApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiProjectDeleteDelete(
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

# **apiProjectGetGet**
> apiProjectGetGet()


### Example

```typescript
import {
    ProjectApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiProjectGetGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | (optional) defaults to undefined|


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

# **apiProjectListGet**
> apiProjectListGet()


### Example

```typescript
import {
    ProjectApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiProjectListGet(
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

# **apiProjectUpsertPost**
> apiProjectUpsertPost(projectUpsertRequest)


### Example

```typescript
import {
    ProjectApi,
    Configuration,
    ProjectUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProjectApi(configuration);

let projectUpsertRequest: ProjectUpsertRequest; //

const { status, data } = await apiInstance.apiProjectUpsertPost(
    projectUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectUpsertRequest** | **ProjectUpsertRequest**|  | |


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

