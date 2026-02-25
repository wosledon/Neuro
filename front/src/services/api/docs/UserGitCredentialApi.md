# UserGitCredentialApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiUserGitCredentialAssignPost**](#apiusergitcredentialassignpost) | **POST** /api/UserGitCredential/Assign | |
|[**apiUserGitCredentialDeleteDelete**](#apiusergitcredentialdeletedelete) | **DELETE** /api/UserGitCredential/Delete | |
|[**apiUserGitCredentialListGet**](#apiusergitcredentiallistget) | **GET** /api/UserGitCredential/List | |

# **apiUserGitCredentialAssignPost**
> apiUserGitCredentialAssignPost(userGitCredentialAssignRequest)


### Example

```typescript
import {
    UserGitCredentialApi,
    Configuration,
    UserGitCredentialAssignRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserGitCredentialApi(configuration);

let userGitCredentialAssignRequest: UserGitCredentialAssignRequest; //

const { status, data } = await apiInstance.apiUserGitCredentialAssignPost(
    userGitCredentialAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userGitCredentialAssignRequest** | **UserGitCredentialAssignRequest**|  | |


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

# **apiUserGitCredentialDeleteDelete**
> apiUserGitCredentialDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    UserGitCredentialApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new UserGitCredentialApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiUserGitCredentialDeleteDelete(
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

# **apiUserGitCredentialListGet**
> apiUserGitCredentialListGet()


### Example

```typescript
import {
    UserGitCredentialApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new UserGitCredentialApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiUserGitCredentialListGet(
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

