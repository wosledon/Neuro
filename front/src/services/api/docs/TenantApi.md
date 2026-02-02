# TenantApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTenantDeleteDelete**](#apitenantdeletedelete) | **DELETE** /api/Tenant/Delete | |
|[**apiTenantGetGet**](#apitenantgetget) | **GET** /api/Tenant/Get | |
|[**apiTenantListGet**](#apitenantlistget) | **GET** /api/Tenant/List | |
|[**apiTenantUpsertPost**](#apitenantupsertpost) | **POST** /api/Tenant/Upsert | |

# **apiTenantDeleteDelete**
> apiTenantDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    TenantApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TenantApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiTenantDeleteDelete(
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

# **apiTenantGetGet**
> apiTenantGetGet()


### Example

```typescript
import {
    TenantApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TenantApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiTenantGetGet(
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

# **apiTenantListGet**
> apiTenantListGet(tenantListRequest)


### Example

```typescript
import {
    TenantApi,
    Configuration,
    TenantListRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TenantApi(configuration);

let tenantListRequest: TenantListRequest; //

const { status, data } = await apiInstance.apiTenantListGet(
    tenantListRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **tenantListRequest** | **TenantListRequest**|  | |


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

# **apiTenantUpsertPost**
> apiTenantUpsertPost(tenantUpsertRequest)


### Example

```typescript
import {
    TenantApi,
    Configuration,
    TenantUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TenantApi(configuration);

let tenantUpsertRequest: TenantUpsertRequest; //

const { status, data } = await apiInstance.apiTenantUpsertPost(
    tenantUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **tenantUpsertRequest** | **TenantUpsertRequest**|  | |


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

