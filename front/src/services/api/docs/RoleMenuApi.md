# RoleMenuApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRoleMenuAssignPost**](#apirolemenuassignpost) | **POST** /api/RoleMenu/Assign | |
|[**apiRoleMenuDeleteDelete**](#apirolemenudeletedelete) | **DELETE** /api/RoleMenu/Delete | |
|[**apiRoleMenuListGet**](#apirolemenulistget) | **GET** /api/RoleMenu/List | |

# **apiRoleMenuAssignPost**
> apiRoleMenuAssignPost(roleMenuAssignRequest)


### Example

```typescript
import {
    RoleMenuApi,
    Configuration,
    RoleMenuAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleMenuApi(configuration);

let roleMenuAssignRequest: RoleMenuAssignRequest; //

const { status, data } = await apiInstance.apiRoleMenuAssignPost(
    roleMenuAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleMenuAssignRequest** | **RoleMenuAssignRequest**|  | |


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

# **apiRoleMenuDeleteDelete**
> apiRoleMenuDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    RoleMenuApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleMenuApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiRoleMenuDeleteDelete(
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

# **apiRoleMenuListGet**
> apiRoleMenuListGet()


### Example

```typescript
import {
    RoleMenuApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleMenuApi(configuration);

let roleId: string; // (optional) (default to undefined)
let menuId: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRoleMenuListGet(
    roleId,
    menuId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleId** | [**string**] |  | (optional) defaults to undefined|
| **menuId** | [**string**] |  | (optional) defaults to undefined|
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

