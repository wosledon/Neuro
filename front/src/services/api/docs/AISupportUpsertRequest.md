# AISupportUpsertRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**provider** | **number** |  | [optional] [default to undefined]
**apiKey** | **string** |  | [optional] [default to undefined]
**endpoint** | **string** |  | [optional] [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**isEnabled** | **boolean** |  | [optional] [default to undefined]
**isPin** | **boolean** |  | [optional] [default to undefined]
**modelName** | **string** |  | [optional] [default to undefined]
**maxTokens** | [**AISupportUpsertRequestMaxTokens**](AISupportUpsertRequestMaxTokens.md) |  | [optional] [default to undefined]
**temperature** | [**AISupportUpsertRequestTemperature**](AISupportUpsertRequestTemperature.md) |  | [optional] [default to undefined]
**topP** | [**AISupportUpsertRequestTemperature**](AISupportUpsertRequestTemperature.md) |  | [optional] [default to undefined]
**frequencyPenalty** | [**AISupportUpsertRequestTemperature**](AISupportUpsertRequestTemperature.md) |  | [optional] [default to undefined]
**presencePenalty** | [**AISupportUpsertRequestTemperature**](AISupportUpsertRequestTemperature.md) |  | [optional] [default to undefined]
**customParameters** | **string** |  | [optional] [default to undefined]
**sort** | [**AISupportUpsertRequestMaxTokens**](AISupportUpsertRequestMaxTokens.md) |  | [optional] [default to undefined]

## Example

```typescript
import { AISupportUpsertRequest } from './api';

const instance: AISupportUpsertRequest = {
    id,
    name,
    provider,
    apiKey,
    endpoint,
    description,
    isEnabled,
    isPin,
    modelName,
    maxTokens,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    customParameters,
    sort,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
