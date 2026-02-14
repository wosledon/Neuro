# UserRoleApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUserRoleAssignPost**](#apiuserroleassignpost) | **POST** /api/UserRole/Assign | |
|[**apiUserRoleDeleteDelete**](#apiuserroledeletedelete) | **DELETE** /api/UserRole/Delete | |
|[**apiUserRoleListGet**](#apiuserrolelistget) | **GET** /api/UserRole/List | |

# **apiUserRoleAssignPost**
> apiUserRoleAssignPost(userRoleAssignRequest)


### Example

```typescript
import {
    UserRoleApi,
    Configuration,
    UserRoleAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserRoleApi(configuration);

let userRoleAssignRequest: UserRoleAssignRequest; //

const { status, data } = await apiInstance.apiUserRoleAssignPost(
    userRoleAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userRoleAssignRequest** | **UserRoleAssignRequest**|  | |


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

# **apiUserRoleDeleteDelete**
> apiUserRoleDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    UserRoleApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserRoleApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiUserRoleDeleteDelete(
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

# **apiUserRoleListGet**
> apiUserRoleListGet()


### Example

```typescript
import {
    UserRoleApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new UserRoleApi(configuration);

let userId: string; // (optional) (default to undefined)
let roleId: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiUserRoleListGet(
    userId,
    roleId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userId** | [**string**] |  | (optional) defaults to undefined|
| **roleId** | [**string**] |  | (optional) defaults to undefined|
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

