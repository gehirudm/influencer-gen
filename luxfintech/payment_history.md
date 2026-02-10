# Payments History | API Docs

Returns a list of your order payments that match the specified reference. Results are returned in reverse chronological order, with the most recent payments shown first.

```
POST/payment/history
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/payment_history#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Request Parameters[​](https://docs.luxfintech.org/docs/api/rest-api/payment_history#request-parameters "Direct link to Request Parameters")

Field

Type

Description

Required

`start_date`

string (ISO8601)

Start of the date range filter. Records created on or after this date will be included.

✅

`end_date`

string (ISO8601)

End of the date range filter. Records created before or on this date will be included.

✅

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/payment_history#response-fields "Direct link to Response Fields")

Field

Type

Description

Required

`amount`

Number

The total sum of all returned order amounts in the result set.

✅

`data`

Array of objects

A list of order objects returned by the query.

✅

-   200

-   400
-   401

{

2 items

"amount":

0

"data":\[

1 item

0:{

7 items

"id":

0

"Amount":

0

"currency":

"string"

"customer":

"string"

"product":

"string"

"hook\_url":

"string"

"status":

"PENDING"

}

\]

}

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/payment_history#request-samples "Direct link to Request Samples")

```
    curl -X POST https://luxfin.org/payment/history \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \      -d '{            "start_date": "2019-08-24T14:15:22Z",            "end_date": "2019-08-24T14:15:22Z"        }'
```

---
Source: [Payments History | API Docs](https://docs.luxfintech.org/docs/api/rest-api/payment_history)