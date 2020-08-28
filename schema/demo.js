/**
* @api {post} /test_api desc_test_api
* @apiName test_api_name
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
* {{extraExample}}
*
* @apiSuccess {Number} [code=1] desc_override_code
* @apiSuccess {Object} data data_desc
* @apiSuccess {number} data.keyInDoc desc_add_extra_data_key_in_doc
*
* @apiSuccessExample {json} response_desc
* HTTP/1.1 200 OK
*  {
   "code": 200,
    "data": {
        "keyInExample": 1
  }
}
*
* @apiSuccessExample {json} error_desc
* HTTP/1.1 300 OK
* {{fooInJs:barInJs}}
*/