# PermissionApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiPermissionDeleteDelete**](#apipermissiondeletedelete) | **DELETE** /api/Permission/Delete | |
|[**apiPermissionGetGet**](#apipermissiongetget) | **GET** /api/Permission/Get | |
|[**apiPermissionListGet**](#apipermissionlistget) | **GET** /api/Permission/List | |
|[**apiPermissionUpsertPost**](#apipermissionupsertpost) | **POST** /api/Permission/Upsert | |

# **apiPermissionDeleteDelete**
> apiPermissionDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    PermissionApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiPermissionDeleteDelete(
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

# **apiPermissionGetGet**
> apiPermissionGetGet()


### Example

```typescript
import {
    PermissionApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiPermissionGetGet(
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

# **apiPermissionListGet**
> apiPermissionListGet()


### Example

```typescript
import {
    PermissionApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiPermissionListGet(
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

# **apiPermissionUpsertPost**
> apiPermissionUpsertPost(permissionUpsertRequest)


### Example

```typescript
import {
    PermissionApi,
    Configuration,
    PermissionUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PermissionApi(configuration);

let permissionUpsertRequest: PermissionUpsertRequest; //

const { status, data } = await apiInstance.apiPermissionUpsertPost(
    permissionUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **permissionUpsertRequest** | **PermissionUpsertRequest**|  | |


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

