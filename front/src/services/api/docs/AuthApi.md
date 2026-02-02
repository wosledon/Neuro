# AuthApi

All URIs are relative to *http://localhost:5146*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiAuthLoginLoginPost**](#apiauthloginloginpost) | **POST** /api/Auth/Login/login | |
|[**apiAuthLogoutLogoutPost**](#apiauthlogoutlogoutpost) | **POST** /api/Auth/Logout/logout | |
|[**apiAuthMeMeGet**](#apiauthmemeget) | **GET** /api/Auth/Me/me | |
|[**apiAuthRefreshRefreshPost**](#apiauthrefreshrefreshpost) | **POST** /api/Auth/Refresh/refresh | |
|[**apiAuthRegisterRegisterPost**](#apiauthregisterregisterpost) | **POST** /api/Auth/Register/register | |

# **apiAuthLoginLoginPost**
> apiAuthLoginLoginPost(loginRequest)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    LoginRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let loginRequest: LoginRequest; //

const { status, data } = await apiInstance.apiAuthLoginLoginPost(
    loginRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginRequest** | **LoginRequest**|  | |


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

# **apiAuthLogoutLogoutPost**
> apiAuthLogoutLogoutPost(loginResponse)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    LoginResponse
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let loginResponse: LoginResponse; //

const { status, data } = await apiInstance.apiAuthLogoutLogoutPost(
    loginResponse
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginResponse** | **LoginResponse**|  | |


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

# **apiAuthMeMeGet**
> apiAuthMeMeGet()


### Example

```typescript
import {
    AuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

const { status, data } = await apiInstance.apiAuthMeMeGet();
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

# **apiAuthRefreshRefreshPost**
> apiAuthRefreshRefreshPost(loginResponse)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    LoginResponse
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let loginResponse: LoginResponse; //

const { status, data } = await apiInstance.apiAuthRefreshRefreshPost(
    loginResponse
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginResponse** | **LoginResponse**|  | |


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

# **apiAuthRegisterRegisterPost**
> apiAuthRegisterRegisterPost(registerRequest)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    RegisterRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let registerRequest: RegisterRequest; //

const { status, data } = await apiInstance.apiAuthRegisterRegisterPost(
    registerRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **registerRequest** | **RegisterRequest**|  | |


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

