# TeamProjectApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTeamProjectAssignPost**](#apiteamprojectassignpost) | **POST** /api/TeamProject/Assign | |
|[**apiTeamProjectDeleteDelete**](#apiteamprojectdeletedelete) | **DELETE** /api/TeamProject/Delete | |
|[**apiTeamProjectListGet**](#apiteamprojectlistget) | **GET** /api/TeamProject/List | |

# **apiTeamProjectAssignPost**
> apiTeamProjectAssignPost(teamProjectAssignRequest)


### Example

```typescript
import {
    TeamProjectApi,
    Configuration,
    TeamProjectAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamProjectApi(configuration);

let teamProjectAssignRequest: TeamProjectAssignRequest; //

const { status, data } = await apiInstance.apiTeamProjectAssignPost(
    teamProjectAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamProjectAssignRequest** | **TeamProjectAssignRequest**|  | |


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

# **apiTeamProjectDeleteDelete**
> apiTeamProjectDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    TeamProjectApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamProjectApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiTeamProjectDeleteDelete(
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

# **apiTeamProjectListGet**
> apiTeamProjectListGet()


### Example

```typescript
import {
    TeamProjectApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamProjectApi(configuration);

let teamId: string; // (optional) (default to undefined)
let projectId: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiTeamProjectListGet(
    teamId,
    projectId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamId** | [**string**] |  | (optional) defaults to undefined|
| **projectId** | [**string**] |  | (optional) defaults to undefined|
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

