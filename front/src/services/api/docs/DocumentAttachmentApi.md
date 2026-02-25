# DocumentAttachmentApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiDocumentAttachmentBatchUploadPost**](#apidocumentattachmentbatchuploadpost) | **POST** /api/DocumentAttachment/batch-upload | |
|[**apiDocumentAttachmentContentGet**](#apidocumentattachmentcontentget) | **GET** /api/DocumentAttachment/content | |
|[**apiDocumentAttachmentDeletePost**](#apidocumentattachmentdeletepost) | **POST** /api/DocumentAttachment/delete | |
|[**apiDocumentAttachmentDownloadGet**](#apidocumentattachmentdownloadget) | **GET** /api/DocumentAttachment/download | |
|[**apiDocumentAttachmentListGet**](#apidocumentattachmentlistget) | **GET** /api/DocumentAttachment/list | |
|[**apiDocumentAttachmentMarkdownLinkGet**](#apidocumentattachmentmarkdownlinkget) | **GET** /api/DocumentAttachment/markdown-link | |
|[**apiDocumentAttachmentUpdatePost**](#apidocumentattachmentupdatepost) | **POST** /api/DocumentAttachment/update | |
|[**apiDocumentAttachmentUploadPost**](#apidocumentattachmentuploadpost) | **POST** /api/DocumentAttachment/upload | |

# **apiDocumentAttachmentBatchUploadPost**
> apiDocumentAttachmentBatchUploadPost()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let documentId: string; // (optional) (default to undefined)
let files: Array<File>; // (optional) (default to undefined)
let startSort: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentBatchUploadPost(
    documentId,
    files,
    startSort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentId** | [**string**] |  | (optional) defaults to undefined|
| **files** | **Array&lt;File&gt;** |  | (optional) defaults to undefined|
| **startSort** | **ApiAISupportListGetPageParameter** |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiDocumentAttachmentContentGet**
> apiDocumentAttachmentContentGet()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentContentGet(
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

# **apiDocumentAttachmentDeletePost**
> apiDocumentAttachmentDeletePost(batchDeleteRequest)


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration,
    BatchDeleteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let batchDeleteRequest: BatchDeleteRequest; //

const { status, data } = await apiInstance.apiDocumentAttachmentDeletePost(
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

# **apiDocumentAttachmentDownloadGet**
> apiDocumentAttachmentDownloadGet()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentDownloadGet(
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

# **apiDocumentAttachmentListGet**
> apiDocumentAttachmentListGet()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let documentId: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentListGet(
    documentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentId** | [**string**] |  | (optional) defaults to undefined|


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

# **apiDocumentAttachmentMarkdownLinkGet**
> apiDocumentAttachmentMarkdownLinkGet()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let id: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentMarkdownLinkGet(
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

# **apiDocumentAttachmentUpdatePost**
> apiDocumentAttachmentUpdatePost(documentAttachmentUpdateRequest)


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration,
    DocumentAttachmentUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let documentAttachmentUpdateRequest: DocumentAttachmentUpdateRequest; //

const { status, data } = await apiInstance.apiDocumentAttachmentUpdatePost(
    documentAttachmentUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentAttachmentUpdateRequest** | **DocumentAttachmentUpdateRequest**|  | |


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

# **apiDocumentAttachmentUploadPost**
> apiDocumentAttachmentUploadPost()


### Example

```typescript
import {
    DocumentAttachmentApi,
    Configuration,
    ApiAISupportListGetPageParameter
} from './api';

const configuration = new Configuration();
const apiInstance = new DocumentAttachmentApi(configuration);

let documentId: string; // (optional) (default to undefined)
let file: File; // (optional) (default to undefined)
let isInline: boolean; // (optional) (default to undefined)
let sort: ApiAISupportListGetPageParameter; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiDocumentAttachmentUploadPost(
    documentId,
    file,
    isInline,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **documentId** | [**string**] |  | (optional) defaults to undefined|
| **file** | [**File**] |  | (optional) defaults to undefined|
| **isInline** | [**boolean**] |  | (optional) defaults to undefined|
| **sort** | **ApiAISupportListGetPageParameter** |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

