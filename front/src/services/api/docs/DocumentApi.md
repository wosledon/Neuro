# DocumentApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDocumentDeleteDelete**](#apidocumentdeletedelete) | **DELETE** /api/Document/Delete | |
|[**apiDocumentGetGet**](#apidocumentgetget) | **GET** /api/Document/Get | |
|[**apiDocumentListGet**](#apidocumentlistget) | **GET** /api/Document/List | |
|[**apiDocumentUpsertPost**](#apidocumentupsertpost) | **POST** /api/Document/Upsert | |

# **apiDocumentDeleteDelete**
> apiDocumentDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiDocumentDeleteDelete(
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

# **apiDocumentGetGet**
> apiDocumentGetGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentGetGet(
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

# **apiDocumentListGet**
> apiDocumentListGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentListGet(
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

# **apiDocumentUpsertPost**
> apiDocumentUpsertPost(documentUpsertRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    DocumentUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let documentUpsertRequest: DocumentUpsertRequest; //

const { status, data } = await apiInstance.apiDocumentUpsertPost(
    documentUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentUpsertRequest** | **DocumentUpsertRequest**|  | |


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

