# RoleApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiRoleDeleteDelete**](#apiroledeletedelete) | **DELETE** /api/Role/Delete | |
|[**apiRoleGetGet**](#apirolegetget) | **GET** /api/Role/Get | |
|[**apiRoleGetRoleMenusIdMenusGet**](#apirolegetrolemenusidmenusget) | **GET** /api/Role/GetRoleMenus/{id}/menus | |
|[**apiRoleGetRolePermissionsIdPermissionsGet**](#apirolegetrolepermissionsidpermissionsget) | **GET** /api/Role/GetRolePermissions/{id}/permissions | |
|[**apiRoleGetRoleUsersIdUsersGet**](#apirolegetroleusersidusersget) | **GET** /api/Role/GetRoleUsers/{id}/users | |
|[**apiRoleListGet**](#apirolelistget) | **GET** /api/Role/List | |
|[**apiRoleUpsertPost**](#apiroleupsertpost) | **POST** /api/Role/Upsert | |

# **apiRoleDeleteDelete**
> apiRoleDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    RoleApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiRoleDeleteDelete(
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

# **apiRoleGetGet**
> apiRoleGetGet()


### Example

```typescript
import {
    RoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRoleGetGet(
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

# **apiRoleGetRoleMenusIdMenusGet**
> apiRoleGetRoleMenusIdMenusGet()


### Example

```typescript
import {
    RoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiRoleGetRoleMenusIdMenusGet(
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

# **apiRoleGetRolePermissionsIdPermissionsGet**
> apiRoleGetRolePermissionsIdPermissionsGet()


### Example

```typescript
import {
    RoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiRoleGetRolePermissionsIdPermissionsGet(
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

# **apiRoleGetRoleUsersIdUsersGet**
> apiRoleGetRoleUsersIdUsersGet()


### Example

```typescript
import {
    RoleApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiRoleGetRoleUsersIdUsersGet(
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

# **apiRoleListGet**
> apiRoleListGet()


### Example

```typescript
import {
    RoleApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiRoleListGet(
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

# **apiRoleUpsertPost**
> apiRoleUpsertPost(roleUpsertRequest)


### Example

```typescript
import {
    RoleApi,
    Configuration,
    RoleUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new RoleApi(configuration);

let roleUpsertRequest: RoleUpsertRequest; //

const { status, data } = await apiInstance.apiRoleUpsertPost(
    roleUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **roleUpsertRequest** | **RoleUpsertRequest**|  | |


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

