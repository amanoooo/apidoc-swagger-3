## apidoc-swagger-3.0

Apidoc and swagger are two nice projects which are focusing on documentation of APIs. 
This project is a middle tier which tries to bring them together in a sense that:
> It uses apidoc to convert inline documentation comments into json schema and later convert it to swagger json schema.

Uses the [apidoc-core](https://github.com/apidoc/apidoc-core) library.

## Why use it
Inspired by [apidoc-swagger](https://github.com/fsbahman/apidoc-swagger)  

The old repo may not be maintained, and not support new api-doc feature,  
such as

- **distinguish Query or Body in Post request**  
- **@apiHeader**

and this repo add new feature  

- **import apidoc resonse example to swagger response schema**
- **merge apidoc response schmema on apidoc response example (TODO)**
- swagger.json version 3.0


## How It Works

By putting in line comments in the source code like this in javascript, you will get `swagger.json` file which can be served to [swagger-ui](https://github.com/swagger-api/swagger-ui) to generate html overview of documentation.

`/schema/demo.js`:
```js
/**
* @api {post} /test_api desc test api
* @apiName post_name
* @apiGroup search
*
* @apiHeader {String} [taz] desc_taz
*
* @apiParam {Number} [tar] desc_tar
* @apiParam (Body) {Object[]} foo desc_foo
* @apiParam (Body) {String} foo.foz desc_foo.foz
* @apiParam (Query) {String} bar=bar desc_bar
*
* @apiParamExample {json} request_desc
*     {
*       "keyInExample": 4711
*     }
*
* @apiSuccess {Number} [code=1] desc_override_code
* @apiSuccess {Object} data data_desc
* @apiSuccess {number} data.keyInDoc desc_add_extra_data_key_in_doc
*
* @apiSuccessExample {json} response_desc
* HTTP/1.1 200 OK
*  {
*   "code": 200,
    "data": {
        "keyInExample": 1
  }
}
*/
```


it will output json [swagger.json](./doc/swagger.json)