# RoleDocumentApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRoleDocumentAssignPost**](#apiroledocumentassignpost) | **POST** /api/RoleDocument/Assign | |
|[**apiRoleDocumentDeleteDelete**](#apiroledocumentdeletedelete) | **DELETE** /api/RoleDocument/Delete | |
|[**apiRoleDocumentListGet**](#apiroledocumentlistget) | **GET** /api/RoleDocument/List | |

# **apiRoleDocumentAssignPost**
> apiRoleDocumentAssignPost(roleDocumentAssignRequest)


### Example

```typescript
import {
    RoleDocumentApi,
    Configuration,
    RoleDocumentAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleDocumentApi(configuration);

let roleDocumentAssignRequest: RoleDocumentAssignRequest; //

const { status, data } = await apiInstance.apiRoleDocumentAssignPost(
    roleDocumentAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleDocumentAssignRequest** | **RoleDocumentAssignRequest**|  | |


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

# **apiRoleDocumentDeleteDelete**
> apiRoleDocumentDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    RoleDocumentApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleDocumentApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiRoleDocumentDeleteDelete(
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

# **apiRoleDocumentListGet**
> apiRoleDocumentListGet()


### Example

```typescript
import {
    RoleDocumentApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleDocumentApi(configuration);

let roleId: string; // (optional) (default to undefined)
let documentId: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRoleDocumentListGet(
    roleId,
    documentId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleId** | [**string**] |  | (optional) defaults to undefined|
| **documentId** | [**string**] |  | (optional) defaults to undefined|
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

