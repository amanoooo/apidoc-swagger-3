/**
 * Created by hikaruamano on 2020/6/11 10:21 上午
 */

/**
 * @apiDefine storeId
 * @apiParam {String} storeId=800 desc_store_id
 */




/**
 * @apiDefine testResp1
 *
 * @apiSuccessExample Success-Response:
  HTTP/1.1 200 OK
  {
  "code": 200,
  "data": {
    "itemList": [
      {
        "popularSearchId": 1,
        "searchContent": "drink"
      },
      {
        "popularSearchId": 2,
        "searchContent": "food"
      }
    ],
    "pageNum": 0,
    "pageSize": 0,
    "pages": 0,
    "total": 0
  }
}
 */

/**
 * @apiDefine testResp2
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 201 OK
  {
  "code": 200,
  "data": {
    "test": 1
  }
}
 */

/**
 * @apiDefine testResp3
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 404 OK
 * {
  "code": 200,
  "data": {
    "test": 2
  }
}
 */


