# FileResourceApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiFileResourceDeleteDelete**](#apifileresourcedeletedelete) | **DELETE** /api/FileResource/Delete | |
|[**apiFileResourceGetGet**](#apifileresourcegetget) | **GET** /api/FileResource/Get | |
|[**apiFileResourceListGet**](#apifileresourcelistget) | **GET** /api/FileResource/List | |
|[**apiFileResourceUpsertPost**](#apifileresourceupsertpost) | **POST** /api/FileResource/Upsert | |

# **apiFileResourceDeleteDelete**
> apiFileResourceDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    FileResourceApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FileResourceApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiFileResourceDeleteDelete(
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

# **apiFileResourceGetGet**
> apiFileResourceGetGet()


### Example

```typescript
import {
    FileResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FileResourceApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiFileResourceGetGet(
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

# **apiFileResourceListGet**
> apiFileResourceListGet()


### Example

```typescript
import {
    FileResourceApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new FileResourceApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiFileResourceListGet(
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

# **apiFileResourceUpsertPost**
> apiFileResourceUpsertPost(fileResourceUpsertRequest)


### Example

```typescript
import {
    FileResourceApi,
    Configuration,
    FileResourceUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FileResourceApi(configuration);

let fileResourceUpsertRequest: FileResourceUpsertRequest; //

const { status, data } = await apiInstance.apiFileResourceUpsertPost(
    fileResourceUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **fileResourceUpsertRequest** | **FileResourceUpsertRequest**|  | |


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

