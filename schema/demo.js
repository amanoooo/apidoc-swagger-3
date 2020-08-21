/**
 * @api {post} /testpost 测试post
 * @apiName post_name
 * @apiGroup search
 *
 * @apiHeader {String} a0=xx desc_a0_in_header
 *
 * @apiParam {Object} [a1] desc_a1
 * @apiParam {Object} [a1.a2] desc_a1_a2
 * @apiParam {String} [a1.a2.a4] desc_a1_a2_a4
 * @apiParam {String} [a1.a3] desc_a1_a3
 * @apiParam (Query) {String} a5=a55 desc_a5_should_id_header
 * @apiParam {Object[]} [a6] desc_object_array_a6
 * @apiParam {string[]} [a6.a7] desc_a6_a7
 * @apiParam {string[]} [a8] a88
 * @apiUse testResp1
 * @apiUse testResp2
 * @apiParam {Number} [a9=99] desc_a9
 *
 * @apiSuccess {Number} code return code
 */



/**
* @api {get} /testget desc_test_get
* @apiName get_name
* @apiGroup search
*
* @apiParam {String} [b1=xxx] desc_b1
* @apiParam (Body) {Object[]} b2 desc_b2
* @apiParam (Body) {Object[]} b2.b3 desc_b2_b3
* @apiParam (Body) {Number} b2.b3.b4 desc_b2_b3_b4
* @apiParam (Body) {String[]} b2.b5 desc_b2_b5
*
* @apiSuccessExample Success-Response:
* HTTP/1.1 200 OK
*  {
*   "code": 200,
    "data": {
    "test": 1
  }
}
*/