# GitCredentialUpsertRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**gitAccountId** | **string** |  | [optional] [default to undefined]
**type** | **number** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**encryptedSecret** | **string** |  | [optional] [default to undefined]
**publicKey** | **string** |  | [optional] [default to undefined]
**passphraseEncrypted** | **string** |  | [optional] [default to undefined]
**isActive** | **boolean** |  | [optional] [default to undefined]
**notes** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { GitCredentialUpsertRequest } from './api';

const instance: GitCredentialUpsertRequest = {
    id,
    gitAccountId,
    type,
    name,
    encryptedSecret,
    publicKey,
    passphraseEncrypted,
    isActive,
    notes,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
