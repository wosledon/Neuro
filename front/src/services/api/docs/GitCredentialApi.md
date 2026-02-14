# GitCredentialApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiGitCredentialDeleteDelete**](#apigitcredentialdeletedelete) | **DELETE** /api/GitCredential/Delete | |
|[**apiGitCredentialGetGet**](#apigitcredentialgetget) | **GET** /api/GitCredential/Get | |
|[**apiGitCredentialListGet**](#apigitcredentiallistget) | **GET** /api/GitCredential/List | |
|[**apiGitCredentialUpsertPost**](#apigitcredentialupsertpost) | **POST** /api/GitCredential/Upsert | |

# **apiGitCredentialDeleteDelete**
> apiGitCredentialDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    GitCredentialApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new GitCredentialApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiGitCredentialDeleteDelete(
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

# **apiGitCredentialGetGet**
> apiGitCredentialGetGet()


### Example

```typescript
import {
    GitCredentialApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new GitCredentialApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiGitCredentialGetGet(
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

# **apiGitCredentialListGet**
> apiGitCredentialListGet()


### Example

```typescript
import {
    GitCredentialApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new GitCredentialApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiGitCredentialListGet(
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

# **apiGitCredentialUpsertPost**
> apiGitCredentialUpsertPost(gitCredentialUpsertRequest)


### Example

```typescript
import {
    GitCredentialApi,
    Configuration,
    GitCredentialUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new GitCredentialApi(configuration);

let gitCredentialUpsertRequest: GitCredentialUpsertRequest; //

const { status, data } = await apiInstance.apiGitCredentialUpsertPost(
    gitCredentialUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **gitCredentialUpsertRequest** | **GitCredentialUpsertRequest**|  | |


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

