import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.local.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.local.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.local.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
  }
  DELETE: {
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}