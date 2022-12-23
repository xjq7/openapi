import { Route } from './openapi';

export enum ApiMethod {
  get = 'Get',
  post = 'Post',
  put = 'Put',
  delete = 'Delete',
}

export const METHODS: (ApiMethod | string | undefined)[] = [
  ApiMethod.get,
  ApiMethod.post,
  ApiMethod.put,
  ApiMethod.delete,
];

export enum ControllerType {
  JsonController = 'JsonController',
  controller = 'Controller',
}

export interface IControllerRoute {
  type: ControllerType;
  path: string;
}

export interface IController {
  routes: IControllerRoute[];
  description: string;
  name: string;
  apis: Route[];
}

export const CONTROLLERS: ControllerType[] = [ControllerType.JsonController, ControllerType.controller];

export enum RoutingParamType {
  param = 'Param',
  body = 'Body',
  bodyParam = 'BodyParam',
  queryParam = 'QueryParam',
  queryParams = 'QueryParams',
}

export const ROUTINGPARAMS = [
  RoutingParamType.body,
  RoutingParamType.bodyParam,
  RoutingParamType.param,
  RoutingParamType.queryParam,
  RoutingParamType.queryParams,
];
