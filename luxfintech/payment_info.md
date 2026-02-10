# Payments Status | API Docs

Retrieves the payment status of a specific order using its unique order ID.

```
GET/payment/status
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/payment_status#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Request Parameters[​](https://docs.luxfintech.org/docs/api/rest-api/payment_status#request-parameters "Direct link to Request Parameters")

Field

Type

Description

Required

`payment_id`

string (ISO8601)

The unique id of the payment order.

✅

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/payment_status#response-fields "Direct link to Response Fields")

-   200

-   400
-   401

{

2 items

"status":

"PENDING"

"data":{

...

}

7 items

}

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/payment_status#request-samples "Direct link to Request Samples")

```
    curl -X GET https://luxfin.org/payment/status?payment_id=0 \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \
```

---
Source: [Payments Status | API Docs](https://docs.luxfintech.org/docs/api/rest-api/payment_status)