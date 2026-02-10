# Test Webhook | API Docs

Used to help debug your webhook url. If you get a correct response, your webhook will officially receive messages from luxfin.

```
GET/payment/test_webhook
```

### Authentication[​](https://docs.luxfintech.org/docs/api/rest-api/test_webhook#authentication "Direct link to Authentication")

```
Authorization: Bearer <YOUR_API_key>
```

### Response Fields[​](https://docs.luxfintech.org/docs/api/rest-api/test_webhook#response-fields "Direct link to Response Fields")

Please refer to the [webhook](https://docs.luxfintech.org/docs/tutorial/get-start/webhook) for the data Luxfin sends to your endpoint

-   200

-   400
-   401

{

4 items

"order\_id":

0

"status":

"SUCCESS"

"amount":

0.01

"product":

"test product"

}

### Request Samples[​](https://docs.luxfintech.org/docs/api/rest-api/test_webhook#request-samples "Direct link to Request Samples")

```
    curl -X GET https://luxfin.org/payment/test_webhook \      -H "Authorization: Bearer YOUR_API_KEY" \      -H "Content-Type: application/json" \
```

---
Source: [Test Webhook | API Docs](https://docs.luxfintech.org/docs/api/rest-api/test_webhook)