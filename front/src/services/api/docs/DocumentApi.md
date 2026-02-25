# DocumentApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDocumentBatchMoveBatchMovePost**](#apidocumentbatchmovebatchmovepost) | **POST** /api/Document/BatchMove/batch-move | |
|[**apiDocumentDeleteDelete**](#apidocumentdeletedelete) | **DELETE** /api/Document/Delete | |
|[**apiDocumentGetBreadcrumbBreadcrumbGet**](#apidocumentgetbreadcrumbbreadcrumbget) | **GET** /api/Document/GetBreadcrumb/breadcrumb | |
|[**apiDocumentGetChildrenChildrenGet**](#apidocumentgetchildrenchildrenget) | **GET** /api/Document/GetChildren/children | |
|[**apiDocumentGetDetailGet**](#apidocumentgetdetailget) | **GET** /api/Document/Get/detail | |
|[**apiDocumentGetTreeByProjectsTreeByProjectsGet**](#apidocumentgettreebyprojectstreebyprojectsget) | **GET** /api/Document/GetTreeByProjects/tree-by-projects | |
|[**apiDocumentGetTreeTreeGet**](#apidocumentgettreetreeget) | **GET** /api/Document/GetTree/tree | |
|[**apiDocumentListGet**](#apidocumentlistget) | **GET** /api/Document/List | |
|[**apiDocumentMoveMovePost**](#apidocumentmovemovepost) | **POST** /api/Document/Move/move | |
|[**apiDocumentTriggerProjectVectorizationVectorizeProjectPost**](#apidocumenttriggerprojectvectorizationvectorizeprojectpost) | **POST** /api/Document/TriggerProjectVectorization/vectorize-project | |
|[**apiDocumentTriggerVectorizationVectorizePost**](#apidocumenttriggervectorizationvectorizepost) | **POST** /api/Document/TriggerVectorization/vectorize | |
|[**apiDocumentUpsertPost**](#apidocumentupsertpost) | **POST** /api/Document/Upsert | |

# **apiDocumentBatchMoveBatchMovePost**
> apiDocumentBatchMoveBatchMovePost(documentBatchMoveRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    DocumentBatchMoveRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let documentBatchMoveRequest: DocumentBatchMoveRequest; //

const { status, data } = await apiInstance.apiDocumentBatchMoveBatchMovePost(
    documentBatchMoveRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentBatchMoveRequest** | **DocumentBatchMoveRequest**|  | |


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

# **apiDocumentDeleteDelete**
> apiDocumentDeleteDelete(batchDeleteRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiDocumentDeleteDelete(
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

# **apiDocumentGetBreadcrumbBreadcrumbGet**
> apiDocumentGetBreadcrumbBreadcrumbGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentGetBreadcrumbBreadcrumbGet(
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

# **apiDocumentGetChildrenChildrenGet**
> apiDocumentGetChildrenChildrenGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let parentId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentGetChildrenChildrenGet(
    parentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **parentId** | [**string**] |  | (optional) defaults to undefined|


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

# **apiDocumentGetDetailGet**
> apiDocumentGetDetailGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentGetDetailGet(
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

# **apiDocumentGetTreeByProjectsTreeByProjectsGet**
> apiDocumentGetTreeByProjectsTreeByProjectsGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

const { status, data } = await apiInstance.apiDocumentGetTreeByProjectsTreeByProjectsGet();
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

# **apiDocumentGetTreeTreeGet**
> apiDocumentGetTreeTreeGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let projectId: string; // (optional) (default to undefined)
let parentId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentGetTreeTreeGet(
    projectId,
    parentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | (optional) defaults to undefined|
| **parentId** | [**string**] |  | (optional) defaults to undefined|


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

# **apiDocumentListGet**
> apiDocumentListGet()


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    ApiAISupportListGetPageParameter,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let keyword: string; // (optional) (default to undefined)
let page: ApiAISupportListGetPageParameter; // (optional) (default to undefined)
let pageSize: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentListGet(
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

# **apiDocumentMoveMovePost**
> apiDocumentMoveMovePost(documentMoveRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    DocumentMoveRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let documentMoveRequest: DocumentMoveRequest; //

const { status, data } = await apiInstance.apiDocumentMoveMovePost(
    documentMoveRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentMoveRequest** | **DocumentMoveRequest**|  | |


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

# **apiDocumentTriggerProjectVectorizationVectorizeProjectPost**
> apiDocumentTriggerProjectVectorizationVectorizeProjectPost()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let projectId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentTriggerProjectVectorizationVectorizeProjectPost(
    projectId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **projectId** | [**string**] |  | (optional) defaults to undefined|


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

# **apiDocumentTriggerVectorizationVectorizePost**
> apiDocumentTriggerVectorizationVectorizePost()


### Example

```typescript
import {
    DocumentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentTriggerVectorizationVectorizePost(
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

# **apiDocumentUpsertPost**
> apiDocumentUpsertPost(documentUpsertRequest)


### Example

```typescript
import {
    DocumentApi,
    Configuration,
    DocumentUpsertRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentApi(configuration);

let documentUpsertRequest: DocumentUpsertRequest; //

const { status, data } = await apiInstance.apiDocumentUpsertPost(
    documentUpsertRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentUpsertRequest** | **DocumentUpsertRequest**|  | |


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

