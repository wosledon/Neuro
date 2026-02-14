# TeamApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTeamAssignUsersAssignUsersPost**](#apiteamassignusersassignuserspost) | **POST** /api/Team/AssignUsers/assign-users | |
|[**apiTeamDeleteDelete**](#apiteamdeletedelete) | **DELETE** /api/Team/Delete | |
|[**apiTeamGetGet**](#apiteamgetget) | **GET** /api/Team/Get | |
|[**apiTeamGetTeamProjectsIdProjectsGet**](#apiteamgetteamprojectsidprojectsget) | **GET** /api/Team/GetTeamProjects/{id}/projects | |
|[**apiTeamGetTeamUsersIdUsersGet**](#apiteamgetteamusersidusersget) | **GET** /api/Team/GetTeamUsers/{id}/users | |
|[**apiTeamListGet**](#apiteamlistget) | **GET** /api/Team/List | |
|[**apiTeamUpsertPost**](#apiteamupsertpost) | **POST** /api/Team/Upsert | |

# **apiTeamAssignUsersAssignUsersPost**
> apiTeamAssignUsersAssignUsersPost(teamUserAssignRequest)


### Example

```typescript
import {
    TeamApi,
    Configuration,
    TeamUserAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let teamUserAssignRequest: TeamUserAssignRequest; //

const { status, data } = await apiInstance.apiTeamAssignUsersAssignUsersPost(
    teamUserAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamUserAssignRequest** | **TeamUserAssignRequest**|  | |


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

# **apiTeamDeleteDelete**
> apiTeamDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    TeamApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiTeamDeleteDelete(
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

# **apiTeamGetGet**
> apiTeamGetGet()


### Example

```typescript
import {
    TeamApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiTeamGetGet(
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

# **apiTeamGetTeamProjectsIdProjectsGet**
> apiTeamGetTeamProjectsIdProjectsGet()


### Example

```typescript
import {
    TeamApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiTeamGetTeamProjectsIdProjectsGet(
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

# **apiTeamGetTeamUsersIdUsersGet**
> apiTeamGetTeamUsersIdUsersGet()


### Example

```typescript
import {
    TeamApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.apiTeamGetTeamUsersIdUsersGet(
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

# **apiTeamListGet**
> apiTeamListGet()


### Example

```typescript
import {
    TeamApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiTeamListGet(
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

# **apiTeamUpsertPost**
> apiTeamUpsertPost(teamUpsertRequest)


### Example

```typescript
import {
    TeamApi,
    Configuration,
    TeamUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamApi(configuration);

let teamUpsertRequest: TeamUpsertRequest; //

const { status, data } = await apiInstance.apiTeamUpsertPost(
    teamUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamUpsertRequest** | **TeamUpsertRequest**|  | |


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

