import { Api } from './openapi';

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
  controller = 'controller',
}

export interface IControllerPath {
  type: ControllerType;
  path: string;
}

export interface IController {
  paths: IControllerPath[];
  description: string;
  name: string;
  apis: Api[];
}

export const CONTROLLERS: ControllerType[] = [ControllerType.JsonController, ControllerType.controller];
