# Payments List | API Docs

Returns a list of your order payments that match the specified reference. Results are returned in reverse chronological order, with the most recent payments shown first.

```
GET/payments
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/listpayments#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Request Parameters[​](https://docs.luxfintech.org/docs/api/rest-api/listpayments#request-parameters "Direct link to Request Parameters")

Field

Type

Description

Required

`limit`

integer

The maximum number of records to return. Default is 10.

❌

`offset`

integer

The number of records to skip before starting to return results. Used for pagination. Default is 0.

❌

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/listpayments#response-fields "Direct link to Response Fields")

-   200
{3 items
"limit":0
"offset":0
"data":[3 items
0:{7 items
"id":0
"Amount":0
"currency":"string"
"customer":"string"
"product":"string"
"hook_url":"string"
"status":"PENDING"
}
1:{7 items
"id":1
"Amount":10
"currency":"string"
"customer":"string"
"product":"string"
"hook_url":"string"
"status":"SUCCESS"
}
2:{7 items
"id":2
"Amount":20
"currency":"string"
"customer":"string"
"product":"string"
"hook_url":"string"
"status":"EXPIRED"
}
]
}

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/listpayments#request-samples "Direct link to Request Samples")

```
    curl -X GET https://luxfin.org/payments?limit=100&offset=10 \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \
```

---
Source: [Payments List | API Docs](https://docs.luxfintech.org/docs/api/rest-api/listpayments)