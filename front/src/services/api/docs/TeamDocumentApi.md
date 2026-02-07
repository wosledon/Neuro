# TeamDocumentApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiTeamDocumentAssignPost**](#apiteamdocumentassignpost) | **POST** /api/TeamDocument/Assign | |
|[**apiTeamDocumentDeleteDelete**](#apiteamdocumentdeletedelete) | **DELETE** /api/TeamDocument/Delete | |
|[**apiTeamDocumentListGet**](#apiteamdocumentlistget) | **GET** /api/TeamDocument/List | |

# **apiTeamDocumentAssignPost**
> apiTeamDocumentAssignPost(teamDocumentAssignRequest)


### Example

```typescript
import {
    TeamDocumentApi,
    Configuration,
    TeamDocumentAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamDocumentApi(configuration);

let teamDocumentAssignRequest: TeamDocumentAssignRequest; //

const { status, data } = await apiInstance.apiTeamDocumentAssignPost(
    teamDocumentAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamDocumentAssignRequest** | **TeamDocumentAssignRequest**|  | |


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

# **apiTeamDocumentDeleteDelete**
> apiTeamDocumentDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    TeamDocumentApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamDocumentApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiTeamDocumentDeleteDelete(
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

# **apiTeamDocumentListGet**
> apiTeamDocumentListGet()


### Example

```typescript
import {
    TeamDocumentApi,
    Configuration,
    ApiDocumentListGetPageParameter,
    ApiDocumentListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new TeamDocumentApi(configuration);

let teamId: string; // (optional) (default to undefined)
let documentId: string; // (optional) (default to undefined)
let page: ApiDocumentListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiDocumentListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiTeamDocumentListGet(
    teamId,
    documentId,
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **teamId** | [**string**] |  | (optional) defaults to undefined|
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

