# RolePermissionApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRolePermissionAssignPost**](#apirolepermissionassignpost) | **POST** /api/RolePermission/Assign | |
|[**apiRolePermissionDeleteDelete**](#apirolepermissiondeletedelete) | **DELETE** /api/RolePermission/Delete | |
|[**apiRolePermissionListGet**](#apirolepermissionlistget) | **GET** /api/RolePermission/List | |

# **apiRolePermissionAssignPost**
> apiRolePermissionAssignPost(rolePermissionAssignRequest)


### Example

```typescript
import {
    RolePermissionApi,
    Configuration,
    RolePermissionAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RolePermissionApi(configuration);

let rolePermissionAssignRequest: RolePermissionAssignRequest; //

const { status, data } = await apiInstance.apiRolePermissionAssignPost(
    rolePermissionAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **rolePermissionAssignRequest** | **RolePermissionAssignRequest**|  | |


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

# **apiRolePermissionDeleteDelete**
> apiRolePermissionDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    RolePermissionApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RolePermissionApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiRolePermissionDeleteDelete(
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

# **apiRolePermissionListGet**
> apiRolePermissionListGet()


### Example

```typescript
import {
    RolePermissionApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new RolePermissionApi(configuration);

let roleId: string; // (optional) (default to undefined)
let permissionId: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRolePermissionListGet(
    roleId,
    permissionId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleId** | [**string**] |  | (optional) defaults to undefined|
| **permissionId** | [**string**] |  | (optional) defaults to undefined|
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

