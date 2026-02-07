# MenuApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiMenuDeleteDelete**](#apimenudeletedelete) | **DELETE** /api/Menu/Delete | |
|[**apiMenuGetGet**](#apimenugetget) | **GET** /api/Menu/Get | |
|[**apiMenuListGet**](#apimenulistget) | **GET** /api/Menu/List | |
|[**apiMenuUpsertPost**](#apimenuupsertpost) | **POST** /api/Menu/Upsert | |

# **apiMenuDeleteDelete**
> apiMenuDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    MenuApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MenuApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiMenuDeleteDelete(
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

# **apiMenuGetGet**
> apiMenuGetGet()


### Example

```typescript
import {
    MenuApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MenuApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMenuGetGet(
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

# **apiMenuListGet**
> apiMenuListGet()


### Example

```typescript
import {
    MenuApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new MenuApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiMenuListGet(
    keyword,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **keyword** | [**string**] |  | (optional) defaults to undefined|
| **page** | [**ApiDocumentListGetPageParameter**] |  | (optional) defaults to undefined|
| **pageSize** | [**ApiDocumentListGetPageParameter**] |  | (optional) defaults to undefined|


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

# **apiMenuUpsertPost**
> apiMenuUpsertPost(menuUpsertRequest)


### Example

```typescript
import {
    MenuApi,
    Configuration,
    MenuUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MenuApi(configuration);

let menuUpsertRequest: MenuUpsertRequest; //

const { status, data } = await apiInstance.apiMenuUpsertPost(
    menuUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **menuUpsertRequest** | **MenuUpsertRequest**|  | |


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

