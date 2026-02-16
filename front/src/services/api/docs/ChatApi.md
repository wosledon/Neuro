# ChatApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiChatAskPost**](#apichataskpost) | **POST** /api/Chat/ask | |
|[**apiChatSearchPost**](#apichatsearchpost) | **POST** /api/Chat/search | |

# **apiChatAskPost**
> apiChatAskPost(chatAskRequest)


### Example

```typescript
import {
    ChatApi,
    Configuration,
    ChatAskRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ChatApi(configuration);

let chatAskRequest: ChatAskRequest; //

const { status, data } = await apiInstance.apiChatAskPost(
    chatAskRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **chatAskRequest** | **ChatAskRequest**|  | |


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

# **apiChatSearchPost**
> apiChatSearchPost(chatSearchRequest)


### Example

```typescript
import {
    ChatApi,
    Configuration,
    ChatSearchRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ChatApi(configuration);

let chatSearchRequest: ChatSearchRequest; //

const { status, data } = await apiInstance.apiChatSearchPost(
    chatSearchRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **chatSearchRequest** | **ChatSearchRequest**|  | |


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

