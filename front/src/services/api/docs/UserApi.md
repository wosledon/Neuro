# UserApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUserDeleteDelete**](#apiuserdeletedelete) | **DELETE** /api/User/Delete | |
|[**apiUserGetGet**](#apiusergetget) | **GET** /api/User/Get | |
|[**apiUserGetUserMenusIdMenusGet**](#apiusergetusermenusidmenusget) | **GET** /api/User/GetUserMenus/{id}/menus | |
|[**apiUserGetUserPermissionsIdPermissionsGet**](#apiusergetuserpermissionsidpermissionsget) | **GET** /api/User/GetUserPermissions/{id}/permissions | |
|[**apiUserGetUserRolesIdRolesGet**](#apiusergetuserrolesidrolesget) | **GET** /api/User/GetUserRoles/{id}/roles | |
|[**apiUserGetUserTeamsIdTeamsGet**](#apiusergetuserteamsidteamsget) | **GET** /api/User/GetUserTeams/{id}/teams | |
|[**apiUserListGet**](#apiuserlistget) | **GET** /api/User/List | |
|[**apiUserProfileGet**](#apiuserprofileget) | **GET** /api/User/Profile | |
|[**apiUserUpsertPost**](#apiuserupsertpost) | **POST** /api/User/Upsert | |

# **apiUserDeleteDelete**
> apiUserDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    UserApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiUserDeleteDelete(
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

# **apiUserGetGet**
> apiUserGetGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiUserGetGet(
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

# **apiUserGetUserMenusIdMenusGet**
> apiUserGetUserMenusIdMenusGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiUserGetUserMenusIdMenusGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


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

# **apiUserGetUserPermissionsIdPermissionsGet**
> apiUserGetUserPermissionsIdPermissionsGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiUserGetUserPermissionsIdPermissionsGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


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

# **apiUserGetUserRolesIdRolesGet**
> apiUserGetUserRolesIdRolesGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiUserGetUserRolesIdRolesGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


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

# **apiUserGetUserTeamsIdTeamsGet**
> apiUserGetUserTeamsIdTeamsGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiUserGetUserTeamsIdTeamsGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


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

# **apiUserListGet**
> apiUserListGet()


### Example

```typescript
import {
    UserApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiUserListGet(
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

# **apiUserProfileGet**
> apiUserProfileGet()


### Example

```typescript
import {
    UserApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

const { status, data } = await apiInstance.apiUserProfileGet();
```

### Parameters
This endpoint does not have any parameters.


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

# **apiUserUpsertPost**
> apiUserUpsertPost(userUpsertRequest)


### Example

```typescript
import {
    UserApi,
    Configuration,
    UserUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserApi(configuration);

let userUpsertRequest: UserUpsertRequest; //

const { status, data } = await apiInstance.apiUserUpsertPost(
    userUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userUpsertRequest** | **UserUpsertRequest**|  | |


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

